import sys
from database import SessionLocal
import models
import auth

def create_user(username, password):
    db = SessionLocal()
    try:
        # Check if user already exists
        user = db.query(models.User).filter(models.User.username == username).first()
        if user:
            print(f"Error: User '{username}' already exists.")
            return

        hashed_password = auth.get_password_hash(password)
        new_user = models.User(username=username, hashed_password=hashed_password)
        db.add(new_user)
        db.commit()
        print(f"Success: User '{username}' created successfully!")
    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python create_user.py <username> <password>")
        sys.exit(1)
        
    username = sys.argv[1]
    password = sys.argv[2]
    create_user(username, password)
