import smtplib
from email.message import EmailMessage

from .config import (
    EMAIL_FROM,
    EMAIL_TRANSPORT,
    FRONTEND_APP_URL,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_USE_TLS,
)


def send_email(*, to_email: str, subject: str, body: str) -> None:
    if EMAIL_TRANSPORT == "console":
        print(
            "\n--- EMAIL (console transport) ---\n"
            f"From: {EMAIL_FROM}\nTo: {to_email}\nSubject: {subject}\n\n{body}\n"
            "--- END EMAIL ---\n"
        )
        return

    if EMAIL_TRANSPORT != "smtp":
        raise RuntimeError("Invalid EMAIL_TRANSPORT. Use 'console' or 'smtp'.")

    if not SMTP_HOST:
        raise RuntimeError("SMTP_HOST is required when EMAIL_TRANSPORT=smtp.")

    message = EmailMessage()
    message["From"] = EMAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
        if SMTP_USE_TLS:
            smtp.starttls()
        if SMTP_USERNAME:
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
        smtp.send_message(message)


def send_caregiver_invite_email(*, patient_email: str, caregiver_email: str) -> None:
    subject = "Caregiver invite from AI Health Assistant"
    body = (
        f"You have been invited by {patient_email} to become their caregiver in AI Health Assistant.\n\n"
        "Next steps:\n"
        "1. Sign in to your account.\n"
        "2. Open Caregiver Hub.\n"
        "3. Accept the pending caregiver link.\n\n"
        f"Sign in here: {FRONTEND_APP_URL}/login\n"
        f"Caregiver Hub: {FRONTEND_APP_URL}/caregiver\n\n"
        "If you were not expecting this invite, you can ignore this email."
    )
    send_email(to_email=caregiver_email, subject=subject, body=body)
