from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional
from datetime import datetime

from models.models import Appointment
from models.schemas import AppointmentCreate, AppointmentUpdate

class AppointmentCRUD:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, appointment: AppointmentCreate) -> Appointment:
        db_appointment = Appointment(
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            title=appointment.title,
            description=appointment.description,
            start_time=appointment.start_time,
            end_time=appointment.end_time,
            status=appointment.status
        )
        self.db.add(db_appointment)
        self.db.commit()
        self.db.refresh(db_appointment)
        return db_appointment
    
    def get(self, appointment_id: int) -> Optional[Appointment]:
        return self.db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    def get_multi(self, skip: int = 0, limit: int = 100, doctor_id: Optional[int] = None, patient_id: Optional[int] = None) -> List[Appointment]:
        query = self.db.query(Appointment)
        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)
        return query.order_by(desc(Appointment.start_time)).offset(skip).limit(limit).all()

    def update(self, appointment_id: int, obj_in: AppointmentUpdate) -> Optional[Appointment]:
        db_obj = self.get(appointment_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, appointment_id: int) -> Optional[Appointment]:
        db_appointment = self.get(appointment_id)
        if db_appointment:
            self.db.delete(db_appointment)
            self.db.commit()
        return db_appointment
