"""
SafeSign ICU Monitoring System - FastAPI Backend
================================================

A production-ready ICU patient monitoring system with:
- FastAPI for high-performance async API
- JWT-based authentication with role-based access control
- SQLite database with SQLAlchemy ORM
- Real-time video streaming via SocketIO
- Computer vision for patient monitoring (MediaPipe)
- Telegram notifications for alerts
- Automatic API documentation (Swagger UI, ReDoc)
- System monitoring and analytics

Author: SafeSign Development Team
Version: 2.0.0
"""

import os
import sys
import time
import base64
import threading
import asyncio
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Optional, List
from io import BytesIO



import cv2
import numpy as np
import requests
from fastapi import FastAPI, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi_socketio import SocketManager
from sqlalchemy.orm import Session
from sqlalchemy import func

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from .env file
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print("✅ Environment loaded from .env")

# Import local modules
from models.database import get_db, init_db, Base, engine
from models.models import User, Patient, Vitals, Alert, AlertType, PatientStatus, SystemMetrics, UserRole
from sqlalchemy import create_engine, text, inspect
from models.schemas import (
    UserLogin, TokenResponse, PatientCreate, PatientUpdate, PatientResponse,
    VitalsCreate, VitalsResponse, AlertCreate, AlertResponse, AlertListResponse,
    MonitoringStatus, HealthCheck, SystemPerformance, PatientTrends
)
from auth.jwt_handler import create_token_response, decode_token, create_refresh_token
from auth.auth_service import AuthService, get_auth_service
from dependencies import get_current_user, require_admin, require_doctor_or_admin
from crud.patient_crud import PatientCRUD, get_patient_crud
from crud.vitals_crud import VitalsCRUD, get_vitals_crud
from crud.alert_crud import AlertCRUD, get_alert_crud


# ==================== Configuration ====================

# Telegram Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN", "8459061712:AAGSS2cebHm310o15SRcDlO3ROYdXaXRlBA")
CHAT_ID = os.getenv("CHAT_ID", "1847643019")

# Camera Configuration
DROIDCAM_IP = os.getenv("DROIDCAM_IP", "10.95.126.251")
DROIDCAM_PORT = int(os.getenv("DROIDCAM_PORT", 4747))
USE_DROIDCAM = os.getenv("USE_DROIDCAM", "False").lower() == "true"

# Application Configuration
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
API_VERSION = "2.0.0"
START_TIME = time.time()


# ==================== Global State ====================

# Monitoring state
monitoring_active = False
camera = None
camera_lock = threading.Lock()
frame_count = 0
last_frame_time = None
main_loop = None  # To store the main event loop

# Computer vision state
MEDIAPIPE_AVAILABLE = False
mp_hands = mp_face = mp_pose = mp_drawing = None
hands = face_mesh = pose = None


# ==================== Helper Functions ====================

def send_telegram(msg: str) -> bool:
    """Send message to Telegram chat."""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    try:
        response = requests.post(
            url,
            data={
                "chat_id": CHAT_ID,
                "text": msg,
                "parse_mode": "HTML"
            },
            timeout=10
        )
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Telegram error: {e}")
        return False


def init_computer_vision():
    """Initialize MediaPipe for computer vision."""
    global MEDIAPIPE_AVAILABLE, mp_hands, mp_face, mp_pose, mp_drawing
    global hands, face_mesh, pose
    
    try:
        import mediapipe as mp
        mp_hands = mp.solutions.hands
        mp_face = mp.solutions.face_mesh
        mp_pose = mp.solutions.pose
        mp_drawing = mp.solutions.drawing_utils

        hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        face_mesh = mp_face.FaceMesh(refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5)
        pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        MEDIAPIPE_AVAILABLE = True
        print("✅ MediaPipe loaded successfully")
        return True
    except ImportError as e:
        print(f"⚠️ MediaPipe not available: {e}")
        MEDIAPIPE_AVAILABLE = False
        return False


def frame_movement(prev_gray, cur_gray) -> int:
    """Calculate movement between frames."""
    diff = cv2.absdiff(prev_gray, cur_gray)
    blur = cv2.GaussianBlur(diff, (5, 5), 0)
    _, th = cv2.threshold(blur, 20, 255, cv2.THRESH_BINARY)
    return int(np.sum(th) / 255)


