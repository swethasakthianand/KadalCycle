import uuid
import math
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from ..models.schemas import WastePickupCreate, PickupAssign
from ..core.database import get_db_connection
from .qr_service import generate_qr_base64

router = APIRouter(prefix="/pickup", tags=["Pickups Lifecycle"])

def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Haversine formula
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

@router.post("/create")
async def create_waste_pickup(payload: WastePickupCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    pickup_id = f"pk_{uuid.uuid4().hex[:8]}"
    harbour_short = payload.harbour_name[:3].upper() if payload.harbour_name else "KAD"
    qr_code_hash = f"KC-{harbour_short}-2026-{uuid.uuid4().hex[:6].upper()}"
    
    # Generate QR Base64 image
    qr_b64 = generate_qr_base64(qr_code_hash)
    
    cursor.execute("""
    INSERT INTO waste_pickups (
        id, vendor_id, status, waste_type, ai_classification_tag, ai_confidence,
        estimated_weight_kg, location_lat, location_lng, harbour_name,
        image_url, qr_code_hash, destination_route, credits_awarded
    ) VALUES (?, ?, 'requested', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (
        pickup_id, payload.vendor_id, payload.waste_type,
        payload.ai_classification_tag or "Auto AI Classified",
        payload.ai_confidence or 0.95,
        payload.estimated_weight_kg,
        payload.location_lat,
        payload.location_lng,
        payload.harbour_name,
        payload.image_base64 or "/uploads/default_waste.jpg",
        qr_code_hash,
        payload.destination_route or "Eco-Processing"
    ))
    
    conn.commit()
    cursor.execute("SELECT * FROM waste_pickups WHERE id = ?", (pickup_id,))
    row = dict(cursor.fetchone())
    conn.close()
    
    row["qr_image_base64"] = qr_b64
    return {
        "success": True,
        "message": "Waste pickup request registered and unique Batch QR code created.",
        "pickup": row
    }

@router.get("/list")
async def list_waste_pickups(
    role: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    collector_lat: Optional[float] = Query(None),
    collector_lng: Optional[float] = Query(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM waste_pickups WHERE 1=1"
    params = []
    
    if status:
        query += " AND status = ?"
        params.append(status)
        
    if role == "vendor" and user_id:
        query += " AND vendor_id = ?"
        params.append(user_id)
    elif role == "collector" and user_id:
        query += " AND (collector_id = ? OR status = 'requested')"
        params.append(user_id)
    elif role == "processor" and user_id:
        query += " AND (processor_id = ? OR status IN ('in_transit', 'assigned'))"
        params.append(user_id)
        
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    
    # Calculate distance if collector lat/lng provided
    for r in rows:
        r["qr_image_base64"] = generate_qr_base64(r["qr_code_hash"])
        if collector_lat is not None and collector_lng is not None:
            r["distance_km"] = calculate_distance_km(collector_lat, collector_lng, r["location_lat"], r["location_lng"])
        else:
            r["distance_km"] = 1.2
            
    conn.close()
    return rows

@router.post("/assign")
async def assign_collector(payload: PickupAssign):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    UPDATE waste_pickups 
    SET collector_id = ?, status = 'assigned'
    WHERE id = ? AND status = 'requested'
    """, (payload.collector_id, payload.pickup_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Pickup request unavailable or already accepted.")
        
    conn.commit()
    cursor.execute("SELECT * FROM waste_pickups WHERE id = ?", (payload.pickup_id,))
    row = dict(cursor.fetchone())
    conn.close()
    
    return {
        "success": True,
        "message": f"Pickup {payload.pickup_id} assigned to collector {payload.collector_id}.",
        "pickup": row
    }

@router.get("/users")
async def list_system_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY created_at ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.get("/{pickup_id}")
async def get_pickup_details(pickup_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM waste_pickups WHERE id = ?", (pickup_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Pickup not found.")
    data = dict(row)
    data["qr_image_base64"] = generate_qr_base64(data["qr_code_hash"])
    
    cursor.execute("SELECT * FROM processing_logs WHERE pickup_id = ?", (pickup_id,))
    logs = [dict(l) for l in cursor.fetchall()]
    data["processing_logs"] = logs
    conn.close()
    return data
