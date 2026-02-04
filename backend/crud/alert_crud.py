"""
Alert CRUD operations for SafeSign ICU Monitoring System
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta

from models.models import Alert, AlertType, Patient, User
from models.schemas import AlertCreate, AlertUpdate


class AlertCRUD:
    """Alert CRUD operations class"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get(self, alert_id: int) -> Optional[Alert]:
        """
        Get an alert by ID.
        
        Args:
            alert_id: The alert ID
        
        Returns:
            Alert object or None
        """
        return self.db.query(Alert).filter(Alert.id == alert_id).first()
    
    def get_by_patient(
        self, 
        patient_id: int, 
        skip: int = 0, 
        limit: int = 100,
        acknowledged: Optional[bool] = None
    ) -> List[Alert]:
        """
        Get alerts for a patient.
        
        Args:
            patient_id: The patient ID
            skip: Number of records to skip
            limit: Maximum records to return
            acknowledged: Optional filter for acknowledged status
        
        Returns:
            List of Alert objects
        """
        query = self.db.query(Alert).filter(Alert.patient_id == patient_id)
        
        if acknowledged is not None:
            query = query.filter(Alert.is_acknowledged == acknowledged)
        
        return query.order_by(desc(Alert.timestamp)).offset(skip).limit(limit).all()
    
    def get_recent(
        self, 
        hours: int = 24,
        alert_type: Optional[AlertType] = None,
        acknowledged: Optional[bool] = None
    ) -> List[Alert]:
        """
        Get recent alerts.
        
        Args:
            hours: Number of hours to look back
            alert_type: Optional filter by alert type
            acknowledged: Optional filter for acknowledged status
        
        Returns:
            List of Alert objects
        """
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        query = self.db.query(Alert).filter(Alert.timestamp >= time_threshold)
        
        if alert_type:
            type_value = alert_type.value if hasattr(alert_type, 'value') else alert_type
            query = query.filter(Alert.alert_type == type_value)
        
        if acknowledged is not None:
            query = query.filter(Alert.is_acknowledged == acknowledged)
        
        return query.order_by(desc(Alert.timestamp)).all()
    
    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        alert_type: Optional[AlertType] = None,
        acknowledged: Optional[bool] = None,
        severity_min: Optional[int] = None
    ) -> List[Alert]:
        """
        Get all alerts with optional filtering.
        
        Args:
            skip: Number of records to skip
            limit: Maximum records to return
            alert_type: Optional filter by alert type
            acknowledged: Optional filter for acknowledged status
            severity_min: Minimum severity level (1-5)
        
        Returns:
            List of Alert objects
        """
        query = self.db.query(Alert)
        
        if alert_type:
            type_value = alert_type.value if hasattr(alert_type, 'value') else alert_type
            query = query.filter(Alert.alert_type == type_value)
        
        if acknowledged is not None:
            query = query.filter(Alert.is_acknowledged == acknowledged)
        
        if severity_min:
            query = query.filter(Alert.severity >= severity_min)
        
        return query.order_by(desc(Alert.timestamp)).offset(skip).limit(limit).all()
    
    def get_unacknowledged(self) -> List[Alert]:
        """
        Get all unacknowledged alerts.
        
        Returns:
            List of Alert objects
        """
        return self.db.query(Alert).filter(
            Alert.is_acknowledged == False
        ).order_by(desc(Alert.severity), desc(Alert.timestamp)).all()
    
    def get_critical(self) -> List[Alert]:
        """
        Get critical and emergency alerts.
        
        Returns:
            List of Alert objects
        """
        return self.db.query(Alert).filter(
            Alert.severity >= 4
        ).order_by(desc(Alert.timestamp)).all()
    
    def create(
        self, 
        alert_data: AlertCreate, 
        telegram_notified: bool = False
    ) -> Alert:
        """
        Create a new alert.
        
        Args:
            alert_data: Alert creation data
            telegram_notified: Whether Telegram notification was sent
        
        Returns:
            Created Alert object
        """
        type_value = alert_data.alert_type.value if hasattr(alert_data.alert_type, 'value') else alert_data.alert_type
        
        db_alert = Alert(
            patient_id=alert_data.patient_id,
            alert_type=type_value,
            title=alert_data.title,
            message=alert_data.message,
            severity=alert_data.severity,
            telegram_notified=telegram_notified
        )
        
        self.db.add(db_alert)
        self.db.commit()
        self.db.refresh(db_alert)
        
        return db_alert
    
    def create_from_monitoring(
        self,
        patient_id: int,
        alert_type: AlertType,
        title: str,
        message: str,
        severity: int = 2,
        telegram_notified: bool = False
    ) -> Alert:
        """
        Create an alert from monitoring data.
        
        Args:
            patient_id: The patient ID
            alert_type: Type of alert
            title: Alert title
            message: Alert message
            severity: Severity level (1-5)
            telegram_notified: Whether Telegram notification was sent
        
        Returns:
            Created Alert object
        """
        type_value = alert_type.value if hasattr(alert_type, 'value') else alert_type
        
        db_alert = Alert(
            patient_id=patient_id,
            alert_type=type_value,
            title=title,
            message=message,
            severity=severity,
            telegram_notified=telegram_notified
        )
        
        self.db.add(db_alert)
        self.db.commit()
        self.db.refresh(db_alert)
        
        return db_alert
    
    def acknowledge(
        self, 
        alert_id: int, 
        user_id: int
    ) -> Optional[Alert]:
        """
        Acknowledge an alert.
        
        Args:
            alert_id: The alert ID
            user_id: ID of the user acknowledging
        
        Returns:
            Updated Alert object or None
        """
        db_alert = self.get(alert_id)
        
        if not db_alert:
            return None
        
        db_alert.is_acknowledged = True
        db_alert.acknowledged_by = user_id
        db_alert.acknowledged_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_alert)
        
        return db_alert
    
    def update(self, alert_id: int, alert_data: AlertUpdate) -> Optional[Alert]:
        """
        Update an alert.
        
        Args:
            alert_id: The alert ID
            alert_data: Update data
        
        Returns:
            Updated Alert object or None
        """
        db_alert = self.get(alert_id)
        
        if not db_alert:
            return None
        
        update_data = alert_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_alert, field, value)
        
        self.db.commit()
        self.db.refresh(db_alert)
        
        return db_alert
    
    def delete(self, alert_id: int) -> bool:
        """
        Delete an alert.
        
        Args:
            alert_id: The alert ID to delete
        
        Returns:
            True if deleted, False if not found
        """
        db_alert = self.get(alert_id)
        
        if not db_alert:
            return False
        
        self.db.delete(db_alert)
        self.db.commit()
        
        return True
    
    def get_alert_stats(self, hours: int = 24) -> dict:
        """
        Get alert statistics.
        
        Args:
            hours: Number of hours to analyze
        
        Returns:
            Dictionary with alert statistics
        """
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        total = self.db.query(Alert).filter(
            Alert.timestamp >= time_threshold
        ).count()
        
        acknowledged = self.db.query(Alert).filter(
            Alert.timestamp >= time_threshold,
            Alert.is_acknowledged == True
        ).count()
        
        unacknowledged = total - acknowledged
        
        by_type = {}
        for alert_type in AlertType:
            count = self.db.query(Alert).filter(
                Alert.timestamp >= time_threshold,
                Alert.alert_type == alert_type.value
            ).count()
            by_type[alert_type.value] = count
        
        by_severity = {}
        for level in range(1, 6):
            count = self.db.query(Alert).filter(
                Alert.timestamp >= time_threshold,
                Alert.severity == level
            ).count()
            by_severity[level] = count
        
        return {
            "total": total,
            "acknowledged": acknowledged,
            "unacknowledged": unacknowledged,
            "acknowledgment_rate": round(acknowledged / total * 100, 1) if total > 0 else 0,
            "by_type": by_type,
            "by_severity": by_severity
        }
    
    def get_summary(self, patient_id: Optional[int] = None) -> dict:
        """
        Get alert summary for dashboard.
        
        Args:
            patient_id: Optional patient ID to filter by
        
        Returns:
            Dictionary with alert summary
        """
        query = self.db.query(Alert)
        
        if patient_id:
            query = query.filter(Alert.patient_id == patient_id)
        
        recent_alerts = query.order_by(desc(Alert.timestamp)).limit(20).all()
        
        critical_count = query.filter(Alert.severity >= 4, Alert.is_acknowledged == False).count()
        warning_count = query.filter(
            Alert.severity.in_([2, 3]), 
            Alert.is_acknowledged == False
        ).count()
        
        return {
            "recent_alerts": [self.to_response(a) for a in recent_alerts],
            "critical_count": critical_count,
            "warning_count": warning_count,
            "total_unacknowledged": query.filter(Alert.is_acknowledged == False).count()
        }
    
    def to_response(self, alert: Alert) -> dict:
        """
        Convert Alert model to response dictionary.
        
        Args:
            alert: Alert model instance
        
        Returns:
            Response dictionary
        """
        return {
            "id": alert.id,
            "patient_id": alert.patient_id,
            "alert_type": alert.alert_type,
            "title": alert.title,
            "message": alert.message,
            "severity": alert.severity,
            "severity_label": alert.severity_label,
            "is_acknowledged": alert.is_acknowledged,
            "acknowledged_by": alert.acknowledged_by,
            "acknowledged_at": alert.acknowledged_at,
            "telegram_notified": alert.telegram_notified,
            "timestamp": alert.timestamp,
            "created_at": alert.created_at
        }
    
    def to_detail_response(self, alert: Alert) -> dict:
        """
        Convert Alert model to detailed response dictionary.
        
        Args:
            alert: Alert model instance
        
        Returns:
            Detailed response dictionary
        """
        response = self.to_response(alert)
        
        # Add patient info if available
        patient = self.db.query(Patient).filter(Patient.id == alert.patient_id).first()
        if patient:
            response["patient"] = {
                "id": patient.id,
                "patient_id": patient.patient_id,
                "full_name": patient.full_name,
                "room_number": patient.room_number
            }
        
        # Add acknowledged by user info
        if alert.acknowledged_by:
            user = self.db.query(User).filter(User.id == alert.acknowledged_by).first()
            if user:
                response["acknowledged_by_user"] = {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name
                }
        
        return response


def get_alert_crud(db: Session) -> AlertCRUD:
    """
    Factory function to get AlertCRUD instance.
    
    Args:
        db: Database session
    
    Returns:
        AlertCRUD instance
    """
    return AlertCRUD(db)

