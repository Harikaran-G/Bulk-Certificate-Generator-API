import uuid
from fastapi import status


def test_get_certificate_file_and_json(client):
    payload = {
        "organization_name": "ABC Tech",
        "course_name": "Modern Python",
        "event_name": "Workshop 2026",
        "issue_date": "2026-10-07",
        "recipients": [{"name": "Test User", "email": "test@example.com"}],
    }
    create_res = client.post("/api/v1/jobs", json=payload)
    job_id = create_res.json()["job_id"]

    certs_res = client.get(f"/api/v1/jobs/{job_id}/certificates")
    cert_id = certs_res.json()["certificates"][0]["certificate_id"]

    pdf_res = client.get(f"/api/v1/certificates/{cert_id}")
    assert pdf_res.status_code == status.HTTP_200_OK
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF-")

    json_res = client.get(f"/api/v1/certificates/{cert_id}?format=json")
    assert json_res.status_code == status.HTTP_200_OK
    data = json_res.json()
    assert data["certificate_id"] == cert_id
    assert data["recipient_name"] == "Test User"
    assert data["status"] == "completed"

    dl_res = client.get(f"/api/v1/certificates/{cert_id}/download")
    assert dl_res.status_code == status.HTTP_200_OK
    assert dl_res.headers["content-type"] == "application/pdf"


def test_list_all_certificates(client):
    payload = {
        "organization_name": "ABC Tech",
        "course_name": "Modern Python",
        "event_name": "Workshop 2026",
        "issue_date": "2026-10-07",
        "recipients": [{"name": "Global User", "email": "global@example.com"}],
    }
    client.post("/api/v1/jobs", json=payload)

    res = client.get("/api/v1/certificates")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total"] >= 1
    assert len(data["certificates"]) >= 1


def test_certificate_not_found(client):
    random_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/certificates/{random_id}")
    assert res.status_code == status.HTTP_404_NOT_FOUND
