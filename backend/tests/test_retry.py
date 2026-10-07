import uuid
from fastapi import status


def test_retry_failed_certificates_endpoint(client):
    payload = {
        "organization_name": "ABC Tech",
        "course_name": "Resilient Systems",
        "event_name": "Retry Cohort",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "Valid Student", "email": "valid@example.com"},
            {"name": "Broken __FORCE_FAIL__ Student", "email": "fail@example.com"},
        ],
    }
    create_res = client.post("/api/v1/jobs", json=payload)
    job_id = create_res.json()["job_id"]

    status_res = client.get(f"/api/v1/jobs/{job_id}")
    assert status_res.json()["status"] == "completed_with_errors"
    assert status_res.json()["failed_count"] == 1

    retry_res = client.post(f"/api/v1/jobs/{job_id}/retry-failed")
    assert retry_res.status_code == status.HTTP_200_OK

    success_payload = {
        "organization_name": "ABC Tech",
        "course_name": "Success Only",
        "event_name": "No Errors",
        "issue_date": "2026-10-07",
        "recipients": [{"name": "Good Student", "email": "good@example.com"}],
    }
    s_create = client.post("/api/v1/jobs", json=success_payload)
    s_job_id = s_create.json()["job_id"]

    no_fail_retry = client.post(f"/api/v1/jobs/{s_job_id}/retry-failed")
    assert no_fail_retry.status_code == status.HTTP_409_CONFLICT