def eye_aspect_ratio(landmarks, eye_idx, w, h):
    """Calculate eye aspect ratio for blink detection."""
    pts = [(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in eye_idx]
    def dist(a, b): return np.linalg.norm(np.array(a) - np.array(b))
    return (dist(pts[1], pts[5]) + dist(pts[2], pts[4])) / (2.0 * dist(pts[0], pts[3]))


def detect_emotion(landmarks, w, h):
    """Detect emotion from facial landmarks."""
    try:
        left_brow = landmarks[70]
        right_brow = landmarks[300]
        mouth_left = landmarks[61]
        mouth_right = landmarks[291]
        mouth_top = landmarks[13]
        mouth_bottom = landmarks[14]
        left_eye_top = landmarks[159]
        left_eye_bottom = landmarks[145]

        def to_xy(lm): return int(lm.x * w), int(lm.y * h)
        l_brow, r_brow = to_xy(left_brow), to_xy(right_brow)
        m_left, m_right, m_top, m_bottom = to_xy(mouth_left), to_xy(mouth_right), to_xy(mouth_top), to_xy(mouth_bottom)
        l_eye_t, l_eye_b = to_xy(left_eye_top), to_xy(left_eye_bottom)

        mouth_width = np.linalg.norm(np.array(m_left) - np.array(m_right))
        mouth_height = np.linalg.norm(np.array(m_top) - np.array(m_bottom))
        brow_dist = abs(l_brow[1] - r_brow[1])
        eye_openness = abs(l_eye_t[1] - l_eye_b[1])

        if eye_openness < 3 and mouth_height > 0.25 * mouth_width:
            return "Pain"
        elif brow_dist > 25 and mouth_height < 0.15 * mouth_width:
            return "Sad"
        else:
            return "Neutral"
    except:
        return "Neutral"


def sync_emit(event, data, room=None):
    """Emit socketio event safely from background thread."""
    if main_loop and main_loop.is_running():
        asyncio.run_coroutine_threadsafe(socketio.emit(event, data, room=room), main_loop)
    else:
        # Fallback if loop not available (shouldn't happen if initialized correctly)
        pass


# ==================== Camera Monitoring Thread ====================

def camera_monitoring_thread():
    """Background thread for camera monitoring."""
    global monitoring_active, camera, frame_count, last_frame_time
    
    print("🎬 Starting camera monitoring thread...")
    
    try:
        # Open camera
        if USE_DROIDCAM:
            camera_url = f"http://{DROIDCAM_IP}:{DROIDCAM_PORT}/video"
            print(f"📱 Connecting to DroidCam: {camera_url}")
            camera = cv2.VideoCapture(camera_url)
        else:
            print("📷 Using default camera")
            # Try DSHOW backend for Windows first, it's often more stable
            if os.name == 'nt':
                print("📷 Attempting to open camera with DSHOW...")
                camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                
                # Check if DSHOW worked
                if not camera.isOpened():
                    print("⚠️ DSHOW backend failed. Retrying with default backend...")
                    camera = cv2.VideoCapture(0)
            else:
                camera = cv2.VideoCapture(0)
        
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        camera.set(cv2.CAP_PROP_FPS, 10)
        
        if not camera.isOpened():
            print("❌ Failed to open camera")
            sync_emit('camera_error', {'message': 'Failed to open camera'})
            return
        
        print("✅ Camera opened successfully")
        sync_emit('camera_started', {'message': 'Camera monitoring started'})
        
        # Initialize variables
        prev_gray = None
        blink_counter = 0
        EAR_THRESH = 0.22
        BLINK_CONSEC_FRAMES = 2
        last_alert_time = 0
        alert_cooldown = 3
        current_emotion = "Neutral"
        
        while monitoring_active:
            success, frame = camera.read()
            if not success:
                time.sleep(0.5)
                continue
            
            frame_count += 1
            last_frame_time = datetime.utcnow()
            
            # Process frame
            display_frame = cv2.resize(frame, (640, 480))
            rgb_display = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
            
            # AI processing
            small = cv2.resize(frame, (640, 480))
            rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            h, w = small.shape[:2]
            
            current_time = time.time()
            
            # Draw MediaPipe landmarks
            if MEDIAPIPE_AVAILABLE:
                # Face detection
                face_results = face_mesh.process(rgb)
                if face_results.multi_face_landmarks:
                    for face_landmarks in face_results.multi_face_landmarks:
                        mp_drawing.draw_landmarks(
                            display_frame, face_landmarks, mp_face.FACEMESH_CONTOURS,
                            mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1),
                            mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1)
                        )
                    
                    # Blink detection
                    LEFT_EYE = [33, 160, 158, 133, 153, 144]
                    RIGHT_EYE = [362, 385, 387, 263, 373, 380]
                    fm = face_results.multi_face_landmarks[0]
                    ear = (eye_aspect_ratio(fm.landmark, LEFT_EYE, w, h) + 
                           eye_aspect_ratio(fm.landmark, RIGHT_EYE, w, h)) / 2.0
                    
                    if ear < EAR_THRESH:
                        blink_counter += 1
                    else:
                        if blink_counter >= BLINK_CONSEC_FRAMES and current_time - last_alert_time > alert_cooldown:
                            alert_msg = "👁️ ICU ALERT: Eye blink detected"
                            sync_emit('new_alert', {"alert": alert_msg, "timestamp": datetime.now().strftime("%H:%M:%S")})
                            send_telegram(alert_msg)
                            last_alert_time = current_time
                        blink_counter = 0
                    
                    # Emotion detection
                    current_emotion = detect_emotion(fm.landmark, w, h)
                    if current_emotion in ["Pain", "Sad"] and current_time - last_alert_time > alert_cooldown:
                        alert_msg = f"😟 ICU ALERT: {current_emotion} expression detected"
                        sync_emit('new_alert', {"alert": alert_msg, "timestamp": datetime.now().strftime("%H:%M:%S")})
                        send_telegram(alert_msg)
                        last_alert_time = current_time
                
                # Pose detection
                pose_results = pose.process(rgb)
                if pose_results.pose_landmarks:
                    mp_drawing.draw_landmarks(
                        display_frame, pose_results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                        mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2, circle_radius=2),
                        mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
                    )
                
                # Hand detection
                hand_results = hands.process(rgb)
                if hand_results.multi_hand_landmarks:
                    for hand_landmarks in hand_results.multi_hand_landmarks:
                        mp_drawing.draw_landmarks(
                            display_frame, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                            mp_drawing.DrawingSpec(color=(255, 255, 0), thickness=2, circle_radius=2),
                            mp_drawing.DrawingSpec(color=(255, 255, 0), thickness=2)
                        )
            
            # Send frame to frontend
            success_encode, buffer = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if success_encode:
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
            # Send frame to frontend
            success_encode, buffer = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if success_encode:
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                sync_emit('video_frame', {
                    'frame': frame_base64,
                    'count': frame_count,
                    'timestamp': last_frame_time.isoformat(),
                    'emotion': current_emotion
                })
            
            # Send emotion update
            sync_emit('emotion_update', {"emotion": current_emotion})
            
            time.sleep(0.1)
    
    except Exception as e:
        print(f"❌ Camera thread error: {e}")
        sync_emit('camera_error', {'message': str(e)})
    finally:
        if camera:
            camera.release()
        sync_emit('camera_stopped', {'message': 'Camera monitoring stopped'})
        print("✅ Camera thread stopped")


