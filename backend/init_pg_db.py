
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.database import init_db, get_db
from auth.auth_service import AuthService

def main():
    print("🚀 Initializing PostgreSQL Database...")
    
    # Create tables
    print("📊 Creating tables...")
    init_db()
    
    # Create demo users
    print("👥 Creating demo users...")
    db = next(get_db())
    try:
        auth_service = AuthService(db)
        auth_service.create_demo_users()
        print("✅ Database initialization complete!")
    except Exception as e:
        print(f"❌ Error creating users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
