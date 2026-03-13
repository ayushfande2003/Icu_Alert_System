from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from models.models import MedicalRecord
from models.schemas import MedicalRecordCreate

class MedicalRecordCRUD:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, record: MedicalRecordCreate) -> MedicalRecord:
        db_record = MedicalRecord(
            patient_id=record.patient_id,
            uploaded_by=record.uploaded_by,
            record_type=record.record_type,
            file_url=record.file_url,
            description=record.description
        )
        self.db.add(db_record)
        self.db.commit()
        self.db.refresh(db_record)
        return db_record
    
    def get(self, record_id: int) -> Optional[MedicalRecord]:
        return self.db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    
    def get_multi(self, skip: int = 0, limit: int = 100, patient_id: Optional[int] = None) -> List[MedicalRecord]:
        query = self.db.query(MedicalRecord)
        if patient_id:
            query = query.filter(MedicalRecord.patient_id == patient_id)
        return query.order_by(desc(MedicalRecord.date_recorded)).offset(skip).limit(limit).all()
    
    def delete(self, record_id: int) -> Optional[MedicalRecord]:
        db_record = self.get(record_id)
        if db_record:
            self.db.delete(db_record)
            self.db.commit()
        return db_record
