import uuid
from datetime import date
from fastapi import status
from app.tasks.certificate_tasks import process_bulk_certificate_job


def test_partial_failure_handling(client, db_session):
    payload = {
        "organization_name": "ABC Tech",
        "course_name": "Resilient Systems",
        "event_name": "Failure Testing Lab",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "Valid Recipient One", "email": "one@example.com"},
            {"name": "Broken __FORCE_FAIL__ Recipient", "email": "fail@example.com"},
            {"name": "Valid Recipient Two", "email": "two@example.com"},
        ],
    }
    create_res = client.post("/api/v1/jobs", json=payload)
    job_id = create_res.json()["job_id"]

    status_res = client.get(f"/api/v1/jobs/{job_id}")
    data = status_res.json()

    assert data["total_recipients"] == 3
    assert data["processed_count"] == 3
    assert data["successful_count"] == 2
    assert data["failed_count"] == 1
    assert data["status"] == "completed_with_errors"
    assert data["progress_percentage"] == 100.0

    certs_res = client.get(f"/api/v1/jobs/{job_id}/certificates")
    certs = certs_res.json()["certificates"]

    success_certs = [c for c in certs if c["status"] == "completed"]
    failed_certs = [c for c in certs if c["status"] == "failed"]

    assert len(success_certs) == 2
    assert len(failed_certs) == 1
    assert "Simulated failure" in failed_certs[0]["error_message"]


def test_complete_failure_handling(client):
    payload = {
        "organization_name": "ABC Tech",
        "course_name": "Edge Cases",
        "event_name": "Total Failure Cohort",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "Fail 1 __FORCE_FAIL__", "email": "f1@example.com"},
            {"name": "Fail 2 __FORCE_FAIL__", "email": "f2@example.com"},
        ],
    }
    create_res = client.post("/api/v1/jobs", json=payload)
    job_id = create_res.json()["job_id"]

    status_res = client.get(f"/api/v1/jobs/{job_id}")
    data = status_res.json()

    assert data["total_recipients"] == 2
    assert data["processed_count"] == 2
    assert data["successful_count"] == 0
    assert data["failed_count"] == 2
    assert data["status"] == "failed"


def test_idempotency_task_execution(client):
    payload = {
        "organization_name": "ABC Tech",
        "course_name": "Idempotency 101",
        "event_name": "Repeat Execution",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "Idempotent User", "email": "user@example.com"},
        ],
    }
    create_res = client.post("/api/v1/jobs", json=payload)
    job_id = create_res.json()["job_id"]

    result = process_bulk_certificate_job(job_id)
    assert result["status"] == "completed"
    assert result["successful"] == 1

    status_res = client.get(f"/api/v1/jobs/{job_id}")
    data = status_res.json()
    assert data["successful_count"] == 1
    assert data["processed_count"] == 1
