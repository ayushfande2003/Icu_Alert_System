import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.database import engine
from auth.auth_service import AuthService
from auth.jwt_handler import pwd_context

def debug_login():
    print("🔍 Debugging Login Process...")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        auth_service = AuthService(db)
        username = "admin"
        password = "admin123"
        
        print(f"1. Attempting to find user: {username}")
        user = auth_service.get_user_by_username(username)
        if not user:
            print("❌ User not found!")
            return
            
        print(f"✅ User found: {user.username}, ID: {user.id}")
        print(f"2. User hashed password: {user.hashed_password}")
        print(f"3. Password context schemes: {pwd_context.schemes()}")
        
        print("4. Verifying password...")
        try:
            is_valid = auth_service.authenticate_user(username, password)
            if is_valid:
                print("✅ Password verification successful!")
                
                print("5. Generating tokens...")
                tokens = auth_service.login(username, password)
                print("✅ Login successful! Tokens generated.")
                print(tokens)
            else:
                print("❌ Password verification failed (returned False/None)")
        except Exception as e:
            print(f"❌ CRITICAL ERROR during verification/login: {e}")
            import traceback
            traceback.print_exc()
            
    except Exception as e:
        print(f"❌ General Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_login()
