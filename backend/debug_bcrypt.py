import sys
import os

# Monkeypatch bcrypt
import bcrypt
if not hasattr(bcrypt, "__about__"):
    try:
        class About:
            def __init__(self, version):
                self.__version__ = version
        bcrypt.__about__ = About(bcrypt.__version__)
    except ImportError:
        pass

from passlib.context import CryptContext

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    password = "admin123"
    print(f"Password to hash: {password}")
    print(f"Password type: {type(password)}")
    print(f"Password length: {len(password)}")
    
    hashed = pwd_context.hash(password)
    print(f"Hashed password: {hashed}")
    
    is_valid = pwd_context.verify(password, hashed)
    print(f"Verification result: {is_valid}")

except Exception as e:
    print(f"❌ Error during hashing: {e}")
    import traceback
    traceback.print_exc()
