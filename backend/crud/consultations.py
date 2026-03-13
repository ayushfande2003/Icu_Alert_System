from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime

from models.models import Consultation
from models.schemas import ConsultationCreate

class ConsultationCRUD:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, consultation: ConsultationCreate) -> Consultation:
        db_consultation = Consultation(
            patient_id=consultation.patient_id,
            doctor_id=consultation.doctor_id,
            notes=consultation.notes,
            diagnosis=consultation.diagnosis,
            prescription=consultation.prescription
        )
        self.db.add(db_consultation)
        self.db.commit()
        self.db.refresh(db_consultation)
        return db_consultation
    
    def get(self, consultation_id: int) -> Optional[Consultation]:
        return self.db.query(Consultation).filter(Consultation.id == consultation_id).first()
    
    def get_multi(self, skip: int = 0, limit: int = 100, patient_id: Optional[int] = None) -> List[Consultation]:
        query = self.db.query(Consultation)
        if patient_id:
            query = query.filter(Consultation.patient_id == patient_id)
        return query.order_by(desc(Consultation.consultation_date)).offset(skip).limit(limit).all()
    
    def delete(self, consultation_id: int) -> Optional[Consultation]:
        db_consultation = self.get(consultation_id)
        if db_consultation:
            self.db.delete(db_consultation)
            self.db.commit()
        return db_consultation
