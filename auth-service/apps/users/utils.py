from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.urls import reverse

EMAIL_CONFIRM_SALT = 'email-confirm-salt'
EMAIL_CONFIRM_EXP_SECONDS = 60 * 60 * 24

def generate_email_token(user):
    payload = {'user_id': str(user.id)}
    return signing.dumps(payload, salt=EMAIL_CONFIRM_SALT)

def verify_email_token(token, max_age=EMAIL_CONFIRM_EXP_SECONDS):
    try:
        return signing.loads(token, salt=EMAIL_CONFIRM_SALT, max_age=max_age)
    except Exception:
        return None

def send_verification_email(user, request):
    token = generate_email_token(user)
    verify_path = reverse('verify-email')  # ensure url name matches
    verify_url = f"{request.scheme}://{request.get_host()}{verify_path}?token={token}"
    subject = "Verify your email"
    message = f"Hi {user.username},\n\nPlease verify: {verify_url}\n\nExpires in 24h."
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
