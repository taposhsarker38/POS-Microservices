import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'change_me_company')
DEBUG = os.getenv('DEBUG', '0') == '1'
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS','localhost,127.0.0.1').split(',')]

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework','corsheaders',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'apps.companies',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.common.middleware.CorrelationIdMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'company_service.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'company_service.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default':{
        'ENGINE':'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'companydb'),
        'USER': os.getenv('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', '01713447728'),
        'HOST': os.getenv('POSTGRES_HOST','auth-db'),
        'PORT': os.getenv('POSTGRES_PORT','5432'),
    }
}
CORS_ALLOW_ALL_ORIGINS = True 

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# settings.py
SIMPLE_JWT = {
    'ALGORITHM': os.getenv('JWT_ALGORITHM','HS256'),
    'SIGNING_KEY': os.getenv('JWT_SECRET','supersecretjwtkey'),
    'USER_ID_CLAIM': os.getenv('JWT_USER_ID_CLAIM', 'user_id'),
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
}
# settings.py (company-service)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.common.authentication.JWTAuthenticationNoDB',
        # optionally allow SessionAuthentication for admin access:
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}


# audit config
AUTH_SERVICE_AUDIT_URL = os.getenv('AUTH_SERVICE_AUDIT_URL','http://auth-web:8001/api/v1/audit/')
SERVICE_API_TOKEN = os.getenv('SERVICE_API_TOKEN','')
SERVICE_NAME = os.getenv('SERVICE_NAME','company-service')
AUDIT_LOCAL_QUEUE = os.getenv('AUDIT_LOCAL_QUEUE','/tmp/audit_events.log')

# drf-spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Company API',         # change per service (Inventory, Auth etc.)
    'DESCRIPTION': 'Company microservice API',
    'VERSION': 'v1',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENTS': {
        'securitySchemes': {
            'BearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            },
        },
    },
    'SECURITY': [{'BearerAuth': []}],  # apply globally in docs (so Authorize appears)
}