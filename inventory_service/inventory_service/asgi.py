"""
ASGI config for inventory_service project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack 
from django.core.asgi import get_asgi_application
from django.urls import path
from apps.notifications.consumers import CompanyConsumer  
from apps.common.middleware import JwtAuthMiddleware  

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_service.settings')

django.setup()

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JwtAuthMiddleware(
        URLRouter([
            path("ws/company/<uuid:company_id>/", CompanyConsumer.as_asgi()),
            # add other routes if needed
        ])
    ),
})

