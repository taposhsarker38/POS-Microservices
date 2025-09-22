from django.contrib import admin
from django.urls import path, include,re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.common.views import whoami
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('apps.inventory.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),  # swagger schema (json/yaml)
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/whoami/', include(([path('', whoami),], 'whoami'))),
]
