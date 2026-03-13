
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional

from models.models import Task, User, Patient
from models.schemas import TaskCreate, TaskUpdate

class TaskCRUD:
    def __init__(self, db: Session):
        self.db = db

    def create(self, task: TaskCreate) -> Task:
        db_task = Task(
            title=task.title,
            description=task.description,
            patient_id=task.patient_id,
            assigned_to=task.assigned_to,
            priority=task.priority,
            status=task.status,
            due_date=task.due_date
        )
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def get(self, task_id: int) -> Optional[Task]:
        return self.db.query(Task).filter(Task.id == task_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        assigned_to: Optional[int] = None,
        patient_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Task]:
        query = self.db.query(Task)

        if assigned_to:
            query = query.filter(Task.assigned_to == assigned_to)
        
        if patient_id:
            query = query.filter(Task.patient_id == patient_id)
            
        if status:
            query = query.filter(Task.status == status)

        return query.order_by(desc(Task.created_at)).offset(skip).limit(limit).all()

    def update(self, task_id: int, task_update: TaskUpdate) -> Optional[Task]:
        db_task = self.get(task_id)
        if not db_task:
            return None

        update_data = task_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_task, key, value)

        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def delete(self, task_id: int) -> bool:
        db_task = self.get(task_id)
        if not db_task:
            return False

        self.db.delete(db_task)
        self.db.commit()
        return True

    def to_response(self, task: Task) -> dict:
        """Convert Task model to response dict with extra fields"""
        response = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "patient_id": task.patient_id,
            "assigned_to": task.assigned_to,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "patient_name": task.patient.name if task.patient else None,
            "assignee_name": task.assignee.full_name if task.assignee else None
        }
        return response
