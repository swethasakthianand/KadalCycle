import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from ..models.schemas import BeachComplaintCreate, BeachComplaintResolve
from ..core.database import get_db_connection

router = APIRouter(prefix="/complaint", tags=["Beach Dumping Complaints"])

@router.post("/report")
async def report_beach_dumping(payload: BeachComplaintCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    complaint_id = f"cmp_{uuid.uuid4().hex[:8]}"
    
    cursor.execute("""
    INSERT INTO beach_complaints (
        id, resident_id, resident_name, resident_phone, beach_name,
        location_lat, location_lng, image_url, waste_category, description,
        severity, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    """, (
        complaint_id, payload.resident_id, payload.resident_name, payload.resident_phone,
        payload.beach_name, payload.location_lat, payload.location_lng,
        payload.image_base64 or "/uploads/default_beach_dump.jpg",
        payload.waste_category, payload.description, payload.severity
    ))
    
    conn.commit()
    cursor.execute("SELECT * FROM beach_complaints WHERE id = ?", (complaint_id,))
    row = dict(cursor.fetchone())
    conn.close()
    
    return {
        "success": True,
        "message": "Illegal beach dumping complaint registered. Municipal response unit alerted.",
        "complaint": row
    }

@router.get("/list")
async def list_beach_complaints(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM beach_complaints WHERE 1=1"
    params = []
    
    if status:
        query += " AND status = ?"
        params.append(status)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
        
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.post("/resolve")
async def resolve_complaint(payload: BeachComplaintResolve):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    UPDATE beach_complaints
    SET status = ?,
        resolution_notes = ?,
        resolution_image_url = ?,
        resolved_at = ?
    WHERE id = ?
    """, (
        payload.status,
        payload.resolution_notes,
        payload.resolution_image_base64,
        now_str if payload.status == "resolved" else None,
        payload.complaint_id
    ))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint ID not found.")
        
    conn.commit()
    cursor.execute("SELECT * FROM beach_complaints WHERE id = ?", (payload.complaint_id,))
    row = dict(cursor.fetchone())
    conn.close()
    
    return {
        "success": True,
        "message": f"Complaint {payload.complaint_id} updated to '{payload.status}'.",
        "complaint": row
    }
