import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class ValidationService:
    @staticmethod
    def validate_email(email: str) -> bool:
        if not email or not isinstance(email, str):
            return False
        return bool(EMAIL_REGEX.match(email.strip()))

    @staticmethod
    def validate_recipient_payload(recipient_dict: dict) -> tuple[bool, str | None]:
        name = recipient_dict.get("name")
        email = recipient_dict.get("email")

        if not name or not isinstance(name, str) or not name.strip():
            return False, "Recipient name cannot be empty."
        if not email or not isinstance(email, str) or not ValidationService.validate_email(email):
            return False, f"Recipient email '{email}' is invalid."
        return True, None