# ==================== Database Auto-Setup Functions ====================

def get_database_url() -> str:
    """Get database URL from environment or build from components."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "root")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "icu_alert_database")
        database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    return database_url


def get_admin_engine():
    """Create engine for connecting to PostgreSQL server (not specific database)."""
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "root")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    admin_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/postgres"
    return create_engine(admin_url)


def check_postgres_connection(admin_engine) -> tuple[bool, str]:
    """Check if PostgreSQL server is accessible."""
    try:
        with admin_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, "PostgreSQL server is accessible"
    except Exception as e:
        return False, f"Cannot connect to PostgreSQL server: {e}"


def check_database_exists(admin_engine, db_name: str) -> tuple[bool, str]:
    """Check if the target database exists."""
    try:
        with admin_engine.connect() as conn:
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
            )
            exists = result.fetchone() is not None
            if exists:
                return True, f"Database '{db_name}' exists"
            else:
                return False, f"Database '{db_name}' does not exist"
    except Exception as e:
        return False, f"Error checking database: {e}"


def create_database(admin_engine, db_name: str) -> tuple[bool, str]:
    """Create the target database if it doesn't exist."""
    try:
        # Terminate existing connections
        with admin_engine.connect() as conn:
            conn.execute(
                text(f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                     f"WHERE datname = '{db_name}' AND pid <> pg_backend_pid()")
            )
            conn.commit()
        
        # Create database
        with admin_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            conn.commit()
        
        return True, f"Database '{db_name}' created successfully"
    except Exception as e:
        return False, f"Error creating database: {e}"


