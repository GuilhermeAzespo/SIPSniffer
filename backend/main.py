import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from fastapi.staticfiles import StaticFiles

import models
import database
import auth
from sip_analyzer import analyze_pcap

# Create tables
models.Base.metadata.create_all(bind=database.engine)

def init_db():
    db = database.SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            hashed_password = auth.get_password_hash("Admin")
            new_user = models.User(username="Admin", hashed_password=hashed_password)
            db.add(new_user)
            db.commit()
            print("Default user Admin created.")
    except Exception as e:
        print(f"Error creating default user: {e}")
    finally:
        db.close()

init_db()

app = FastAPI(title="SIPSniffer API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}



@app.post("/analyze/")
def upload_and_analyze(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user)):
    if not file.filename.endswith(".pcap") and not file.filename.endswith(".pcapng"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .pcap or .pcapng are allowed.")
        
    # Save the file temporarily
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Run analysis
        result = analyze_pcap(file_path)
    finally:
        # Clean up
        if os.path.exists(file_path):
            os.remove(file_path)
            
    return result

@app.get("/me")
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {"username": current_user.username}

# Serve static files at the root
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

