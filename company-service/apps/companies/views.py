from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Company, Wing
from .serializers import CompanySerializer, WingSerializer
from apps.companies.permissions import HasPermission
from apps.common.audit import build_event, publish_event

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, HasPermission]

    def perform_create(self, serializer):
        instance = serializer.save()
        actor = getattr(self.request,'audit_actor',None)
        ip = getattr(self.request,'audit_ip',None)
        event = build_event('company.create','company', resource_id=instance.id, details={'name':instance.name}, actor=actor, ip=ip)
        publish_event(event)

    def perform_update(self, serializer):
        instance = serializer.save()
        actor = getattr(self.request,'audit_actor',None)
        ip = getattr(self.request,'audit_ip',None)
        event = build_event('company.update','company', resource_id=instance.id, details={'name':instance.name}, actor=actor, ip=ip)
        publish_event(event)

    def perform_destroy(self, instance):
        rid = instance.id; name = instance.name
        instance.delete()
        actor = getattr(self.request,'audit_actor',None)
        ip = getattr(self.request,'audit_ip',None)
        event = build_event('company.delete','company', resource_id=rid, details={'name':name}, actor=actor, ip=ip)
        publish_event(event)

class WingViewSet(viewsets.ModelViewSet):
    queryset = Wing.objects.select_related('company').all()
    serializer_class = WingSerializer
    permission_classes = [IsAuthenticated, HasPermission]

    def perform_create(self, serializer):
        instance = serializer.save()
        actor = getattr(self.request,'audit_actor',None)
        ip = getattr(self.request,'audit_ip',None)
        event = build_event('wing.create','wing', resource_id=instance.id, details={'name':instance.name,'company':str(instance.company.id)}, actor=actor, ip=ip)
        publish_event(event)

    def perform_update(self, serializer):
        instance = serializer.save()
        actor = getattr(self.request,'audit_actor',None)
        ip = getattr(self.request,'audit_ip',None)
        event = build_event('wing.update','wing', resource_id=instance.id, details={'name':instance.name}, actor=actor, ip=ip)
        publish_event(event)

    def perform_destroy(self, instance):
        rid = instance.id; name = instance.name
        instance.delete()
        actor = getattr(self.request,'audit_actor',None)
        ip = getattr(self.request,'audit_ip',None)
        event = build_event('wing.delete','wing', resource_id=rid, details={'name':name}, actor=actor, ip=ip)
        publish_event(event)
