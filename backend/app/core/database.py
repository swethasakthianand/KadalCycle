import os
import json
import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_FILE = Path(__file__).resolve().parent.parent.parent / "kadalcycle.db"

def get_db_connection():
    conn = sqlite3.connect(str(DB_FILE))
    conn.row_factory = sqlite3.Row
    return conn

def init_local_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('vendor', 'collector', 'processor', 'resident', 'admin')),
        language_pref TEXT DEFAULT 'ta',
        harbour_id TEXT,
        points_balance INTEGER DEFAULT 150,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Waste pickups table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS waste_pickups (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        collector_id TEXT,
        processor_id TEXT,
        status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested', 'assigned', 'in_transit', 'delivered', 'completed', 'cancelled')),
        waste_type TEXT NOT NULL,
        ai_classification_tag TEXT,
        ai_confidence REAL,
        estimated_weight_kg REAL DEFAULT 10.0,
        actual_weight_kg REAL,
        location_lat REAL NOT NULL,
        location_lng REAL NOT NULL,
        harbour_name TEXT NOT NULL,
        image_url TEXT,
        qr_code_hash TEXT UNIQUE NOT NULL,
        destination_route TEXT,
        credits_awarded INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        in_transit_at TIMESTAMP,
        completed_at TIMESTAMP
    )
    """)
    
    # Beach Complaints table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS beach_complaints (
        id TEXT PRIMARY KEY,
        resident_id TEXT,
        resident_name TEXT,
        resident_phone TEXT,
        beach_name TEXT NOT NULL,
        location_lat REAL NOT NULL,
        location_lng REAL NOT NULL,
        image_url TEXT,
        waste_category TEXT NOT NULL,
        description TEXT,
        severity TEXT DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'cleanup_dispatched', 'resolved')),
        resolution_notes TEXT,
        resolution_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
    )
    """)
    
    # Processing Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS processing_logs (
        id TEXT PRIMARY KEY,
        pickup_id TEXT NOT NULL,
        processor_id TEXT NOT NULL,
        facility_name TEXT NOT NULL,
        waste_destination TEXT NOT NULL,
        purity_rating REAL DEFAULT 95.0,
        output_product TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Seed Initial Demo Data if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
        INSERT INTO users (id, name, phone, role, language_pref, harbour_id, points_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            ("usr_ven_01", "Murugan Chettiar (முருகன்)", "9840123456", "vendor", "ta", "Kasimedu", 320),
            ("usr_ven_02", "Selvi Fisherwoman (செல்வி)", "9840123457", "vendor", "ta", "Royapuram", 180),
            ("usr_col_01", "Kannan Ecoservice (கண்ணன்)", "9840234567", "collector", "ta", "Kasimedu", 450),
            ("usr_col_02", "Arul Marine Recycler (அருள்)", "9840234568", "collector", "en", "Royapuram", 290),
            ("usr_pro_01", "Coastal Bio-Energy Plant (கடலோர உயிரி ஆலை)", "9840345678", "processor", "ta", "Ennore Hub", 1200),
            ("usr_res_01", "Anitha Resident (அனிதா)", "9840456789", "resident", "ta", "Marina Beach", 50),
            ("usr_adm_01", "TN Maritime & Fisheries Board (தமிழ்நாடு கடல் வாரியம்)", "9840567890", "admin", "en", "Headquarters", 0)
        ])
        
        cursor.executemany("""
        INSERT INTO waste_pickups (
            id, vendor_id, collector_id, processor_id, status, waste_type, 
            ai_classification_tag, ai_confidence, estimated_weight_kg, actual_weight_kg,
            location_lat, location_lng, harbour_name, image_url, qr_code_hash, destination_route, credits_awarded, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (
                "pk_001", "usr_ven_01", "usr_col_01", "usr_pro_01", "completed", "fish_waste",
                "Fish Guts & Offal (மீன் கழிவு)", 0.96, 45.0, 44.5,
                13.1256, 80.2974, "Kasimedu Fishing Harbour", "/uploads/fish_waste_sample.jpg", "KC-KAS-2026-001", "Biogas & Liquid Bio-Fertilizer", 90, "2026-08-30 08:30:00"
            ),
            (
                "pk_002", "usr_ven_02", "usr_col_01", None, "in_transit", "plastic",
                "Plastic Crates & Ropes (பிளாஸ்டிக்)", 0.94, 28.0, None,
                13.1115, 80.2942, "Royapuram Harbour", "/uploads/plastic_sample.jpg", "KC-ROY-2026-002", "Marine Plastic Pyrolysis & Pellets", 0, "2026-08-30 11:15:00"
            ),
            (
                "pk_003", "usr_ven_01", None, None, "requested", "thermocol",
                "Expanded Polystyrene / Thermocol (தெர்மாகோல்)", 0.98, 15.0, None,
                13.1280, 80.2990, "Kasimedu North Wharf", "/uploads/thermocol_sample.jpg", "KC-KAS-2026-003", "Insulation & Densified Compaction", 0, "2026-08-30 14:00:00"
            ),
            (
                "pk_004", "usr_ven_02", "usr_col_02", None, "assigned", "fishing_nets",
                "Discarded Monofilament Ghost Net (மீன்பிடி வலை)", 0.91, 60.0, None,
                13.0827, 80.2707, "Chennai Port Outer Basin", "/uploads/ghost_net_sample.jpg", "KC-PRT-2026-004", "Nylon Filament Yarn Upcycling", 0, "2026-08-30 15:20:00"
            )
        ])
        
        cursor.executemany("""
        INSERT INTO beach_complaints (
            id, resident_id, resident_name, resident_phone, beach_name,
            location_lat, location_lng, image_url, waste_category, description,
            severity, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (
                "cmp_001", "usr_res_01", "Anitha Resident", "9840456789", "Marina Beach Promenade (மரீனா கடற்கரை)",
                13.0500, 80.2824, "/uploads/beach_dump_1.jpg", "thermocol_and_plastic",
                "Large discarded fish packaging thermocol boxes and single-use plastics near Lighthouse.",
                "high", "investigating", "2026-08-30 09:10:00"
            ),
            (
                "cmp_002", "usr_res_01", "Karthik Beachgoer", "9840456790", "Besant Nagar / Elliot's Beach",
                13.0001, 80.2668, "/uploads/beach_dump_2.jpg", "fishing_nets",
                "Tangled nylon ghost net washed ashore threatening sea turtle nesting zone.",
                "critical", "cleanup_dispatched", "2026-08-30 12:45:00"
            ),
            (
                "cmp_003", "usr_res_01", "Ravi Volunteer", "9840456791", "Kovalam Beach Bay",
                12.7892, 80.2528, "/uploads/beach_dump_3.jpg", "shell_and_plastic",
                "Commercial oyster shell waste and beverage cans dumped near surf school.",
                "medium", "resolved", "2026-08-29 16:30:00"
            )
        ])

    conn.commit()
    conn.close()

# Initialize upon module load
init_local_db()
