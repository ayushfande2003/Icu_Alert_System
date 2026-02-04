"""
Pydantic schemas for API request/response validation
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from models.models import UserRole, AlertType, PatientStatus


# ==================== User Schemas ====================

class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=6, max_length=100)
    role: UserRole = UserRole.NURSE


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response (without sensitive data)"""
    id: int
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """Schema for user login request"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """Schema for authentication token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class TokenData(BaseModel):
    """Schema for JWT token payload"""
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[datetime] = None


# ==================== Patient Schemas ====================

class PatientBase(BaseModel):
    """Base patient schema"""
    patient_id: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    room_number: str = Field(..., min_length=1, max_length=50)


class PatientCreate(PatientBase):
    """Schema for creating a new patient"""
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    bed_number: Optional[str] = None
    status: PatientStatus = PatientStatus.STABLE
    primary_doctor_id: Optional[int] = None
    primary_nurse_id: Optional[int] = None
    family_contact_name: Optional[str] = None
    family_contact_phone: Optional[str] = None
    notes: Optional[str] = None


class PatientUpdate(BaseModel):
    """Schema for updating patient information"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    room_number: Optional[str] = Field(None, min_length=1, max_length=50)
    bed_number: Optional[str] = None
    status: Optional[PatientStatus] = None
    primary_doctor_id: Optional[int] = None
    primary_nurse_id: Optional[int] = None
    family_contact_name: Optional[str] = None
    family_contact_phone: Optional[str] = None
    notes: Optional[str] = None
    discharge_date: Optional[datetime] = None


class PatientResponse(PatientBase):
    """Schema for patient response"""
    id: int
    status: str
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PatientDetailResponse(PatientResponse):
    """Detailed patient response with relationships"""
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    bed_number: Optional[str] = None
    primary_doctor_id: Optional[int] = None
    primary_nurse_id: Optional[int] = None
    family_contact_name: Optional[str] = None
    family_contact_phone: Optional[str] = None
    notes: Optional[str] = None
    current_vitals: Optional[dict] = None
    recent_alerts: List["AlertResponse"] = []


# ==================== Vitals Schemas ====================

class VitalsBase(BaseModel):
    """Base vitals schema"""
    heart_rate: Optional[float] = Field(None, ge=0, le=250)
    oxygen_saturation: Optional[float] = Field(None, ge=0, le=100)
    temperature: Optional[float] = Field(None, ge=90, le=110)
    respiratory_rate: Optional[float] = Field(None, ge=0, le=60)
    blood_pressure_systolic: Optional[float] = Field(None, ge=60, le=250)
    blood_pressure_diastolic: Optional[float] = Field(None, ge=30, le=150)
    heart_rate_variability: Optional[float] = None
    movement_score: Optional[float] = Field(None, ge=0, le=100)
    blink_rate: Optional[float] = None
    emotion_detected: Optional[str] = None


class VitalsCreate(VitalsBase):
    """Schema for creating vitals reading"""
    patient_id: int
    notes: Optional[str] = None


class VitalsResponse(VitalsBase):
    """Schema for vitals response"""
    id: int
    patient_id: int
    recorded_at: datetime
    recorded_by: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def blood_pressure(self) -> str:
        if self.blood_pressure_systolic and self.blood_pressure_diastolic:
            return f"{int(self.blood_pressure_systolic)}/{int(self.blood_pressure_diastolic)}"
        return "N/A"


class VitalsHistoryResponse(BaseModel):
    """Schema for vitals history response"""
    patient_id: int
    vitals: List[VitalsResponse]
    total_records: int


# ==================== Alert Schemas ====================

class AlertBase(BaseModel):
    """Base alert schema"""
    alert_type: AlertType = AlertType.INFO
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    severity: int = Field(default=1, ge=1, le=5)


class AlertCreate(AlertBase):
    """Schema for creating an alert"""
    patient_id: int
    telegram_notified: bool = False


class AlertUpdate(BaseModel):
    """Schema for updating an alert"""
    is_acknowledged: Optional[bool] = None
    notes: Optional[str] = None


class AlertResponse(AlertBase):
    """Schema for alert response"""
    id: int
    patient_id: int
    is_acknowledged: bool
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    telegram_notified: bool
    timestamp: datetime
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AlertDetailResponse(AlertResponse):
    """Detailed alert response with relationships"""
    patient: Optional[PatientResponse] = None
    acknowledged_by_user: Optional[UserResponse] = None


class AlertListResponse(BaseModel):
    """Schema for list of alerts"""
    alerts: List[AlertResponse]
    total_count: int
    unacknowledged_count: int


# ==================== Monitoring Schemas ====================

class MonitoringStatus(BaseModel):
    """Schema for monitoring status"""
    monitoring_active: bool = False
    camera_connected: bool = False
    camera_source: Optional[str] = None
    frame_count: int = 0
    last_frame_time: Optional[datetime] = None


class MonitoringStartResponse(BaseModel):
    """Schema for monitoring start response"""
    status: str = "success"
    message: str
    monitoring_active: bool = True


class MonitoringStopResponse(BaseModel):
    """Schema for monitoring stop response"""
    status: str = "success"
    message: str
    monitoring_active: bool = False


# ==================== Analytics Schemas ====================

class PatientTrends(BaseModel):
    """Schema for patient trends data"""
    patient_id: int
    period: str  # "hour", "day", "week"
    heart_rate_trend: List[dict]
    oxygen_trend: List[dict]
    temperature_trend: List[dict]
    movement_trend: List[dict]
    alert_summary: dict


class SystemPerformance(BaseModel):
    """Schema for system performance metrics"""
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    disk_usage: Optional[float] = None
    active_connections: int = 0
    active_monitors: int = 0
    camera_status: Optional[str] = None
    telegram_status: Optional[str] = None
    last_updated: datetime


class HealthCheck(BaseModel):
    """Schema for health check response"""
    status: str
    database: str
    camera: str
    telegram: str
    version: str
    uptime_seconds: float


# ==================== Telegram Schemas ====================

class TelegramMessage(BaseModel):
    """Schema for Telegram message"""
    chat_id: str
    text: str
    parse_mode: str = "HTML"


class TelegramResponse(BaseModel):
    """Schema for Telegram API response"""
    success: bool
    message: str
    telegram_message_id: Optional[str] = None


# ==================== Video Frame Schemas ====================

class VideoFrameRequest(BaseModel):
    """Schema for video frame from client"""
    frame: str  # Base64 encoded image
    patient_id: Optional[int] = None


class VideoFrameResponse(BaseModel):
    """Schema for processed video frame"""
    success: bool
    processed_frame: Optional[str] = None  # Base64 encoded
    emotions_detected: List[str] = []
    movement_detected: bool = False
    landmarks_count: int = 0


# Update forward references
PatientDetailResponse.model_rebuild()

