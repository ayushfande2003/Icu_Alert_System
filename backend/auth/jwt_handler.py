"""
JWT token handler for SafeSign ICU Monitoring System
Handles token creation, validation, and refresh
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "safesign-icu-secret-key-change-in-production-2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password hashing context
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to compare against
    
    Returns:
        True if passwords match, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: The plain text password
    
    Returns:
        The hashed password
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: The payload data to encode in the token
        expires_delta: Optional custom expiration time
    
    Returns:
        The encoded JWT token as a string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: The payload data to encode in the token
        expires_delta: Optional custom expiration time
    
    Returns:
        The encoded JWT refresh token as a string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    
    Args:
        token: The JWT token to decode
    
    Returns:
        The decoded token payload
    
    Raises:
        JWTError: If the token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise JWTError(f"Token validation failed: {str(e)}")


def get_token_payload(token: str) -> dict:
    """
    Extract payload from a valid JWT token.
    
    Args:
        token: The JWT token
    
    Returns:
        The token payload containing user information
    """
    payload = decode_token(token)
    return payload


def create_token_response(user_data: dict) -> dict:
    """
    Create a complete token response with access and refresh tokens.
    
    Args:
        user_data: Dictionary containing user information
    
    Returns:
        Dictionary with tokens and user information
    """
    # Create token payload
    token_data = {
        "sub": str(user_data["id"]),
        "username": user_data["username"],
        "role": user_data.get("role", "nurse")
    }
    
    # Create tokens
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "refresh_token": refresh_token,
        "user": {
            "id": user_data["id"],
            "username": user_data["username"],
            "email": user_data.get("email", ""),
            "full_name": user_data.get("full_name", ""),
            "role": user_data.get("role", "nurse"),
            "permissions": user_data.get("permissions", []),
            "is_active": user_data.get("is_active", True),
            "created_at": user_data.get("created_at", datetime.utcnow()),
            "last_login": user_data.get("last_login", None)
        }
    }


def refresh_access_token(refresh_token: str) -> dict:
    """
    Refresh an access token using a refresh token.
    
    Args:
        refresh_token: The refresh token
    
    Returns:
        New access and refresh tokens
    
    Raises:
        JWTError: If the refresh token is invalid
    """
    payload = decode_token(refresh_token)
    
    if payload.get("type") != "refresh":
        raise JWTError("Invalid token type")
    
    token_data = {
        "sub": payload["sub"],
        "username": payload["username"],
        "role": payload.get("role", "nurse")
    }
    
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "refresh_token": new_refresh_token
    }


def validate_token(token: str) -> tuple[bool, Optional[dict]]:
    """
    Validate a token and return whether it's valid and the payload.
    
    Args:
        token: The JWT token to validate
    
    Returns:
        Tuple of (is_valid, payload)
    """
    try:
        payload = decode_token(token)
        return True, payload
    except JWTError:
        return False, None

