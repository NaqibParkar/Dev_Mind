
from passlib.context import CryptContext
import sys

print("Testing passlib...")
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    h = pwd_context.hash("password")
    print(f"Hash success: {h}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
