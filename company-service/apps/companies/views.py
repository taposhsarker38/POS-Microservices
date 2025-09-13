from rest_framework import viewsets, permissions
from .models import Company, Wing
from .serializers import CompanySerializer, WingSerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]  # change to IsAuthenticated later
    lookup_field = 'id'

class WingViewSet(viewsets.ModelViewSet):
    queryset = Wing.objects.all()
    serializer_class = WingSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'
