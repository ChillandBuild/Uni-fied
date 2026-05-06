# SOGFusion — Setup Guide

## Requirements
Install these first:
- Python 3.13 → https://python.org
- Node.js 18+ → https://nodejs.org
- MySQL 8+ → https://mysql.com

---

From the repository root, first enter the project directory:

```bash
cd Uni-fied
```

---

## Step 1 — Backend Setup

```bash
cd backend

# Create virtual environment
python3.13 -m venv .venv

# Activate it
source .venv/bin/activate        # Mac/Linux
.venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env

# Return to the project root
cd ..
```

Open `.env` and set your MySQL password:
```
DB_PASSWORD=your_actual_mysql_password
```

---

## Step 2 — Frontend Setup

```bash
cd frontend
npm install

# Return to the project root
cd ..
```

---

## Step 3 — Run the App

Open **two terminals** from the `Uni-fied` project root:

**Terminal 1 — Backend:**
```bash
cd backend
.venv/bin/uvicorn app.main:app --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open your browser at:
```
http://localhost:5173
```

---

## Notes
- The database `sogfusion_unified` is created automatically on first run
- All tables and stored procedures are set up automatically
- Default port: Backend = 8000, Frontend = 5173

