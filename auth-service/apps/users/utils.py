from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.urls import reverse

EMAIL_CONFIRM_SALT = 'email-confirm-salt'
EMAIL_CONFIRM_EXP_SECONDS = 60 * 60 * 24  # 1 day

def generate_email_token(user):
    payload = {'user_id': str(user.id)}
    token = signing.dumps(payload, salt=EMAIL_CONFIRM_SALT)
    return token

def verify_email_token(token, max_age=EMAIL_CONFIRM_EXP_SECONDS):
    try:
        data = signing.loads(token, salt=EMAIL_CONFIRM_SALT, max_age=max_age)
        return data
    except signing.BadSignature:
        return None
    except signing.SignatureExpired:
        return None

def send_verification_email(user, request):
    token = generate_email_token(user)
    verify_path = reverse('users:verify-email')  # we'll register this name
    verify_url = f"{request.scheme}://{request.get_host()}{verify_path}?token={token}"
    subject = "Verify your email"
    message = f"Hi {user.username},\n\nPlease verify your email by clicking the link below:\n\n{verify_url}\n\nThis link expires in 24 hours."
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
