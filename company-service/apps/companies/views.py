from rest_framework import viewsets, permissions
from .models import Company, Wing
from .serializers import CompanySerializer, WingSerializer
from rest_framework.permissions import IsAuthenticated
from apps.common.permissions import HasPermission
class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, HasPermission]  # change to IsAuthenticated later
    lookup_field = 'id'

class WingViewSet(viewsets.ModelViewSet):
    queryset = Wing.objects.all()
    serializer_class = WingSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    lookup_field = 'id'
