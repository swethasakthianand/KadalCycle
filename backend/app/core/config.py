import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

class Settings:
    PROJECT_NAME: str = "KadalCycle API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://xyzcompany.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Storage
    STORAGE_BUCKET_NAME: str = os.getenv("STORAGE_BUCKET_NAME", "kadalcycle-media")
    LOCAL_UPLOAD_DIR: Path = UPLOAD_DIR
    
    # HuggingFace / AI Model Configuration
    HF_API_KEY: str = os.getenv("HF_API_KEY", "")
    HF_MODEL_ID: str = os.getenv("HF_MODEL_ID", "google/vit-base-patch16-224")

settings = Settings()
