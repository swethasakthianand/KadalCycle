import io
import base64
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import RadialGradiantColorMask
from typing import Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Response
from ..models.schemas import QRVerifyRequest
from ..core.database import get_db_connection

router = APIRouter(prefix="/qr", tags=["QR Code & Traceability"])

def generate_qr_base64(payload_text: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(payload_text)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#006699", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"

@router.get("/generate/{code}")
async def get_qr_image(code: str):
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(code)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0891b2", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return Response(content=buffer.getvalue(), media_type="image/png")

@router.post("/verify")
async def verify_qr_and_update_lifecycle(payload: QRVerifyRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Locate pickup by qr_code_hash or ID
    cursor.execute("""
    SELECT * FROM waste_pickups 
    WHERE qr_code_hash = ? OR id = ?
    """, (payload.qr_code_hash, payload.qr_code_hash))
    
    pickup = cursor.fetchone()
    if not pickup:
        conn.close()
        raise HTTPException(status_code=404, detail="Batch QR Code not found in KadalCycle registry.")
    
    pickup_dict = dict(pickup)
    current_status = pickup_dict["status"]
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if payload.scanned_by_role == "collector":
        # Step 1: Collector scans Vendor QR code upon pickup
        if current_status in ["requested", "assigned"]:
            cursor.execute("""
            UPDATE waste_pickups
            SET status = 'in_transit',
                collector_id = ?,
                in_transit_at = ?
            WHERE id = ?
            """, (payload.user_id, now_str, pickup_dict["id"]))
            conn.commit()
            
            cursor.execute("SELECT * FROM waste_pickups WHERE id = ?", (pickup_dict["id"],))
            updated_row = dict(cursor.fetchone())
            conn.close()
            
            return {
                "success": True,
                "step": 1,
                "action": "PICKUP_CONFIRMED",
                "message_en": "Batch successfully verified and picked up by Collector. Status: IN-TRANSIT.",
                "message_ta": "கழிவுத் தொகுதி சேகரிப்பாளரால் பெறப்பட்டது. நிலை: இடமாற்றத்தில் உள்ளது.",
                "pickup": updated_row
            }
        else:
            conn.close()
            return {
                "success": False,
                "step": 1,
                "message_en": f"Batch cannot be picked up. Current status is '{current_status}'.",
                "message_ta": f"தொகுதியை எடுக்க முடியாது. தற்போதைய நிலை: '{current_status}'."
            }
            
    elif payload.scanned_by_role == "processor":
        # Step 2: Processor scans Collector batch QR upon arrival
        if current_status in ["in_transit", "assigned", "requested"]:
            actual_weight = payload.actual_weight_kg if payload.actual_weight_kg is not None else pickup_dict.get("estimated_weight_kg", 10.0)
            dest = payload.waste_destination or pickup_dict.get("destination_route") or "Biogas Digester"
            facility = payload.facility_name or "Verified Coastal Processing Facility"
            
            # Award points to vendor (approx 2-5 pts per kg depending on waste type)
            waste_rate_map = {
                "fishing_nets": 8,
                "shell_waste": 6,
                "plastic": 5,
                "thermocol": 4,
                "fish_waste": 3,
                "mixed_waste": 2
            }
            rate = waste_rate_map.get(pickup_dict.get("waste_type", "fish_waste"), 3)
            awarded_credits = int(actual_weight * rate)
            
            cursor.execute("""
            UPDATE waste_pickups
            SET status = 'completed',
                processor_id = ?,
                actual_weight_kg = ?,
                destination_route = ?,
                credits_awarded = ?,
                completed_at = ?
            WHERE id = ?
            """, (payload.user_id, actual_weight, dest, awarded_credits, now_str, pickup_dict["id"]))
            
            # Update vendor points balance
            cursor.execute("""
            UPDATE users
            SET points_balance = points_balance + ?
            WHERE id = ?
            """, (awarded_credits, pickup_dict["vendor_id"]))
            
            # Insert Processing Log
            log_id = f"log_{pickup_dict['id']}_{int(datetime.now().timestamp())}"
            cursor.execute("""
            INSERT INTO processing_logs (
                id, pickup_id, processor_id, facility_name, waste_destination, purity_rating, output_product, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                log_id, pickup_dict["id"], payload.user_id, facility, dest,
                payload.purity_rating or 96.5, f"High Grade Upcycled Output ({dest})", payload.notes or "Inspected and verified."
            ))
            
            conn.commit()
            cursor.execute("SELECT * FROM waste_pickups WHERE id = ?", (pickup_dict["id"],))
            updated_row = dict(cursor.fetchone())
            conn.close()
            
            return {
                "success": True,
                "step": 2,
                "action": "PROCESSING_COMPLETED",
                "message_en": f"Batch intake verified! Awarded {awarded_credits} Green Reward Credits to Vendor.",
                "message_ta": f"தொகுதி செயலாக்கம் உறுதி செய்யப்பட்டது! விற்பனையாளருக்கு {awarded_credits} பசுமைப் புள்ளிகள் வழங்கப்பட்டன.",
                "credits_awarded": awarded_credits,
                "pickup": updated_row
            }
        else:
            conn.close()
            return {
                "success": False,
                "step": 2,
                "message_en": f"Batch is already marked as '{current_status}'.",
                "message_ta": f"தொகுதி ஏற்கனவே '{current_status}' நிலையில் உள்ளது."
            }
            
    conn.close()
    raise HTTPException(status_code=400, detail="Invalid scanner role specified.")
