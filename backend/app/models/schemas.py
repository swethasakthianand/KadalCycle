from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class UserBase(BaseModel):
    id: str
    name: str
    phone: str
    role: str
    language_pref: str = "ta"
    harbour_id: Optional[str] = None
    points_balance: int = 0

class UserCreate(BaseModel):
    name: str
    phone: str
    role: str
    language_pref: str = "ta"
    harbour_id: Optional[str] = None

class WastePickupCreate(BaseModel):
    vendor_id: str
    waste_type: str
    estimated_weight_kg: float = 10.0
    location_lat: float
    location_lng: float
    harbour_name: str
    image_base64: Optional[str] = None
    ai_classification_tag: Optional[str] = None
    ai_confidence: Optional[float] = None
    destination_route: Optional[str] = None

class PickupAssign(BaseModel):
    pickup_id: str
    collector_id: str

class QRVerifyRequest(BaseModel):
    qr_code_hash: str
    scanned_by_role: str # "collector" or "processor"
    user_id: str
    actual_weight_kg: Optional[float] = None
    waste_destination: Optional[str] = None
    facility_name: Optional[str] = None
    purity_rating: Optional[float] = 95.0
    notes: Optional[str] = None

class BeachComplaintCreate(BaseModel):
    resident_id: Optional[str] = "usr_res_01"
    resident_name: str
    resident_phone: str
    beach_name: str
    location_lat: float
    location_lng: float
    waste_category: str
    description: str
    severity: str = "medium"
    image_base64: Optional[str] = None

class BeachComplaintResolve(BaseModel):
    complaint_id: str
    admin_id: str
    status: str
    resolution_notes: Optional[str] = None
    resolution_image_base64: Optional[str] = None

class AIClassifyResponse(BaseModel):
    detected_class: str
    class_label_ta: str
    class_label_en: str
    confidence: float
    suggested_route: str
    recycling_facility_type: str
    reward_credits_per_kg: int
    hazards_notes: str
    classes_probabilities: Dict[str, float]
