"""
Authentication service for SafeSign ICU Monitoring System
Handles user authentication and authorization logic
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from jose import JWTError

from models.models import User, UserRole
from models.schemas import UserCreate, UserResponse
from auth.jwt_handler import (
    create_token_response,
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token
)


class AuthService:
    """Authentication service class"""
    
    def __init__(self, db: Session):
        """
        Initialize the authentication service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """
        Authenticate a user by username and password.
        
        Args:
            username: The username
            password: The plain text password
        
        Returns:
            User object if authentication successful, None otherwise
        """
        user = self.get_user_by_username(username)
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get a user by username.
        
        Args:
            username: The username to search for
        
        Returns:
            User object if found, None otherwise
        """
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get a user by email.
        
        Args:
            email: The email to search for
        
        Returns:
            User object if found, None otherwise
        """
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get a user by ID.
        
        Args:
            user_id: The user ID
        
        Returns:
            User object if found, None otherwise
        """
        return self.db.query(User).filter(User.id == user_id).first()
    
    def create_user(self, user_data: UserCreate) -> User:
        """
        Create a new user.
        
        Args:
            user_data: User creation data
        
        Returns:
            Created User object
        
        Raises:
            ValueError: If username or email already exists
        """
        # Check for existing user
        if self.get_user_by_username(user_data.username):
            raise ValueError("Username already registered")
        
        if self.get_user_by_email(user_data.email):
            raise ValueError("Email already registered")
        
        # Create new user
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=get_password_hash(user_data.password),
            role=user_data.role.value if hasattr(user_data.role, 'value') else user_data.role
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        return db_user
    
    def update_last_login(self, user_id: int):
        """
        Update the last login timestamp for a user.
        
        Args:
            user_id: The user ID
        """
        user = self.get_user_by_id(user_id)
        if user:
            user.last_login = datetime.utcnow()
            self.db.commit()
    
    def login(self, username: str, password: str) -> dict:
        """
        Process user login.
        
        Args:
            username: The username
            password: The plain text password
        
        Returns:
            Token response dictionary
        
        Raises:
            ValueError: If authentication fails
        """
        user = self.authenticate_user(username, password)
        
        if not user:
            raise ValueError("Invalid username or password")
        
        if not user.is_active:
            raise ValueError("User account is disabled")
        
        # Update last login
        self.update_last_login(user.id)
        
        # Create token response
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "permissions": user.permissions,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
        
        return create_token_response(user_data)
    
    def validate_token(self, token: str) -> tuple[bool, Optional[dict], Optional[User]]:
        """
        Validate a JWT token and return user information.
        
        Args:
            token: The JWT token
        
        Returns:
            Tuple of (is_valid, token_payload, user)
        """
        try:
            payload = decode_token(token)
            user_id = int(payload.get("sub", 0))
            
            user = self.get_user_by_id(user_id)
            
            if not user or not user.is_active:
                return False, payload, None
            
            return True, payload, user
            
        except (JWTError, ValueError, TypeError):
            return False, None, None
    
    def get_all_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        """
        Get all users with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum records to return
        
        Returns:
            List of User objects
        """
        return self.db.query(User).offset(skip).limit(limit).all()
    
    def search_users(self, query: str) -> list[User]:
        """
        Search users by username or name.
        
        Args:
            query: Search query string
        
        Returns:
            List of matching User objects
        """
        return self.db.query(User).filter(
            or_(
                User.username.contains(query),
                User.full_name.contains(query),
                User.email.contains(query)
            )
        ).all()
    
    def get_users_by_role(self, role: UserRole) -> list[User]:
        """
        Get users by role.
        
        Args:
            role: User role to filter by
        
        Returns:
            List of User objects
        """
        role_value = role.value if hasattr(role, 'value') else role
        return self.db.query(User).filter(User.role == role_value).all()
    
    def user_to_response(self, user: User) -> dict:
        """
        Convert User model to response dictionary.
        
        Args:
            user: User model instance
        
        Returns:
            Response dictionary
        """
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
    
    def create_demo_users(self):
        """Create demo users for testing."""
        demo_users = [
            UserCreate(
                username="admin",
                email="admin@safesign.com",
                full_name="System Administrator",
                password="admin123",
                role=UserRole.ADMIN
            ),
            UserCreate(
                username="doctor",
                email="doctor@safesign.com",
                full_name="Dr. Sarah Wilson",
                password="doctor123",
                role=UserRole.DOCTOR
            ),
            UserCreate(
                username="nurse",
                email="nurse@safesign.com",
                full_name="Nurse Jane Smith",
                password="nurse123",
                role=UserRole.NURSE
            ),
            UserCreate(
                username="family",
                email="family@example.com",
                full_name="Family Member",
                password="family123",
                role=UserRole.FAMILY
            )
        ]
        
        for user_data in demo_users:
            try:
                self.create_user(user_data)
                print(f"✅ Created demo user: {user_data.username}")
            except ValueError as e:
                print(f"ℹ️ Demo user already exists: {e}")


def get_auth_service(db: Session) -> AuthService:
    """
    Factory function to get AuthService instance.
    
    Args:
        db: Database session
    
    Returns:
        AuthService instance
    """
    return AuthService(db)

