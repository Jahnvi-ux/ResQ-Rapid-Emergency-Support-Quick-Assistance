"""
Minimal free email sender used for SOS notifications (emergency contact
alert + live location share). Uses plain SMTP (e.g. a free Gmail app
password) — no paid provider involved. If SMTP_HOST/USER/PASSWORD are not
set in .env, this safely no-ops and logs instead, matching the fallback
pattern already used elsewhere in this project (weather/AI mocks).
"""
import smtplib
from email.mime.text import MIMEText

from loguru import logger

from app.core.config import settings


def send_email(to_email: str, subject: str, body: str) -> bool:
    if not (settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD):
        logger.info("SMTP not configured — skipping email to {} (subject: {})", to_email, subject)
        return False

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, [to_email], msg.as_string())
        return True
    except Exception as exc:  # noqa: BLE001 — SOS path must never crash on email failure
        logger.warning("Failed to send email to {}: {}", to_email, exc)
        return False
