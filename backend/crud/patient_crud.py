"""
Patient CRUD operations for SafeSign ICU Monitoring System
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta

from models.models import Patient, PatientStatus, User
from models.schemas import PatientCreate, PatientUpdate


class PatientCRUD:
    """Patient CRUD operations class"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get(self, patient_id: int) -> Optional[Patient]:
        """
        Get a patient by ID.
        
        Args:
            patient_id: The patient ID
        
        Returns:
            Patient object or None
        """
        return self.db.query(Patient).filter(Patient.id == patient_id).first()
    
    def get_by_patient_id(self, patient_id: str) -> Optional[Patient]:
        """
        Get a patient by their patient ID.
        
        Args:
            patient_id: The patient ID string (e.g., "ICU-A-12")
        
        Returns:
            Patient object or None
        """
        return self.db.query(Patient).filter(Patient.patient_id == patient_id).first()
    
    def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[PatientStatus] = None,
        room_number: Optional[str] = None
    ) -> List[Patient]:
        """
        Get multiple patients with optional filtering.
        
        Args:
            skip: Number of records to skip
            limit: Maximum records to return
            status: Optional status filter
            room_number: Optional room number filter
        
        Returns:
            List of Patient objects
        """
        query = self.db.query(Patient)
        
        if status:
            query = query.filter(Patient.status == status.value)
        
        if room_number:
            query = query.filter(Patient.room_number.contains(room_number))
        
        return query.order_by(desc(Patient.created_at)).offset(skip).limit(limit).all()
    
    def get_all(self) -> List[Patient]:
        """
        Get all patients.
        
        Returns:
            List of all Patient objects
        """
        return self.db.query(Patient).order_by(desc(Patient.created_at)).all()
    
    def get_by_status(self, status: PatientStatus) -> List[Patient]:
        """
        Get patients by status.
        
        Args:
            status: Patient status to filter by
        
        Returns:
            List of Patient objects
        """
        return self.db.query(Patient).filter(
            Patient.status == status.value
        ).order_by(desc(Patient.created_at)).all()
    
    def get_by_room(self, room_number: str) -> List[Patient]:
        """
        Get patients in a specific room.
        
        Args:
            room_number: Room number to filter by
        
        Returns:
            List of Patient objects
        """
        return self.db.query(Patient).filter(
            Patient.room_number == room_number
        ).all()
    
    def get_critical_patients(self) -> List[Patient]:
        """
        Get all critical patients.
        
        Returns:
            List of critical Patient objects
        """
        return self.db.query(Patient).filter(
            Patient.status == PatientStatus.CRITICAL.value
        ).all()
    
    def create(self, patient_data: PatientCreate) -> Patient:
        """
        Create a new patient.
        
        Args:
            patient_data: Patient creation data
        
        Returns:
            Created Patient object
        
        Raises:
            ValueError: If patient ID already exists
        """
        # Check for existing patient ID
        existing = self.get_by_patient_id(patient_data.patient_id)
        if existing:
            raise ValueError(f"Patient with ID {patient_data.patient_id} already exists")
        
        db_patient = Patient(
            patient_id=patient_data.patient_id,
            first_name=patient_data.first_name,
            last_name=patient_data.last_name,
            date_of_birth=patient_data.date_of_birth,
            gender=patient_data.gender,
            room_number=patient_data.room_number,
            bed_number=patient_data.bed_number,
            status=patient_data.status.value if hasattr(patient_data.status, 'value') else patient_data.status,
            primary_doctor_id=patient_data.primary_doctor_id,
            primary_nurse_id=patient_data.primary_nurse_id,
            family_contact_name=patient_data.family_contact_name,
            family_contact_phone=patient_data.family_contact_phone,
            notes=patient_data.notes
        )
        
        self.db.add(db_patient)
        self.db.commit()
        self.db.refresh(db_patient)
        
        return db_patient
    
    def update(self, patient_id: int, patient_data: PatientUpdate) -> Optional[Patient]:
        """
        Update a patient.
        
        Args:
            patient_id: The patient ID to update
            patient_data: Update data
        
        Returns:
            Updated Patient object or None
        """
        db_patient = self.get(patient_id)
        
        if not db_patient:
            return None
        
        update_data = patient_data.model_dump(exclude_unset=True)
        
        # Handle enum conversion
        if 'status' in update_data and update_data['status']:
            status_value = update_data['status']
            if hasattr(status_value, 'value'):
                update_data['status'] = status_value.value
        
        for field, value in update_data.items():
            setattr(db_patient, field, value)
        
        self.db.commit()
        self.db.refresh(db_patient)
        
        return db_patient
    
    def update_status(self, patient_id: int, status: PatientStatus) -> Optional[Patient]:
        """
        Update patient status.
        
        Args:
            patient_id: The patient ID
            status: New status
        
        Returns:
            Updated Patient object or None
        """
        db_patient = self.get(patient_id)
        
        if not db_patient:
            return None
        
        db_patient.status = status.value if hasattr(status, 'value') else status
        self.db.commit()
        self.db.refresh(db_patient)
        
        return db_patient
    
    def delete(self, patient_id: int) -> bool:
        """
        Delete a patient.
        
        Args:
            patient_id: The patient ID to delete
        
        Returns:
            True if deleted, False if not found
        """
        db_patient = self.get(patient_id)
        
        if not db_patient:
            return False
        
        self.db.delete(db_patient)
        self.db.commit()
        
        return True
    
    def get_patient_stats(self) -> dict:
        """
        Get patient statistics.
        
        Returns:
            Dictionary with patient statistics
        """
        total = self.db.query(Patient).count()
        stable = self.db.query(Patient).filter(
            Patient.status == PatientStatus.STABLE.value
        ).count()
        critical = self.db.query(Patient).filter(
            Patient.status == PatientStatus.CRITICAL.value
        ).count()
        recovering = self.db.query(Patient).filter(
            Patient.status == PatientStatus.RECOVERING.value
        ).count()
        discharged = self.db.query(Patient).filter(
            Patient.status == PatientStatus.DISCHARGED.value
        ).count()
        
        return {
            "total": total,
            "stable": stable,
            "critical": critical,
            "recovering": recovering,
            "discharged": discharged
        }
    
    def search(self, query: str) -> List[Patient]:
        """
        Search patients by name or ID.
        
        Args:
            query: Search query string
        
        Returns:
            List of matching Patient objects
        """
        return self.db.query(Patient).filter(
            (Patient.patient_id.contains(query)) |
            (Patient.first_name.contains(query)) |
            (Patient.last_name.contains(query))
        ).all()
    
    def to_response(self, patient: Patient) -> dict:
        """
        Convert Patient model to response dictionary.
        
        Args:
            patient: Patient model instance
        
        Returns:
            Response dictionary
        """
        return {
            "id": patient.id,
            "patient_id": patient.patient_id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "full_name": patient.full_name,
            "room_number": patient.room_number,
            "bed_number": patient.bed_number,
            "status": patient.status,
            "admission_date": patient.admission_date,
            "discharge_date": patient.discharge_date,
            "created_at": patient.created_at,
            "updated_at": patient.updated_at
        }
    
    def to_detail_response(self, patient: Patient) -> dict:
        """
        Convert Patient model to detailed response dictionary.
        
        Args:
            patient: Patient model instance
        
        Returns:
            Detailed response dictionary
        """
        return {
            **self.to_response(patient),
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "primary_doctor_id": patient.primary_doctor_id,
            "primary_nurse_id": patient.primary_nurse_id,
            "family_contact_name": patient.family_contact_name,
            "family_contact_phone": patient.family_contact_phone,
            "notes": patient.notes,
            "current_vitals": patient.current_vitals,
            "recent_alerts": [a.to_dict() if hasattr(a, 'to_dict') else {} for a in patient.alerts[:5]]
        }


def get_patient_crud(db: Session) -> PatientCRUD:
    """
    Factory function to get PatientCRUD instance.
    
    Args:
        db: Database session
    
    Returns:
        PatientCRUD instance
    """
    return PatientCRUD(db)

