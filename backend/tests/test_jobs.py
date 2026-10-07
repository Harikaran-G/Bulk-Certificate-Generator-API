import uuid
import zipfile
import io
from fastapi import status


def test_create_job_valid(client):
    payload = {
        "organization_name": "ABC Technologies",
        "course_name": "Python Programming",
        "event_name": "Python Workshop 2026",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "Harikaran", "email": "hari@example.com"},
            {"name": "Arun", "email": "arun@example.com"},
            {"name": "Kumar", "email": "kumar@example.com"},
        ],
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == status.HTTP_202_ACCEPTED
    data = response.json()
    assert "job_id" in data
    assert data["total_recipients"] == 3
    assert data["message"] == "Certificate generation job accepted"


def test_list_jobs_and_stats(client):
    payload = {
        "organization_name": "Tech Corp",
        "course_name": "Cloud Computing",
        "event_name": "Cohort 1",
        "issue_date": "2026-10-07",
        "recipients": [{"name": "User 1", "email": "u1@example.com"}],
    }
    client.post("/api/v1/jobs", json=payload)

    # Test list jobs
    jobs_res = client.get("/api/v1/jobs")
    assert jobs_res.status_code == status.HTTP_200_OK
    data = jobs_res.json()
    assert data["total"] >= 1
    assert len(data["jobs"]) >= 1

    # Test stats
    stats_res = client.get("/api/v1/stats")
    assert stats_res.status_code == status.HTTP_200_OK
    s_data = stats_res.json()
    assert s_data["total_jobs"] >= 1


def test_create_job_empty_recipients(client):
    payload = {
        "organization_name": "ABC",
        "course_name": "Python Programming",
        "event_name": "Python Workshop 2026",
        "issue_date": "2026-10-07",
        "recipients": [],
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_job_invalid_email(client):
    payload = {
        "organization_name": "ABC",
        "course_name": "Python Programming",
        "event_name": "Python Workshop 2026",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "Harikaran", "email": "not-a-valid-email"},
        ],
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_job_missing_name(client):
    payload = {
        "organization_name": "ABC",
        "course_name": "Python Programming",
        "event_name": "Python Workshop 2026",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "   ", "email": "hari@example.com"},
        ],
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_job_status_success(client):
    payload = {
        "organization_name": "Academy",
        "course_name": "FastAPI Masterclass",
        "event_name": "DevCon 2026",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "Alice", "email": "alice@example.com"},
            {"name": "Bob", "email": "bob@example.com"},
        ],
    }
    create_res = client.post("/api/v1/jobs", json=payload)
    job_id = create_res.json()["job_id"]

    status_res = client.get(f"/api/v1/jobs/{job_id}")
    assert status_res.status_code == status.HTTP_200_OK
    data = status_res.json()
    assert data["job_id"] == job_id
    assert data["total_recipients"] == 2
    assert data["processed_count"] == 2
    assert data["successful_count"] == 2
    assert data["failed_count"] == 0
    assert data["status"] == "completed"
    assert data["progress_percentage"] == 100.0


def test_get_job_not_found(client):
    random_uuid = str(uuid.uuid4())
    response = client.get(f"/api/v1/jobs/{random_uuid}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_job_certificates_pagination(client):
    payload = {
        "organization_name": "Global Tech",
        "course_name": "Distributed Systems",
        "event_name": "Fall 2026",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": f"Recipient {i}", "email": f"user{i}@example.com"}
            for i in range(1, 6)
        ],
    }
    create_res = client.post("/api/v1/jobs", json=payload)
    job_id = create_res.json()["job_id"]

    page1_res = client.get(f"/api/v1/jobs/{job_id}/certificates?page=1&page_size=2")
    assert page1_res.status_code == status.HTTP_200_OK
    p1_data = page1_res.json()
    assert p1_data["total"] == 5
    assert len(p1_data["certificates"]) == 2
    assert p1_data["page"] == 1
    assert p1_data["total_pages"] == 3


def test_download_job_certificates_zip(client):
    payload = {
        "organization_name": "Cloud Org",
        "course_name": "Docker & Kubernetes",
        "event_name": "Cloud Cohort",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "Dev One", "email": "dev1@example.com"},
            {"name": "Dev Two", "email": "dev2@example.com"},
        ],
    }
    create_res = client.post("/api/v1/jobs", json=payload)
    job_id = create_res.json()["job_id"]

    zip_res = client.get(f"/api/v1/jobs/{job_id}/download-zip")
    assert zip_res.status_code == status.HTTP_200_OK
    assert zip_res.headers["content-type"] == "application/zip"

    zip_file = zipfile.ZipFile(io.BytesIO(zip_res.content))
    namelist = zip_file.namelist()
    assert len(namelist) == 2
    for name in namelist:
        assert name.endswith(".pdf")
        assert zip_file.read(name).startswith(b"%PDF-")


def test_health_check_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code in (status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE)


def test_delete_job_and_certificates(client):
    payload = {
        "organization_name": "Delete Org",
        "course_name": "Ephemeral Workshop",
        "event_name": "Cohort Zero",
        "issue_date": "2026-10-07",
        "recipients": [
            {"name": "Temp User 1", "email": "temp1@example.com"},
            {"name": "Temp User 2", "email": "temp2@example.com"},
        ],
    }
    create_res = client.post("/api/v1/jobs", json=payload)
    job_id = create_res.json()["job_id"]

    # Verify job and certificates exist
    status_res = client.get(f"/api/v1/jobs/{job_id}")
    assert status_res.status_code == status.HTTP_200_OK

    certs_res = client.get(f"/api/v1/jobs/{job_id}/certificates")
    assert certs_res.status_code == status.HTTP_200_OK
    assert certs_res.json()["total"] == 2
    cert_id = certs_res.json()["certificates"][0]["certificate_id"]

    # Verify certificate detail can be fetched
    cert_detail = client.get(f"/api/v1/certificates/{cert_id}")
    assert cert_detail.status_code == status.HTTP_200_OK

    # Delete the job
    del_res = client.delete(f"/api/v1/jobs/{job_id}")
    assert del_res.status_code == status.HTTP_200_OK
    assert del_res.json()["job_id"] == job_id
    assert del_res.json()["certificates_deleted"] == 2

    # Verify job is now 404
    job_after = client.get(f"/api/v1/jobs/{job_id}")
    assert job_after.status_code == status.HTTP_404_NOT_FOUND

    # Verify certificate is also 404
    cert_after = client.get(f"/api/v1/certificates/{cert_id}")
    assert cert_after.status_code == status.HTTP_404_NOT_FOUND

