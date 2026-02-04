# SafeSign ICU Monitoring System - FastAPI Migration

## Overview

This is a complete migration of the SafeSign ICU Monitoring System from Flask to FastAPI with the following improvements:

### ✅ Completed Features

1. **FastAPI Backend** - High-performance async API with automatic documentation
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

2. **JWT Authentication** - Secure token-based auth with role-based access control
   - Access tokens with automatic refresh
   - Role-based permissions (admin, doctor, nurse, family)
   - Password hashing with bcrypt

3. **SQLite Database** - Production-ready data persistence
   - SQLAlchemy ORM with proper models
   - User, Patient, Vitals, Alert, and AuditLog tables
   - Pydantic schemas for validation

4. **Real-time Video Streaming** - SocketIO integration
   - Live video feed with MediaPipe landmarks
   - Blink detection and emotion recognition
   - Automatic alerts

5. **Monitoring & Analytics**
   - Patient vitals tracking and trends
   - Alert management with acknowledgment
   - System performance metrics
   - Telegram notifications

### 📁 Project Structure

```
safesign-icu-monitoring/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── __init__.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── jwt_handler.py      # JWT token handling
│   │   └── auth_service.py     # Authentication logic
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py         # SQLite setup
│   │   ├── models.py           # SQLAlchemy models
│   │   └── schemas.py          # Pydantic schemas
│   ├── crud/
│   │   ├── __init__.py
│   │   ├── patient_crud.py     # Patient operations
│   │   ├── vitals_crud.py      # Vitals operations
│   │   └── alert_crud.py       # Alert operations
│   ├── dependencies.py         # Auth dependencies
│   └── computer_vision/        # Existing CV module
├── frontend/
│   ├── index.html              # Login page
│   ├── admin-dashboard.html
│   ├── doctor-dashboard.html
│   ├── nurse-dashboard.html
│   ├── family-dashboard.html
│   └── js/
│       ├── auth.js             # Updated JWT auth
│       ├── app.js
│       ├── doctor.js
│       └── nurse.js
└── README.md
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd safesign-icu-monitoring/backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
cd safesign-icu-monitoring/backend
python main.py
```

The server will start on `http://localhost:8000`

### 3. Access the Application

- **Frontend**: `http://localhost:8000/`
- **API Docs (Swagger)**: `http://localhost:8000/docs`
- **API Docs (ReDoc)**: `http://localhost:8000/redoc`

### 4. Demo Credentials

| Role    | Username | Password  |
|---------|----------|-----------|
| Admin   | admin    | admin123  |
| Doctor  | doctor   | doctor123 |
| Nurse   | nurse    | nurse123  |
| Family  | family   | family123 |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Patients
- `GET /api/patient` - Get current patient
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient

### Vitals
- `GET /api/vitals` - Get current vitals
- `GET /api/vitals/history` - Get vitals history with trends

### Alerts
- `GET /api/alerts` - Get alerts with filtering
- `POST /api/alerts/acknowledge/{alert_id}` - Acknowledge alert

### Monitoring
- `GET /api/monitoring/status` - Get monitoring status
- `POST /api/monitoring/start` - Start monitoring
- `POST /api/monitoring/stop` - Stop monitoring

### Analytics
- `GET /api/analytics/patient-trends` - Patient trend data
- `GET /api/analytics/system-performance` - System metrics
- `GET /api/analytics/stats` - Overall statistics

### System
- `GET /api/health` - Health check endpoint

## 🔒 Role-Based Permissions

| Permission            | Admin | Doctor | Nurse | Family |
|-----------------------|-------|--------|-------|--------|
| View all patients     | ✅    | ✅     | ❌    | ❌    |
| Manage alerts         | ✅    | ✅     | ✅    | ❌    |
| View analytics        | ✅    | ✅     | ❌    | ❌    |
| Manage users          | ✅    | ❌     | ❌    | ❌    |
| Update vitals         | ✅    | ✅     | ✅    | ❌    |
| View family patient   | ✅    | ✅     | ✅    | ✅    |

## 📱 Telegram Integration

Configure Telegram notifications in environment variables:
- `BOT_TOKEN` - Telegram bot token
- `CHAT_ID` - Target chat ID

## 🎥 Camera Configuration

Configure camera settings in environment variables:
- `USE_DROIDCAM` - Use DroidCam (true/false)
- `DROIDCAM_IP` - DroidCam IP address
- `DROIDCAM_PORT` - DroidCam port (default: 4747)

## 🛠️ Development

### Running with Auto-reload

```bash
DEBUG=true python main.py
```

### Database Management

The SQLite database is automatically created on first run. Database file location:
```
backend/safesign_icu.db
```

To reset the database, simply delete the `.db` file and restart the server.

## 📊 Features Implemented

1. **Authentication & Authorization**
   - JWT-based authentication with access/refresh tokens
   - Role-based access control (RBAC)
   - Permission-based route protection
   - Automatic token refresh

2. **Patient Management**
   - Patient registration and tracking
   - Room/bed assignment
   - Status management (stable, critical, recovering, discharged)

3. **Vitals Monitoring**
   - Heart rate, SpO2, temperature tracking
   - Blood pressure logging
   - Historical data with trend analysis
   - Automated vitals from camera monitoring

4. **Alert System**
   - Real-time alert generation
   - Severity levels (1-5)
   - Alert acknowledgment tracking
   - Telegram notifications

5. **Analytics Dashboard**
   - Patient vitals trends
   - Alert statistics
   - System performance metrics

6. **Real-time Features**
   - Live video streaming
   - Emotion detection
   - Blink detection
   - Pose estimation

## 🔧 Configuration

Environment variables can be set in a `.env` file:

```env
# Server
DEBUG=False
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=sqlite:///./safesign_icu.db

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Telegram
BOT_TOKEN=your-telegram-bot-token
CHAT_ID=your-chat-id

# Camera
USE_DROIDCAM=False
DROIDCAM_IP=192.168.1.100
DROIDCAM_PORT=4747
```

## 📝 License

This project is part of the SafeSign ICU Monitoring System.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

