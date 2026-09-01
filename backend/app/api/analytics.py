from typing import Dict, Any, List
from fastapi import APIRouter
from ..core.database import get_db_connection

router = APIRouter(prefix="/analytics", tags=["Analytics & Hotspots"])

@router.get("/dashboard")
async def get_analytics_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Total waste aggregates
    cursor.execute("SELECT COUNT(*), SUM(COALESCE(actual_weight_kg, estimated_weight_kg)) FROM waste_pickups")
    total_pickups, total_weight_kg = cursor.fetchone()
    total_weight_kg = total_weight_kg or 0.0
    
    cursor.execute("SELECT COUNT(*), SUM(COALESCE(actual_weight_kg, estimated_weight_kg)) FROM waste_pickups WHERE status = 'completed'")
    completed_pickups, processed_weight_kg = cursor.fetchone()
    processed_weight_kg = processed_weight_kg or 0.0
    
    # 2. Rewards disbursed
    cursor.execute("SELECT SUM(credits_awarded) FROM waste_pickups")
    total_credits = cursor.fetchone()[0] or 0
    
    # 3. Active collectors and processors
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'collector'")
    active_collectors = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'processor'")
    verified_processors = cursor.fetchone()[0] or 0
    
    # 4. Waste stream breakdown
    cursor.execute("""
    SELECT waste_type, COUNT(*), SUM(COALESCE(actual_weight_kg, estimated_weight_kg))
    FROM waste_pickups
    GROUP BY waste_type
    """)
    stream_rows = cursor.fetchall()
    waste_breakdown = []
    for r in stream_rows:
        w_type, count, weight = r
        waste_breakdown.append({
            "type": w_type,
            "count": count,
            "weight_kg": round(weight or 0.0, 1)
        })
        
    # 5. Complaints stats
    cursor.execute("SELECT COUNT(*) FROM beach_complaints WHERE status != 'resolved'")
    active_complaints = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM beach_complaints WHERE status = 'resolved'")
    resolved_complaints = cursor.fetchone()[0] or 0
    
    # 6. Environmental impact formulas
    # Fish waste to biogas: ~1.8 kg CO2e saved per kg
    # Plastics recycled: ~1.5 kg CO2e saved per kg
    # Nylon nets recovered: ~3.2 kg CO2e saved per kg
    co2_avoided_kg = round(processed_weight_kg * 2.1, 1)
    ocean_plastic_diverted_kg = sum(s["weight_kg"] for s in waste_breakdown if s["type"] in ["plastic", "fishing_nets", "thermocol"])
    
    # 7. Hotspots & Geo-coordinates for Leaflet Map
    cursor.execute("SELECT * FROM beach_complaints")
    complaint_rows = [dict(c) for c in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM waste_pickups ORDER BY created_at DESC LIMIT 20")
    pickup_rows = [dict(p) for p in cursor.fetchall()]
    
    # Hardcoded prominent coastal hubs for map visualization
    coastal_hubs = [
        {"id": "hub_1", "name": "Kasimedu Fishing Harbour", "type": "harbour", "lat": 13.1256, "lng": 80.2974, "daily_volume_kg": 4500},
        {"id": "hub_2", "name": "Royapuram Coastal Market", "type": "harbour", "lat": 13.1115, "lng": 80.2942, "daily_volume_kg": 2800},
        {"id": "hub_3", "name": "Ennore Marine Bio-Energy Facility", "type": "processor", "lat": 13.2010, "lng": 80.3200, "capacity_tons": 50},
        {"id": "hub_4", "name": "Cuddalore Port & Fish Landing", "type": "harbour", "lat": 11.7142, "lng": 79.7712, "daily_volume_kg": 3200},
        {"id": "hub_5", "name": "Tuticorin Marine Chitin Extractor", "type": "processor", "lat": 8.7642, "lng": 78.1348, "capacity_tons": 35}
    ]
    
    conn.close()
    
    return {
        "kpis": {
            "total_waste_collected_kg": round(total_weight_kg, 1),
            "total_processed_kg": round(processed_weight_kg, 1),
            "co2_avoided_kg": co2_avoided_kg,
            "ocean_plastic_diverted_kg": round(ocean_plastic_diverted_kg, 1),
            "total_credits_disbursed": total_credits,
            "active_collectors": active_collectors,
            "verified_processors": verified_processors,
            "active_complaints": active_complaints,
            "resolved_complaints": resolved_complaints
        },
        "waste_breakdown": waste_breakdown,
        "coastal_hubs": coastal_hubs,
        "complaints": complaint_rows,
        "recent_pickups": pickup_rows
    }
