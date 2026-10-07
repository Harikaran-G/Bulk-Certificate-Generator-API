import pytest
from pydantic import ValidationError
from app.schemas.certificate import RecipientInput
from app.schemas.job import CreateJobRequest
from app.services.validation_service import ValidationService


def test_recipient_valid():
    rec = RecipientInput(name="  Harikaran  ", email="HARI@Example.com ")
    assert rec.name == "Harikaran"
    assert rec.email == "hari@example.com"


def test_recipient_empty_name():
    with pytest.raises(ValidationError) as exc:
        RecipientInput(name="   ", email="test@example.com")
    assert "blank or only whitespace" in str(exc.value)


def test_recipient_invalid_email():
    with pytest.raises(ValidationError):
        RecipientInput(name="Harikaran", email="not-an-email")


def test_create_job_empty_recipients():
    with pytest.raises(ValidationError):
        CreateJobRequest(
            organization_name="ABC Tech",
            course_name="Python",
            event_name="Workshop",
            issue_date="2026-10-07",
            recipients=[],
        )


def test_create_job_blank_course_name():
    with pytest.raises(ValidationError) as exc:
        CreateJobRequest(
            organization_name="ABC Tech",
            course_name="   ",
            event_name="Workshop",
            issue_date="2026-10-07",
            recipients=[RecipientInput(name="Hari", email="hari@example.com")],
        )
    assert "Field cannot be blank" in str(exc.value)


def test_validation_service_email_regex():
    assert ValidationService.validate_email("user@example.com") is True
    assert ValidationService.validate_email("invalid.email@") is False
    assert ValidationService.validate_email("") is False


def test_validation_service_recipient_payload():
    valid, err = ValidationService.validate_recipient_payload({"name": "Hari", "email": "hari@example.com"})
    assert valid is True
    assert err is None

    valid, err = ValidationService.validate_recipient_payload({"name": "", "email": "hari@example.com"})
    assert valid is False
    assert "name cannot be empty" in err

    valid, err = ValidationService.validate_recipient_payload({"name": "Hari", "email": "invalid"})
    assert valid is False
    assert "invalid" in err