def auto_setup_database():
    """
    Automatically check and create database if needed.
    This function is called on application startup.
    """
    print("🗄️  Auto-setting up database...")
    
    database_url = get_database_url()
    db_name = os.getenv("DB_NAME", "icu_alert_database")
    
    # Get admin engine
    admin_engine = get_admin_engine()
    
    # Check PostgreSQL connection
    connected, message = check_postgres_connection(admin_engine)
    if not connected:
        print(f"❌ Database connection failed: {message}")
        return False
    
    print(f"   {message}")
    
    # Check if database exists
    db_exists, db_message = check_database_exists(admin_engine, db_name)
    if db_exists:
        print(f"   ✅ {db_message}")
    else:
        print(f"   ℹ️  {db_message}")
        # Create database
        created, create_message = create_database(admin_engine, db_name)
        if created:
            print(f"   ✅ {create_message}")
        else:
            print(f"   ❌ {create_message}")
            return False
    
    print("✅ Database auto-setup complete!")
    return True


# ==================== Application Lifecycle ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global monitoring_active, main_loop
    
    # Store the running event loop
    main_loop = asyncio.get_running_loop()
    
    # Startup
    print("🚀 Starting SafeSign ICU Monitoring System...")
    
    # Auto-setup database (check and create if needed)
    db_ready = auto_setup_database()
    if not db_ready:
        print("❌ Database setup failed. Application may not function correctly.")
    
    # Initialize database tables
    print("📊 Creating database tables...")
    init_db()
    print("✅ Database tables ready")
    
    # Create demo users
    db = next(get_db())
    auth_service = AuthService(db)
    auth_service.create_demo_users()
    db.close()
    
    # Initialize computer vision
    print("🤖 Initializing computer vision...")
    init_computer_vision()
    
    # Auto-start monitoring
    print("📷 Starting automatic camera monitoring...")
    monitoring_active = True
    threading.Thread(target=camera_monitoring_thread, daemon=True).start()
    
    print("✅ SafeSign ICU Monitoring System started!")
    print(f"📡 API Documentation: http://localhost:8001/docs")
    print(f"📚 ReDoc: http://localhost:8001/redoc")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down SafeSign ICU Monitoring System...")
    monitoring_active = False
    if camera:
        camera.release()


# ==================== FastAPI Application ====================

app = FastAPI(
    title="SafeSign ICU Monitoring API",
    description="Production-ready ICU patient monitoring system with real-time video streaming, alerts, and analytics",
    version=API_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SocketIO
# SocketIO
# Mount at /ws to avoid conflict with root static files and API
socketio = SocketManager(app=app, mount_location="/ws", socketio_path="/socket.io")

# Mount static files
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")


# ==================== SocketIO Events ====================

@socketio.on('connect')
async def handle_connect(sid, environ):
    print(f'Client connected: {sid}')
    await socketio.emit('status_update', {'monitoring': monitoring_active}, room=sid)

@socketio.on('disconnect')
def handle_disconnect(sid):
    print(f'Client disconnected: {sid}')

@socketio.on('video_frame_client')
async def handle_video_frame(sid, data):
    """Handle video frames from client webcam."""
    if not MEDIAPIPE_AVAILABLE:
        return
    
    try:
        frame_data = data['frame'].split(',')[1]
        frame_bytes = base64.b64decode(frame_data)
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return
        
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        face_results = face_mesh.process(rgb)
        if face_results.multi_face_landmarks:
            for face_landmarks in face_results.multi_face_landmarks:
                mp_drawing.draw_landmarks(
                    frame, face_landmarks, mp_face.FACEMESH_CONTOURS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1),
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1)
                )
        
        pose_results = pose.process(rgb)
        if pose_results.pose_landmarks:
            mp_drawing.draw_landmarks(
                frame, pose_results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2, circle_radius=2),
                mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
            )
        
        hand_results = hands.process(rgb)
        if hand_results.multi_hand_landmarks:
            for hand_landmarks in hand_results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(255, 255, 0), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(255, 255, 0), thickness=2)
                )
        
        success_encode, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if success_encode:
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            await socketio.emit('video_frame_processed', {'frame': frame_base64}, room=sid)
    
    except Exception as e:
        print(f"❌ Error processing client frame: {e}")


