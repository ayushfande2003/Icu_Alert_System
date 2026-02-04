import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Monkeypatch bcrypt (same as in main.py)
import bcrypt
if not hasattr(bcrypt, "__about__"):
    try:
        class About:
            def __init__(self, version):
                self.__version__ = version
        bcrypt.__about__ = About(bcrypt.__version__)
    except ImportError:
        pass

from models.database import Base, engine
from models.models import User
from auth.auth_service import AuthService
from models.schemas import UserCreate, UserRole

def reset_demo_users():
    print("🔄 Resetting demo users...")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        auth_service = AuthService(db)
        
        # List of demo users to reset
        demo_users = [
            ("admin", "admin123", UserRole.ADMIN),
            ("doctor", "doctor123", UserRole.DOCTOR),
            ("nurse", "nurse123", UserRole.NURSE),
            ("family", "family123", UserRole.FAMILY)
        ]
        
        for username, password, role in demo_users:
            user = auth_service.get_user_by_username(username)
            if user:
                print(f"🗑️ Deleting existing user: {username}")
                db.delete(user)
                db.commit()
            
            print(f"✨ Creating user: {username}")
            user_data = UserCreate(
                username=username,
                email=f"{username}@safesign.com",
                full_name=f"Demo {username.capitalize()}",
                password=password,
                role=role
            )
            auth_service.create_user(user_data)
            print(f"✅ User {username} created successfully")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_demo_users()
