"""
Message CRUD operations for SafeSign ICU Monitoring System
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from models.models import Message, User
from models.schemas import MessageCreate

class MessageCRUD:
    """Message CRUD operations class"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, message_data: MessageCreate, sender_id: int) -> Message:
        """
        Create a new message.
        
        Args:
            message_data: Message creation data
            sender_id: ID of the sender
        
        Returns:
            Created Message object
        """
        db_message = Message(
            sender_id=sender_id,
            recipient_id=message_data.recipient_id,
            subject=message_data.subject,
            body=message_data.body
        )
        
        self.db.add(db_message)
        self.db.commit()
        self.db.refresh(db_message)
        
        return db_message
    
    def get_user_messages(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100,
        unread_only: bool = False
    ) -> List[Message]:
        """
        Get messages for a user (inbox).
        
        Args:
            user_id: The user ID
            skip: Number of records to skip
            limit: Maximum records to return
            unread_only: Filter by unread status
        
        Returns:
            List of Message objects
        """
        query = self.db.query(Message).filter(Message.recipient_id == user_id)
        
        if unread_only:
            query = query.filter(Message.is_read == False)
        
        return query.order_by(desc(Message.timestamp)).offset(skip).limit(limit).all()
        
    def get_sent_messages(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Message]:
        """
        Get messages sent by a user.
        
        Args:
            user_id: The user ID
            skip: Number of records to skip
            limit: Maximum records to return
        
        Returns:
            List of Message objects
        """
        return self.db.query(Message).filter(
            Message.sender_id == user_id
        ).order_by(desc(Message.timestamp)).offset(skip).limit(limit).all()
    
    def mark_as_read(self, message_id: int, user_id: int) -> Optional[Message]:
        """
        Mark a message as read.
        
        Args:
            message_id: The message ID
            user_id: The recipient ID (for security)
        
        Returns:
            Updated Message object or None
        """
        db_message = self.db.query(Message).filter(
            Message.id == message_id,
            Message.recipient_id == user_id
        ).first()
        
        if not db_message:
            return None
            
        db_message.is_read = True
        self.db.commit()
        self.db.refresh(db_message)
        
        return db_message

    def to_response(self, message: Message) -> dict:
        """
        Convert Message model to response dictionary.
        
        Args:
            message: Message model instance
        
        Returns:
            Response dictionary
        """
        sender_name = "Unknown"
        if message.sender:
            sender_name = message.sender.full_name
            
        return {
            "id": message.id,
            "sender_id": message.sender_id,
            "sender_name": sender_name,
            "recipient_id": message.recipient_id,
            "subject": message.subject,
            "body": message.body,
            "is_read": message.is_read,
            "timestamp": message.timestamp,
            "created_at": message.created_at
        }
