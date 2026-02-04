"""
Vitals CRUD operations for SafeSign ICU Monitoring System
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta

from models.models import Vitals, Patient
from models.schemas import VitalsCreate


class VitalsCRUD:
    """Vitals CRUD operations class"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get(self, vitals_id: int) -> Optional[Vitals]:
        """
        Get vitals by ID.
        
        Args:
            vitals_id: The vitals ID
        
        Returns:
            Vitals object or None
        """
        return self.db.query(Vitals).filter(Vitals.id == vitals_id).first()
    
    def get_by_patient(
        self, 
        patient_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Vitals]:
        """
        Get vitals for a patient.
        
        Args:
            patient_id: The patient ID
            skip: Number of records to skip
            limit: Maximum records to return
        
        Returns:
            List of Vitals objects
        """
        return self.db.query(Vitals).filter(
            Vitals.patient_id == patient_id
        ).order_by(desc(Vitals.recorded_at)).offset(skip).limit(limit).all()
    
    def get_latest(self, patient_id: int) -> Optional[Vitals]:
        """
        Get the latest vitals for a patient.
        
        Args:
            patient_id: The patient ID
        
        Returns:
            Latest Vitals object or None
        """
        return self.db.query(Vitals).filter(
            Vitals.patient_id == patient_id
        ).order_by(desc(Vitals.recorded_at)).first()
    
    def get_recent(
        self, 
        patient_id: int, 
        hours: int = 24
    ) -> List[Vitals]:
        """
        Get vitals recorded within the last N hours.
        
        Args:
            patient_id: The patient ID
            hours: Number of hours to look back
        
        Returns:
            List of Vitals objects
        """
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        return self.db.query(Vitals).filter(
            Vitals.patient_id == patient_id,
            Vitals.recorded_at >= time_threshold
        ).order_by(desc(Vitals.recorded_at)).all()
    
    def create(self, vitals_data: VitalsCreate, recorded_by: Optional[int] = None) -> Vitals:
        """
        Create new vitals reading.
        
        Args:
            vitals_data: Vitals creation data
            recorded_by: ID of the user who recorded the vitals
        
        Returns:
            Created Vitals object
        """
        db_vitals = Vitals(
            patient_id=vitals_data.patient_id,
            heart_rate=vitals_data.heart_rate,
            oxygen_saturation=vitals_data.oxygen_saturation,
            temperature=vitals_data.temperature,
            respiratory_rate=vitals_data.respiratory_rate,
            blood_pressure_systolic=vitals_data.blood_pressure_systolic,
            blood_pressure_diastolic=vitals_data.blood_pressure_diastolic,
            heart_rate_variability=vitals_data.heart_rate_variability,
            movement_score=vitals_data.movement_score,
            blink_rate=vitals_data.blink_rate,
            emotion_detected=vitals_data.emotion_detected,
            recorded_by=recorded_by,
            notes=vitals_data.notes
        )
        
        self.db.add(db_vitals)
        self.db.commit()
        self.db.refresh(db_vitals)
        
        return db_vitals
    
    def create_from_monitoring(
        self,
        patient_id: int,
        emotion_detected: Optional[str] = None,
        movement_score: Optional[float] = None,
        blink_rate: Optional[float] = None,
        recorded_by: Optional[int] = None
    ) -> Vitals:
        """
        Create vitals entry from monitoring data (no vital signs, just monitoring).
        
        Args:
            patient_id: The patient ID
            emotion_detected: Detected emotion
            movement_score: Movement detection score
            blink_rate: Blink rate
            recorded_by: ID of the user/system
        
        Returns:
            Created Vitals object
        """
        db_vitals = Vitals(
            patient_id=patient_id,
            emotion_detected=emotion_detected,
            movement_score=movement_score,
            blink_rate=blink_rate,
            recorded_by=recorded_by
        )
        
        self.db.add(db_vitals)
        self.db.commit()
        self.db.refresh(db_vitals)
        
        return db_vitals
    
    def update(self, vitals_id: int, vitals_data: dict) -> Optional[Vitals]:
        """
        Update vitals.
        
        Args:
            vitals_id: The vitals ID to update
            vitals_data: Update data
        
        Returns:
            Updated Vitals object or None
        """
        db_vitals = self.get(vitals_id)
        
        if not db_vitals:
            return None
        
        for field, value in vitals_data.items():
            if hasattr(db_vitals, field):
                setattr(db_vitals, field, value)
        
        self.db.commit()
        self.db.refresh(db_vitals)
        
        return db_vitals
    
    def delete(self, vitals_id: int) -> bool:
        """
        Delete vitals.
        
        Args:
            vitals_id: The vitals ID to delete
        
        Returns:
            True if deleted, False if not found
        """
        db_vitals = self.get(vitals_id)
        
        if not db_vitals:
            return False
        
        self.db.delete(db_vitals)
        self.db.commit()
        
        return True
    
    def get_vitals_stats(
        self, 
        patient_id: int, 
        hours: int = 24
    ) -> dict:
        """
        Get statistics for patient vitals over a time period.
        
        Args:
            patient_id: The patient ID
            hours: Number of hours to analyze
        
        Returns:
            Dictionary with vitals statistics
        """
        vitals_list = self.get_recent(patient_id, hours)
        
        if not vitals_list:
            return {
                "heart_rate": {"avg": None, "min": None, "max": None},
                "oxygen": {"avg": None, "min": None, "max": None},
                "temperature": {"avg": None, "min": None, "max": None}
            }
        
        heart_rates = [v.heart_rate for v in vitals_list if v.heart_rate is not None]
        oxygen_levels = [v.oxygen_saturation for v in vitals_list if v.oxygen_saturation is not None]
        temperatures = [v.temperature for v in vitals_list if v.temperature is not None]
        movements = [v.movement_score for v in vitals_list if v.movement_score is not None]
        
        def calc_stats(data):
            if not data:
                return {"avg": None, "min": None, "max": None}
            return {
                "avg": round(sum(data) / len(data), 1),
                "min": round(min(data), 1),
                "max": round(max(data), 1)
            }
        
        return {
            "heart_rate": calc_stats(heart_rates),
            "oxygen": calc_stats(oxygen_levels),
            "temperature": calc_stats(temperatures),
            "movement": calc_stats(movements),
            "total_readings": len(vitals_list)
        }
    
    def get_trends_data(
        self,
        patient_id: int,
        hours: int = 24,
        interval_minutes: int = 15
    ) -> dict:
        """
        Get vitals data formatted for trend charts.
        
        Args:
            patient_id: The patient ID
            hours: Number of hours to retrieve
            interval_minutes: Group data by this interval
        
        Returns:
            Dictionary with trend data
        """
        vitals_list = self.get_recent(patient_id, hours)
        
        if not vitals_list:
            return {
                "heart_rate": [],
                "oxygen": [],
                "temperature": [],
                "movement": []
            }
        
        # Sort by time
        vitals_list.sort(key=lambda x: x.recorded_at)
        
        # Format for charts
        heart_rate_trend = [
            {
                "timestamp": v.recorded_at.isoformat(),
                "value": v.heart_rate
            }
            for v in vitals_list if v.heart_rate is not None
        ]
        
        oxygen_trend = [
            {
                "timestamp": v.recorded_at.isoformat(),
                "value": v.oxygen_saturation
            }
            for v in vitals_list if v.oxygen_saturation is not None
        ]
        
        temperature_trend = [
            {
                "timestamp": v.recorded_at.isoformat(),
                "value": v.temperature
            }
            for v in vitals_list if v.temperature is not None
        ]
        
        movement_trend = [
            {
                "timestamp": v.recorded_at.isoformat(),
                "value": v.movement_score
            }
            for v in vitals_list if v.movement_score is not None
        ]
        
        return {
            "heart_rate": heart_rate_trend,
            "oxygen": oxygen_trend,
            "temperature": temperature_trend,
            "movement": movement_trend
        }
    
    def to_response(self, vitals: Vitals) -> dict:
        """
        Convert Vitals model to response dictionary.
        
        Args:
            vitals: Vitals model instance
        
        Returns:
            Response dictionary
        """
        return {
            "id": vitals.id,
            "patient_id": vitals.patient_id,
            "recorded_at": vitals.recorded_at,
            "heart_rate": vitals.heart_rate,
            "oxygen_saturation": vitals.oxygen_saturation,
            "temperature": vitals.temperature,
            "respiratory_rate": vitals.respiratory_rate,
            "blood_pressure": vitals.blood_pressure,
            "movement_score": vitals.movement_score,
            "blink_rate": vitals.blink_rate,
            "emotion_detected": vitals.emotion_detected,
            "recorded_by": vitals.recorded_by,
            "notes": vitals.notes,
            "created_at": vitals.created_at
        }


def get_vitals_crud(db: Session) -> VitalsCRUD:
    """
    Factory function to get VitalsCRUD instance.
    
    Args:
        db: Database session
    
    Returns:
        VitalsCRUD instance
    """
    return VitalsCRUD(db)

