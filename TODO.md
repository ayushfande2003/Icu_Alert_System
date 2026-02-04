# ICU Monitoring Migration - TODO List

## Phase 1: Backend - Flask to FastAPI Migration

### 1.1 Create FastAPI Main Application
- [ ] Create `backend/main.py` with FastAPI app setup
- [ ] Migrate all Flask routes to FastAPI endpoints
- [ ] Integrate SocketIO for real-time video streaming
- [ ] Add CORS configuration
- [ ] Add startup/shutdown events

### 1.2 Database Layer
- [ ] Create `backend/models/database.py` - SQLite database setup
- [ ] Create `backend/models/schemas.py` - Pydantic schemas
- [ ] Create `backend/models/models.py` - SQLAlchemy models
- [ ] Create `backend/crud/patient_crud.py` - Patient CRUD operations
- [ ] Create `backend/crud/vitals_crud.py` - Vitals CRUD operations
- [ ] Create `backend/crud/alert_crud.py` - Alert CRUD operations

### 1.3 Authentication System
- [ ] Create `backend/auth/jwt_handler.py` - JWT token creation/validation
- [ ] Create `backend/auth/auth_service.py` - Authentication service
- [ ] Create `backend/dependencies.py` - Dependency injection for auth
- [ ] Update login endpoint to return JWT tokens
- [ ] Add password hashing with bcrypt

## Phase 2: Updated Requirements & Configuration

### 2.1 Update Dependencies
- [ ] Create new `backend/requirements.txt` with FastAPI dependencies
- [ ] Add all required packages (fastapi, uvicorn, sqlalchemy, etc.)

## Phase 3: Frontend Updates

### 3.1 Authentication Updates
- [ ] Update `frontend/js/auth.js` - JWT token handling
- [ ] Add token storage and auto-refresh
- [ ] Update API calls to include Authorization header
- [ ] Add logout functionality (token cleanup)

### 3.2 Dashboard Updates
- [ ] Update `frontend/js/doctor.js` - New API integration
- [ ] Update `frontend/js/nurse.js` - New API integration
- [ ] Update `frontend/js/app.js` - Config updates

## Phase 4: Monitoring & Analytics

### 4.1 System Analytics
- [ ] Add `/api/analytics/patient-trends` endpoint
- [ ] Add `/api/analytics/system-performance` endpoint
- [ ] Add `/api/health` endpoint for system health
- [ ] Add metrics collection for monitoring

### 4.2 Frontend Analytics Display
- [ ] Update admin dashboard to show analytics
- [ ] Add patient trends charts
- [ ] Add system performance widgets

## Phase 5: Testing & Documentation

### 5.1 API Documentation
- [ ] Verify Swagger UI at `/docs`
- [ ] Verify ReDoc at `/redoc`
- [ ] Add endpoint descriptions

### 5.2 Integration Testing
- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test SocketIO video streaming
- [ ] Test role-based access control

## Phase 6: Cleanup & Deployment

### 6.1 Legacy Code Cleanup
- [ ] Remove old Flask app.py (or rename to flask_backup.py)
- [ ] Remove old auth.py
- [ ] Update import statements in frontend

### 6.2 Final Verification
- [ ] Verify all dashboards load correctly
- [ ] Verify video streaming works
- [ ] Verify authentication works for all roles
- [ ] Verify alerts and monitoring work

---

## Progress Tracking

### Completed ✓
- [x] Codebase analysis and planning

### In Progress
- [ ] Phase 1.1: Creating FastAPI main application

### Pending
- [ ] Phase 1.2: Database layer implementation
- [ ] Phase 1.3: Authentication system
- [ ] Phase 2.1: Dependencies
- [ ] Phase 3: Frontend updates
- [ ] Phase 4: Monitoring & Analytics
- [ ] Phase 5: Testing & Documentation
- [ ] Phase 6: Cleanup

---

## Notes

### New Project Structure:
```
backend/
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Updated dependencies
├── auth/
│   ├── __init__.py
│   ├── jwt_handler.py        # JWT token handling
│   └── auth_service.py       # Authentication logic
├── models/
│   ├── __init__.py
│   ├── database.py           # SQLite database setup
│   ├── models.py             # SQLAlchemy ORM models
│   └── schemas.py            # Pydantic schemas
├── crud/
│   ├── __init__.py
│   ├── patient_crud.py       # Patient operations
│   ├── vitals_crud.py        # Vitals operations
│   └── alert_crud.py         # Alert operations
├── dependencies.py           # Auth dependencies
└── computer_vision/          # Existing CV module (keep)
    ├── __init__.py
    └── pose_detector.py

frontend/
├── index.html               # Login page
├── js/
│   ├── auth.js             # Updated with JWT
│   ├── app.js              # Config updates
│   ├── doctor.js           # Updated API calls
│   └── nurse.js            # Updated API calls
└── ...other frontend files
```

### API Endpoints:
- `POST /api/auth/login` - Login (returns JWT)
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/patient` - Get patient info
- `GET /api/vitals` - Get patient vitals
- `GET /api/alerts` - Get alerts
- `POST /api/monitoring/start` - Start monitoring
- `POST /api/monitoring/stop` - Stop monitoring
- `GET /api/analytics/trends` - Patient trends
- `GET /api/analytics/performance` - System performance
- `GET /api/health` - Health check
- `/docs` - Swagger UI
- `/redoc` - ReDoc documentation