# ==================== API Routes ====================

# Health check
@app.get("/api/health", response_model=HealthCheck, tags=["System"])
async def health_check():
    """Check system health."""
    uptime = time.time() - START_TIME
    
    return HealthCheck(
        status="healthy",
        database="connected",
        camera="active" if monitoring_active else "inactive",
        telegram="connected" if send_telegram("🔔 Health check") else "disconnected",
        version=API_VERSION,
        uptime_seconds=uptime
    )


# ==================== Authentication Routes ====================

@app.post("/api/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT tokens.
    
    - **username**: User's username
    - **password**: User's password
    """
    auth_service = AuthService(db)
    
    try:
        token_response = auth_service.login(user_login.username, user_login.password)
        return token_response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@app.post("/api/auth/refresh", response_model=TokenResponse, tags=["Authentication"])
async def refresh_token(refresh_token: str):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    """
    try:
        from auth.jwt_handler import refresh_access_token, decode_token
        payload = decode_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        token_data = {
            "sub": payload["sub"],
            "username": payload["username"],
            "role": payload.get("role", "nurse")
        }
        
        return {
            "access_token": create_token_response(token_data)["access_token"],
            "token_type": "bearer",
            "expires_in": 3600
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@app.post("/api/auth/logout", tags=["Authentication"])
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client-side token cleanup)."""
    return {"message": "Successfully logged out"}


# ==================== Patient Routes ====================

@app.get("/api/patient", response_model=dict, tags=["Patients"])
async def get_patient(db: Session = Depends(get_db)):
    """
    Get current patient information.
    Returns demo patient for development.
    """
    patient_crud = PatientCRUD(db)
    
    # For demo, return first patient or create one
    patient = patient_crud.get_by_patient_id("ICU-A-12")
    if not patient:
        patient_data = PatientCreate(
            patient_id="ICU-A-12",
            first_name="John",
            last_name="Doe",
            room_number="ICU-A",
            bed_number="12"
        )
        patient = patient_crud.create(patient_data)
    
    return patient_crud.to_response(patient)


@app.get("/api/patients", response_model=List[dict], tags=["Patients"])
async def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[PatientStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all patients with optional filtering."""
    patient_crud = PatientCRUD(db)
    patients = patient_crud.get_multi(skip=skip, limit=limit, status=status)
    return [patient_crud.to_response(p) for p in patients]


@app.post("/api/patients", response_model=dict, tags=["Patients"])
async def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """Create a new patient."""
    patient_crud = PatientCRUD(db)
    try:
        patient = patient_crud.create(patient_data)
        return patient_crud.to_response(patient)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Vitals Routes ====================

@app.get("/api/vitals", response_model=dict, tags=["Vitals"])
async def get_vitals(db: Session = Depends(get_db)):
    """
    Get current patient vitals.
    Returns demo vitals for development.
    """
    vitals_crud = VitalsCRUD(db)
    latest = vitals_crud.get_latest(patient_id=1)
    
    if latest:
        return vitals_crud.to_response(latest)
    
    # Return demo vitals
    return {
        "heartRate": 78,
        "oxygen": 97,
        "temperature": 98.6,
        "respiratoryRate": 16
    }


@app.get("/api/vitals/history", response_model=dict, tags=["Vitals"])
async def get_vitals_history(
    patient_id: int = Query(1),
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    """Get patient vitals history for charts."""
    vitals_crud = VitalsCRUD(db)
    vitals = vitals_crud.get_recent(patient_id, hours)
    return {
        "patient_id": patient_id,
        "vitals": [vitals_crud.to_response(v) for v in vitals],
        "trends": vitals_crud.get_trends_data(patient_id, hours),
        "stats": vitals_crud.get_vitals_stats(patient_id, hours)
    }


# ==================== Alert Routes ====================

@app.get("/api/alerts", response_model=AlertListResponse, tags=["Alerts"])
async def get_alerts(
    hours: int = Query(24, ge=1, le=720),
    acknowledged: Optional[bool] = None,
    severity_min: Optional[int] = Query(None, ge=1, le=5),
    db: Session = Depends(get_db)
):
    """Get alerts with optional filtering."""
    alert_crud = AlertCRUD(db)
    alerts = alert_crud.get_all(hours=hours, acknowledged=acknowledged, severity_min=severity_min)
    
    unacknowledged = alert_crud.get_unacknowledged()
    
    return AlertListResponse(
        alerts=[alert_crud.to_response(a) for a in alerts],
        total_count=len(alerts),
        unacknowledged_count=len(unacknowledged)
    )


@app.post("/api/alerts/acknowledge/{alert_id}", response_model=dict, tags=["Alerts"])
async def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acknowledge an alert."""
    alert_crud = AlertCRUD(db)
    alert = alert_crud.acknowledge(alert_id, current_user.id)
    
    if not alert:
        raise HTTPException(status_code=400, detail="Alert not found")
    
    return alert_crud.to_response(alert)


# ==================== Monitoring Routes ====================

@app.get("/api/monitoring/status", response_model=MonitoringStatus, tags=["Monitoring"])
async def get_monitoring_status():
    """Get current monitoring status."""
    return MonitoringStatus(
        monitoring_active=monitoring_active,
        camera_connected=camera is not None if camera else False,
        camera_source="DroidCam" if USE_DROIDCAM else "Default Camera",
        frame_count=frame_count,
        last_frame_time=last_frame_time
    )


@app.post("/api/monitoring/start", tags=["Monitoring"])
async def start_monitoring():
    """Start camera monitoring."""
    global monitoring_active
    
    if monitoring_active:
        return {"message": "Monitoring already active", "status": "already_active"}
    
    monitoring_active = True
    threading.Thread(target=camera_monitoring_thread, daemon=True).start()
    
    send_telegram("🔔 SafeSign ICU Monitoring Started")
    
    return {"message": "Monitoring started", "status": "started"}


@app.post("/api/monitoring/stop", tags=["Monitoring"])
async def stop_monitoring():
    """Stop camera monitoring."""
    global monitoring_active
    
    monitoring_active = False
    
    send_telegram("🔕 SafeSign ICU Monitoring Stopped")
    
    return {"message": "Monitoring stopped", "status": "stopped"}


# ==================== Analytics Routes ====================

@app.get("/api/analytics/patient-trends", response_model=dict, tags=["Analytics"])
async def get_patient_trends(
    patient_id: int = Query(1),
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    """Get patient trends for analytics dashboard."""
    vitals_crud = VitalsCRUD(db)
    patient_crud = PatientCRUD(db)
    alert_crud = AlertCRUD(db)
    
    patient = patient_crud.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {
        "patient_id": patient_id,
        "patient_name": patient.full_name,
        "period_hours": hours,
        "trends": vitals_crud.get_trends_data(patient_id, hours),
        "vitals_stats": vitals_crud.get_vitals_stats(patient_id, hours),
        "alert_summary": alert_crud.get_alert_stats(hours)
    }


@app.get("/api/analytics/system-performance", response_model=SystemPerformance, tags=["Analytics"])
async def get_system_performance():
    """Get system performance metrics."""
    return SystemPerformance(
        cpu_usage=None,  # Would require psutil
        memory_usage=None,
        disk_usage=None,
        active_connections=1,
        active_monitors=1 if monitoring_active else 0,
        camera_status="connected" if monitoring_active else "disconnected",
        telegram_status="connected",
        last_updated=datetime.utcnow()
    )


@app.get("/api/analytics/stats", tags=["Analytics"])
async def get_analytics_stats(db: Session = Depends(get_db)):
    """Get overall analytics statistics."""
    patient_crud = PatientCRUD(db)
    alert_crud = AlertCRUD(db)
    
    return {
        "patients": patient_crud.get_patient_stats(),
        "alerts": alert_crud.get_alert_stats(24),
        "monitoring": {
            "active": monitoring_active,
            "frame_count": frame_count,
            "connected_clients": 0 
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Use 8001 to avoid conflict with "Printing Backend" on 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
