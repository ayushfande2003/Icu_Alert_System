
import sys
import os
import requests

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.database import get_db, SessionLocal
from auth.auth_service import AuthService

def test_internal_login():
    print("🔐 Testing internal login logic...")
    db = SessionLocal()
    try:
        auth_service = AuthService(db)
        
        # Test valid login
        try:
            tokens = auth_service.login("admin", "admin123")
            print("✅ Login successful for 'admin'")
            print(f"   Access Token: {tokens['access_token'][:20]}...")
        except ValueError as e:
            print(f"❌ Login failed for 'admin': {e}")
            return False
            
        # Test invalid login
        try:
            auth_service.login("admin", "wrongpassword")
            print("❌ 'admin' with wrong password should have failed but succeeded")
            return False
        except ValueError:
            print("✅ Login correctly failed for wrong password")
            
        return True
    finally:
        db.close()

if __name__ == "__main__":
    if test_internal_login():
        print("\n🎉 Verification Successful!")
        sys.exit(0)
    else:
        print("\n💥 Verification Failed!")
        sys.exit(1)
