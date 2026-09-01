import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_ai_classification():
    res = client.post("/api/v1/ai/classify")
    assert res.status_code == 200
    data = res.json()
    assert "detected_class" in data
    assert "class_label_ta" in data
    assert "suggested_route" in data
    assert data["confidence"] >= 0.8

def test_pickup_lifecycle_and_qr_verification():
    # 1. Create pickup
    pickup_payload = {
        "vendor_id": "usr_ven_01",
        "waste_type": "fish_waste",
        "estimated_weight_kg": 25.5,
        "location_lat": 13.1256,
        "location_lng": 80.2974,
        "harbour_name": "Kasimedu Fishing Harbour",
        "ai_classification_tag": "Fish Guts & Offal (மீன் கழிவு)",
        "destination_route": "Biogas Digester"
    }
    res = client.post("/api/v1/pickup/create", json=pickup_payload)
    assert res.status_code == 200
    pdata = res.json()["pickup"]
    pickup_id = pdata["id"]
    qr_hash = pdata["qr_code_hash"]
    assert pdata["status"] == "requested"
    assert "qr_image_base64" in res.json()["pickup"]
    
    # 2. Assign Collector
    assign_res = client.post("/api/v1/pickup/assign", json={
        "pickup_id": pickup_id,
        "collector_id": "usr_col_01"
    })
    assert assign_res.status_code == 200
    assert assign_res.json()["pickup"]["status"] == "assigned"
    
    # 3. QR Verify Step 1: Collector scans Vendor QR
    step1_res = client.post("/api/v1/qr/verify", json={
        "qr_code_hash": qr_hash,
        "scanned_by_role": "collector",
        "user_id": "usr_col_01"
    })
    assert step1_res.status_code == 200
    assert step1_res.json()["pickup"]["status"] == "in_transit"
    
    # 4. QR Verify Step 2: Processor scans Collector batch QR
    step2_res = client.post("/api/v1/qr/verify", json={
        "qr_code_hash": qr_hash,
        "scanned_by_role": "processor",
        "user_id": "usr_pro_01",
        "actual_weight_kg": 26.0,
        "waste_destination": "Organic Liquid Bio-Fertilizer",
        "facility_name": "Coastal Bio-Energy Plant"
    })
    assert step2_res.status_code == 200
    assert step2_res.json()["pickup"]["status"] == "completed"
    assert step2_res.json()["credits_awarded"] > 0

def test_beach_complaint_and_analytics():
    # Report dumping
    complaint_payload = {
        "resident_id": "usr_res_01",
        "resident_name": "Priya Citizen",
        "resident_phone": "9840999999",
        "beach_name": "Marina Beach Near Pier",
        "location_lat": 13.0450,
        "location_lng": 80.2810,
        "waste_category": "plastic",
        "description": "Plastic bottles and food packaging dumped by visitors",
        "severity": "high"
    }
    res = client.post("/api/v1/complaint/report", json=complaint_payload)
    assert res.status_code == 200
    cid = res.json()["complaint"]["id"]
    
    # Analytics
    analytics_res = client.get("/api/v1/analytics/dashboard")
    assert analytics_res.status_code == 200
    adata = analytics_res.json()
    assert "kpis" in adata
    assert "waste_breakdown" in adata
    assert "coastal_hubs" in adata
    assert adata["kpis"]["total_waste_collected_kg"] > 0
