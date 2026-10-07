# Bulk Certificate Generator

A full-stack web application and asynchronous REST API for generating, managing, and downloading bulk PDF certificates of completion with per-recipient fault isolation.

Built with **React.js + Vite** on the frontend and **Python FastAPI + PostgreSQL + Celery + Redis + ReportLab** on the backend.

---

## Table of Contents

- [1. Overview & Key Features](#1-overview--key-features)
- [2. System Architecture](#2-system-architecture)
- [3. Technology Stack](#3-technology-stack)
- [4. Project Structure](#4-project-structure)
- [5. Frontend Application](#5-frontend-application)
- [6. Backend REST API](#6-backend-rest-api)
- [7. API Request & Response Examples](#7-api-request--response-examples)
- [8. ReportLab PDF Generation](#8-reportlab-pdf-generation)
- [9. Asynchronous Processing & Fault Isolation](#9-asynchronous-processing--fault-isolation)
- [10. CSV Import & Validation](#10-csv-import--validation)
- [11. Quickstart & Local Setup](#11-quickstart--local-setup)
- [12. Docker Compose Deployment](#12-docker-compose-deployment)
- [13. Running Automated Tests](#13-running-automated-tests)
- [14. API Documentation](#14-api-documentation)

---

## 1. Overview & Key Features

### Core Capabilities:
- **Bulk Job Processing**: Ingests requests with multiple recipients and responds with `HTTP 202 Accepted` immediately, queuing generation in the background.
- **Per-Recipient Fault Isolation**: Individual recipient failures do not interrupt or fail the remainder of the batch.
- **Digital Signature Upload & Authorization**: Upload digital signatures (PNG/JPG/SVG) and set official signatory credentials rendered dynamically on the certificate footer.
- **Excel & CSV Import**: Drag-and-drop parser for `.xlsx`, `.xls`, and `.csv` files with syntax validation and smart column detection before submission.
- **Cascade Job Deletion**: Delete any job with complete cascade cleanup of database records and physical PDF files from storage.
- **Live Progress & Monitoring**: Real-time progress percentage, processed counts, and per-recipient status breakdown.
- **Bulk Export & Targeted Retries**: Download completed certificates as a `.zip` archive, or retry only the failed records of a job.
- **High-Resolution Vector PDF Output**: Professional certificate template generated directly with ReportLab with scannable QR verification code.

---

## 2. System Architecture

```
React Frontend (Vite)
      │
      │ REST API (`http://localhost:8000/api/v1`)
      ▼
FastAPI Backend
      │
      ├── PostgreSQL (Jobs & Certificates tables with UUIDs)
      │
      └── Redis (Task Broker)
             │
             ▼
         Celery Worker
             │
             ▼
          ReportLab
             │
             ▼
      Certificate PDFs (`storage/certificates/`)
```

---

## 3. Technology Stack

### Frontend
- **Framework**: React.js 18 with Vite 5
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS (neutral enterprise theme)
- **Icons**: Lucide React
- **HTTP Client**: Axios (`src/services/api.js`)
- **CSV Parser**: PapaParse

### Backend
- **Language**: Python 3.12+
- **Framework**: FastAPI with Uvicorn
- **Validation**: Pydantic v2
- **Database & ORM**: PostgreSQL 16 with SQLAlchemy 2.0
- **Migrations**: Alembic
- **Task Queue**: Celery 5.4+ with Redis 7+
- **PDF Generation**: ReportLab 4.2+
- **Testing**: Pytest (30 test cases)

---

## 4. Project Structure

```
bulk-certificate-generator/
├── frontend/                         # React.js Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Fixed sidebar navigation
│   │   │   ├── Header.jsx            # Top bar and action links
│   │   │   ├── StatCard.jsx          # Metric cards
│   │   │   ├── ProgressBar.jsx       # Status progress bar
│   │   │   ├── StatusBadge.jsx       # Status indicator badge
│   │   │   └── CsvUploader.jsx       # CSV drag-and-drop parser
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx     # /dashboard (Metrics and recent jobs)
│   │   │   ├── CreateJobPage.jsx     # /create-job (Batch job creation)
│   │   │   ├── JobsListPage.jsx      # /jobs (Searchable jobs table)
│   │   │   ├── JobDetailPage.jsx     # /jobs/:id (Progress tracking and retries)
│   │   │   ├── CertificatesListPage.jsx # /certificates (Global certificates list)
│   │   │   └── CertificateDetailPage.jsx# /certificates/:id (PDF preview and download)
│   │   ├── services/
│   │   │   └── api.js                # API client
│   │   ├── App.jsx                   # Route configuration
│   │   ├── main.jsx                  # Application entrypoint
│   │   └── index.css                 # Base stylesheet
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
│
├── backend/                          # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py                   # Application entrypoint and middleware
│   │   ├── api/
│   │   │   ├── dependencies.py       # Dependency injection
│   │   │   └── v1/
│   │   │       ├── router.py         # Router index
│   │   │       ├── jobs.py           # Jobs endpoints
│   │   │       ├── certificates.py   # Certificates endpoints
│   │   │       └── health.py         # Health and stats endpoints
│   │   ├── core/
│   │   │   ├── config.py             # Settings configuration
│   │   │   ├── database.py           # Database session engine
│   │   │   ├── celery_app.py         # Celery broker setup
│   │   │   ├── logging.py            # Logger configuration
│   │   │   └── exceptions.py         # Exception handling
│   │   ├── models/
│   │   │   ├── base.py               # Database base model
│   │   │   ├── job.py                # Job table model
│   │   │   └── certificate.py        # Certificate table model
│   │   ├── schemas/
│   │   │   ├── common.py             # Shared schemas
│   │   │   ├── job.py                # Job schemas
│   │   │   └── certificate.py        # Certificate schemas
│   │   ├── services/
│   │   │   ├── storage_service.py    # Local file storage
│   │   │   ├── pdf_service.py        # PDF generation service
│   │   │   ├── validation_service.py # Input validation
│   │   │   ├── certificate_service.py# Certificate queries
│   │   │   └── job_service.py        # Job orchestration
│   │   ├── tasks/
│   │   │   └── certificate_tasks.py  # Celery worker tasks
│   │   └── templates/
│   │       └── certificate_template.py# ReportLab layout template
│   ├── tests/                        # Automated tests
│   ├── alembic/                      # Database migrations
│   ├── Dockerfile
│   ├── pytest.ini
│   └── requirements.txt
│
├── storage/
│   └── certificates/                 # PDF file storage
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. Frontend Application

### Pages & Routes:
| Route | Component | Purpose |
| :--- | :--- | :--- |
| `/dashboard` | `DashboardPage.jsx` | Metric cards (Total Jobs, Processing, Completed, Failed, Total Certificates, Successful, Failed) and recent jobs table |
| `/create-job` | `CreateJobPage.jsx` | Batch creation form with dynamic recipient list and CSV file uploader |
| `/jobs` | `JobsListPage.jsx` | Paginated jobs table with search, status filtering, ZIP export, and retry actions |
| `/jobs/:id` | `JobDetailPage.jsx` | Real-time progress bar (`XX / YY processed`), status breakdown, recipient error inspector, and ZIP download |
| `/certificates` | `CertificatesListPage.jsx` | Global certificates table with recipient search and status filter |
| `/certificates/:id` | `CertificateDetailPage.jsx` | Embedded vector PDF preview, metadata details, and PDF download |

---

## 6. Backend REST API

### Endpoints:
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/jobs` | Submit bulk certificate generation job | `202 Accepted` |
| `GET` | `/api/v1/jobs` | List all jobs with pagination & filter | `200 OK` |
| `GET` | `/api/v1/jobs/{job_id}` | Get job details and current progress | `200 OK` |
| `GET` | `/api/v1/jobs/{job_id}/certificates` | List certificates belonging to a job | `200 OK` |
| `GET` | `/api/v1/jobs/{job_id}/download-zip` | Download all completed certificates as a `.zip` | `200 OK` |
| `POST` | `/api/v1/jobs/{job_id}/retry-failed` | Retry failed certificates for a job | `202 Accepted` |
| `DELETE` | `/api/v1/jobs/{job_id}` | Delete job and cascade delete its certificates | `200 OK` |
| `GET` | `/api/v1/certificates` | List all certificates | `200 OK` |
| `GET` | `/api/v1/certificates/{certificate_id}` | Get certificate details or PDF | `200 OK` |
| `GET` | `/api/v1/certificates/{certificate_id}/download` | Direct PDF file download | `200 OK` |
| `GET` | `/api/v1/stats` | Aggregated dashboard statistics | `200 OK` |
| `GET` | `/api/v1/health` / `/health` | Service health check | `200 OK` |

---

## 7. API Request & Response Examples

### Create Bulk Job (`POST /api/v1/jobs`)
```bash
curl -X POST "http://localhost:8000/api/v1/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Global Technical Institute",
    "course_name": "Python Programming",
    "event_name": "Annual Workshop 2026",
    "issue_date": "2026-10-07",
    "recipients": [
      {"name": "Alice Johnson", "email": "alice@example.com"},
      {"name": "Bob Smith", "email": "bob@example.com"},
      {"name": "Carol Williams", "email": "carol@example.com"}
    ]
  }'
```

**Response (`202 Accepted`):**
```json
{
  "job_id": "8f38efcb-4458-450f-a367-9c94840854d9",
  "status": "pending",
  "total_recipients": 3,
  "message": "Certificate generation job accepted"
}
```

---

## 8. ReportLab PDF Generation

The certificate is generated using ReportLab:
- **Dimensions**: Landscape Letter (792pt × 612pt).
- **Structure**:
  - Organization Name
  - Certificate of Completion title
  - Recipient Name
  - Course Name
  - Event / Cohort Name
  - Issue Date
  - Unique Certificate ID
  - Signature section

---

## 9. Asynchronous Processing & Fault Isolation

```
for certificate in cohort_certificates:
    mark status = PROCESSING
    try:
        generate_pdf_with_reportlab()
        save_file_to_storage()
        mark status = COMPLETED
        increment job.successful_count
    except Exception as e:
        mark status = FAILED
        store certificate.error_message
        increment job.failed_count
    increment job.processed_count
    commit_progress_to_postgres()
```

- If an individual recipient's record fails, other valid certificates continue processing normally.
- When partial errors occur, the job finalizes with status `COMPLETED_WITH_ERRORS`.
- The `POST /api/v1/jobs/{job_id}/retry-failed` endpoint allows retrying only the failed records.

---

## 10. CSV Import & Validation

- Supported format: `name,email`
- Automatically validates email format and required name field.
- Shows valid and invalid row counts before importing.

---

## 11. Quickstart & Local Setup

### Prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL 16+
- Redis 7+

### Backend Setup:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# Terminal 1: Celery Worker
celery -A app.core.celery_app.celery_app worker --loglevel=info

# Terminal 2: FastAPI Server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

Visit:
- Frontend: `http://localhost:3000`
- Swagger Docs: `http://localhost:8000/docs`

---

## 12. Docker Compose Deployment

Run all services with Docker Compose:

```bash
docker compose up --build
```

Services:
- `frontend`: React app on `http://localhost:3000`
- `backend`: FastAPI API on `http://localhost:8000`
- `celery_worker`: Background Celery task worker
- `postgres`: PostgreSQL database on port `5432`
- `redis`: Redis task broker on port `6379`

---

## 13. Running Automated Tests

Run backend tests with pytest:

```bash
cd backend
pytest -v
```

All 28 tests cover validation, job creation, error isolation, PDF generation, retry endpoints, and idempotency.

---

## 14. API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
