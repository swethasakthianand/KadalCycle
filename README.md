# KadalCycle (கடல் சுழற்சி) 🌊🐟♻️
**Coastal Fish & Marine Plastic Waste Traceability Platform**

KadalCycle is a multilingual, software-only web platform designed to collect, track, and trace fish and plastic waste from coastal communities, fish markets, and harbours to verified processing and upcycling facilities across Tamil Nadu and coastal India.

---

## 🚀 Key Features by User Role

1. **Fish Vendor / Fisherman (மீன் விற்பனையாளர் / மீனவர்)**
   - **One-Touch Request**: Mobile-first UI with Tamil audio prompts, large touch targets, and high contrast.
   - **AI Waste Classification**: Automatically classifies waste (*fish waste, plastic, thermocol, fishing nets, shell waste, mixed waste*), estimates weight, and suggests the optimal disposal route.
   - **Unique Batch QR Generation**: Creates a cryptographic traceable Batch QR badge.
   - **Green Rewards Wallet**: Earn points per kg of waste handed over; redeem for subsidized boat diesel, crushed ice vouchers, or net repairs.

2. **Collector head (கழிவு சேகரிப்பாளர்)**
   - **Nearby Dispatch Radar**: Lists pickup requests sorted by GPS proximity.
   - **Step 1 QR Scanner**: Integrated in-browser camera scanner to scan vendor QR code upon pickup (transitions status to `in_transit`).
   - **Delivery Consolidation**: Aggregates batch loads for transport to processing facilities.

3. **Processor Facility (மறுசுழற்சி ஆலை)**
   - **Step 2 QR Scanner**: Verifies intake of collector batch upon arrival.
   - **Digital Scale Verification & Purity Rating**: Confirms actual weight and grades waste quality.
   - **Valorization Destination Categorization**: Routes waste to Composting, Biogas Generation, Fish-Meal Protein Feed, Chitin Extraction, or Plastic Pyrolysis.
   - **Digital Certificate of Responsible Valorization**: Auto-releases vendor reward points.

4. **Resident / Beach Watch (கடற்கரை புகார் பிரிவு)**
   - **Illegal Dumping Incident Reporting**: Interactive Leaflet pin-drop map + photo upload.
   - **Severity Flagging**: Low, Medium, High, Critical (e.g. ghost net turtle entanglement).
   - **Public Status Feed**: Track municipal dispatch and cleanup resolution.

5. **Admin Command Center (நிர்வாக மையம்)**
   - **Real-Time KPIs**: Total waste diverted (kg/tons), CO2 emissions avoided, ocean plastic recovered, active collectors, and reward credits.
   - **Geospatial Hotspots Heatmap**: Leaflet map visualizing harbours, processing hubs, active pickups, and beach dumping hotspots.
   - **Complete Traceability Audit Ledger**: Verifiable provenance chain from harbour vendor to upcycled end-product.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet + OpenStreetMap (`react-leaflet`), Lucide Icons, `html5-qrcode`
- **Backend**: FastAPI (Python 3.11), Pydantic v2, Python `qrcode`, Pillow, SQLAlchemy
- **Database & Auth**: Supabase PostgreSQL (`backend/db/schema.sql`, `supabase_rls.sql`) + Local SQLite persistent fallback
- **Storage**: Supabase Storage / FastAPI static file server
- **Deployment**: Vercel (`frontend/vercel.json`), Render / Railway (`backend/render.yaml`, `railway.json`, `Dockerfile`)

---

## 🏃 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend App: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Automated Tests
Run backend test suite:
```bash
cd backend
pytest test_api.py -v
```
Build frontend production bundle:
```bash
cd frontend
npm run build
```

---

## 📂 Project Structure
```
kadalcycle/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai_classifier.py     # AI vision waste classification (6 classes)
│   │   │   ├── pickups.py           # Pickup lifecycle & proximity dispatch
│   │   │   ├── qr_service.py        # Python qrcode generation & 2-step verification
│   │   │   ├── complaints.py        # Beach dumping reporting
│   │   │   └── analytics.py         # Hotspots & environmental KPIs
│   │   ├── core/
│   │   │   ├── config.py            # Supabase & app configuration
│   │   │   └── database.py          # PostgreSQL / SQLite database engine
│   │   ├── models/schemas.py        # Pydantic schemas
│   │   └── main.py                  # FastAPI entry point
│   ├── db/
│   │   ├── schema.sql               # Full Supabase PostgreSQL schema
│   │   └── supabase_rls.sql         # Row Level Security policies
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── render.yaml / railway.json
│   └── test_api.py
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx           # Multilingual toggle & Tamil voice reader
    │   │   ├── MapView.jsx          # Leaflet OpenStreetMap harbour & hotspot map
    │   │   ├── QRScannerModal.jsx   # Browser camera & test QR scanner
    │   │   └── BatchQRCodeModal.jsx # Printable batch badge
    │   ├── views/
    │   │   ├── VendorDashboard.jsx
    │   │   ├── CollectorDashboard.jsx
    │   │   ├── ProcessorDashboard.jsx
    │   │   ├── ResidentDashboard.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── locales/
    │   │   ├── en.js & ta.js        # Comprehensive English & Tamil dictionaries
    │   │   └── index.jsx            # Language Context Provider
    │   ├── services/api.js          # API client
    │   ├── App.jsx
    │   └── main.jsx
    ├── tailwind.config.js
    ├── vite.config.js
    └── vercel.json
```
