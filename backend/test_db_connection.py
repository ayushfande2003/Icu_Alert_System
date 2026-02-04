
import os
import sys
from sqlalchemy import create_engine, text

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import configuration
from models.database import DATABASE_URL

def test_connection():
    print(f"Testing connection to: {DATABASE_URL}")
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Try to connect
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print(f"✅ Connection successful! Result: {result.fetchone()}")
            return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    if test_connection():
        sys.exit(0)
    else:
        sys.exit(1)
