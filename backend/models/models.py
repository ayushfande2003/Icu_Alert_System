"""
SQLAlchemy ORM models for SafeSign ICU Monitoring System
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from datetime import datetime
import uuid

from models.database import Base


class UserRole(str, PyEnum):
    """User role enumeration"""
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    FAMILY = "family"


class AlertType(str, PyEnum):
    """Alert type enumeration"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class PatientStatus(str, PyEnum):
    """Patient status enumeration"""
    STABLE = "stable"
    CRITICAL = "critical"
    RECOVERING = "recovering"
    DISCHARGED = "discharged"


class User(Base):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default=UserRole.NURSE.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
    
    @property
    def permissions(self) -> list:
        """Get permissions based on role"""
        role_permissions = {
            UserRole.ADMIN: [
                "manage_users", "view_all_patients", "system_settings",
                "manage_alerts", "medical_records", "view_analytics"
            ],
            UserRole.DOCTOR: [
                "view_patients", "manage_alerts", "medical_records",
                "view_analytics", "prescribe_medication"
            ],
            UserRole.NURSE: [
                "view_patients", "basic_monitoring", "alert_acknowledge",
                "update_vitals"
            ],
            UserRole.FAMILY: [
                "view_family_patient", "basic_info", "request_update"
            ]
        }
        return role_permissions.get(self.role, [])


class Patient(Base):
    """Patient model for ICU monitoring"""
    
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "ICU-A-12"
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String(20), nullable=True)
    room_number = Column(String(50), index=True, nullable=False)
    bed_number = Column(String(20), nullable=True)
    status = Column(String(20), default=PatientStatus.STABLE.value)
    primary_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    primary_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    family_contact_name = Column(String(100), nullable=True)
    family_contact_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    admission_date = Column(DateTime(timezone=True), server_default=func.now())
    discharge_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    vitals = relationship("Vitals", back_populates="patient", order_by="desc(Vitals.recorded_at)")
    alerts = relationship("Alert", back_populates="patient", order_by="desc(Alert.timestamp)")
    primary_doctor = relationship("User", foreign_keys=[primary_doctor_id])
    primary_nurse = relationship("User", foreign_keys=[primary_nurse_id])
    
    def __repr__(self):
        return f"<Patient {self.patient_id}: {self.first_name} {self.last_name}>"
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @property
    def current_vitals(self) -> dict:
        """Get most recent vitals"""
        if self.vitals:
            latest = self.vitals[0]
            return {
                "heart_rate": latest.heart_rate,
                "oxygen_saturation": latest.oxygen_saturation,
                "temperature": latest.temperature,
                "respiratory_rate": latest.respiratory_rate,
                "blood_pressure_systolic": latest.blood_pressure_systolic,
                "blood_pressure_diastolic": latest.blood_pressure_diastolic
            }
        return {}


class Vitals(Base):
    """Patient vitals readings"""
    
    __tablename__ = "vitals"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    heart_rate = Column(Float, nullable=True)  # BPM
    oxygen_saturation = Column(Float, nullable=True)  # SpO2 %
    temperature = Column(Float, nullable=True)  # Fahrenheit
    respiratory_rate = Column(Float, nullable=True)  # Breaths per minute
    blood_pressure_systolic = Column(Float, nullable=True)  # mmHg
    blood_pressure_diastolic = Column(Float, nullable=True)  # mmHg
    heart_rate_variability = Column(Float, nullable=True)  # HRV ms
    movement_score = Column(Float, default=0.0)  # Movement detection score
    blink_rate = Column(Float, nullable=True)  # Blinks per minute
    emotion_detected = Column(String(50), nullable=True)  # Detected emotion
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="vitals")
    recorded_by_user = relationship("User")
    
    def __repr__(self):
        return f"<Vitals for Patient {self.patient_id} at {self.recorded_at}>"
    
    @property
    def blood_pressure(self) -> str:
        """Get blood pressure as formatted string"""
        if self.blood_pressure_systolic and self.blood_pressure_diastolic:
            return f"{int(self.blood_pressure_systolic)}/{int(self.blood_pressure_diastolic)}"
        return "N/A"


class Alert(Base):
    """Patient alerts and notifications"""
    
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    alert_type = Column(String(20), default=AlertType.INFO.value)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(Integer, default=1)  # 1-5 scale
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    telegram_notified = Column(Boolean, default=False)
    email_notified = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="alerts")
    acknowledged_by_user = relationship("User")
    
    def __repr__(self):
        return f"<Alert {self.alert_type}: {self.title}>"
    
    @property
    def severity_label(self) -> str:
        """Get severity as human-readable label"""
        labels = {1: "Low", 2: "Medium", 3: "High", 4: "Critical", 5: "Emergency"}
        return labels.get(self.severity, "Unknown")


class AuditLog(Base):
    """Audit log for tracking user actions"""
    
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.action} by User {self.user_id}>"


class SystemMetrics(Base):
    """System performance metrics"""
    
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    cpu_usage = Column(Float, nullable=True)  # Percentage
    memory_usage = Column(Float, nullable=True)  # Percentage
    disk_usage = Column(Float, nullable=True)  # Percentage
    network_latency = Column(Float, nullable=True)  # ms
    active_connections = Column(Integer, default=0)
    active_monitors = Column(Integer, default=0)
    alerts_generated = Column(Integer, default=0)
    frames_processed = Column(Integer, default=0)
    camera_status = Column(String(50), nullable=True)
    telegram_status = Column(String(50), nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<SystemMetrics at {self.recorded_at}>"

