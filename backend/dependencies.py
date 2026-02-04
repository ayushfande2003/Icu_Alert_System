"""
Authentication dependencies for FastAPI routes
Provides dependency injection for JWT authentication and authorization
"""

from typing import Optional, List
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from models.database import get_db
from models.models import User, UserRole
from auth.jwt_handler import decode_token
from auth.auth_service import get_auth_service


# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)


class AuthenticationError(Exception):
    """Custom authentication error"""
    pass


class AuthorizationError(Exception):
    """Custom authorization error"""
    pass


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Authorization credentials
        db: Database session
    
    Returns:
        User object
    
    Raises:
        HTTPException: If authentication fails
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", 0))
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return user
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get the current user.
    Returns None if no valid token is provided instead of raising an exception.
    
    Args:
        credentials: HTTP Authorization credentials
        db: Database session
    
    Returns:
        User object or None
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", 0))
        
        if not user_id:
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.is_active:
            return None
        
        return user
        
    except (JWTError, ValueError, TypeError):
        return None


def require_roles(allowed_roles: List[UserRole]):
    """
    Factory function to create a role-based authorization dependency.
    
    Args:
        allowed_roles: List of roles that are allowed access
    
    Returns:
        Dependency function
    """
    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        user_role = UserRole(current_user.role)
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource"
            )
        
        return current_user
    
    return role_checker


def require_permissions(required_permissions: List[str]):
    """
    Factory function to create a permission-based authorization dependency.
    
    Args:
        required_permissions: List of permissions required
    
    Returns:
        Dependency function
    """
    async def permission_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        user_permissions = current_user.permissions
        
        if not any(perm in user_permissions for perm in required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have the required permissions"
            )
        
        return current_user
    
    return permission_checker


# Pre-configured role dependencies
require_admin = require_roles([UserRole.ADMIN])
require_doctor_or_admin = require_roles([UserRole.DOCTOR, UserRole.ADMIN])
require_nurse_or_higher = require_roles([UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN])
require_family = require_roles([UserRole.FAMILY])


# Permission-based dependencies
require_manage_users = require_permissions(["manage_users"])
require_view_all_patients = require_permissions(["view_all_patients"])
require_manage_alerts = require_permissions(["manage_alerts"])
require_view_analytics = require_permissions(["view_analytics"])


async def get_patient_access(
    patient_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to check if user has access to a specific patient.
    
    Args:
        patient_id: The patient ID to check access for
        current_user: The current authenticated user
        db: Database session
    
    Returns:
        User object if access is allowed
    
    Raises:
        HTTPException: If access is denied
    """
    from models.models import Patient
    
    # Admins and doctors can view all patients
    if current_user.role in [UserRole.ADMIN.value, UserRole.DOCTOR.value]:
        return current_user
    
    # Check if user is assigned to the patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Nurses can view patients they're assigned to
    if current_user.role == UserRole.NURSE.value:
        if patient.primary_nurse_id == current_user.id:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this patient"
        )
    
    # Family members can only view their family member
    if current_user.role == UserRole.FAMILY.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Family members cannot access patient data directly"
        )
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied"
    )

