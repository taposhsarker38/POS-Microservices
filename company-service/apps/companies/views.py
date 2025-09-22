from rest_framework import viewsets, status, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db import connection
import hmac
import hashlib
import json
import uuid
from rest_framework.permissions import IsAuthenticated
from .models import Company, Wing, Currency, InvoiceSettings, Employee
from .serializers import CompanySerializer, WingSerializer, CurrencySerializer, InvoiceSettingsSerializer, EmployeeSerializer
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


class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer

    @action(detail=False, methods=["get"])
    def base(self, request):
        base = Currency.objects.filter(is_base=True).first()
        if not base:
            return Response({"detail": "No base currency set"}, status=status.HTTP_404_NOT_FOUND)
        return Response(CurrencySerializer(base).data)


class InvoiceSettingsViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin, mixins.UpdateModelMixin):
    queryset = InvoiceSettings.objects.select_related("company", "default_currency").all()
    serializer_class = InvoiceSettingsSerializer

    def get_object(self):
        company_id = self.request.query_params.get("company_id")
        if company_id:
            return get_object_or_404(InvoiceSettings, company_id=company_id)
        return super().get_object()

    @action(detail=True, methods=["post"])
    def allocate_number(self, request, pk=None):
        settings_obj = self.get_object()
        try:
            invoice_no = settings_obj.allocate_invoice_number()
            return Response({"invoice_number": invoice_no})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    @action(detail=True, methods=["post"], url_path="link-user")
    def link_user(self, request, pk=None):
        emp = self.get_object()
        external_user_id = request.data.get("external_user_id")
        try:
            if external_user_id:
                emp.external_user_id = uuid.UUID(external_user_id)
            else:
                emp.external_user_id = None
            emp.save(update_fields=["external_user_id"])
            return Response({"status": "linked", "external_user_id": str(emp.external_user_id)})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ----------------- secure webhook to link auth-service users -----------------
class AuthWebhookAPIView(APIView):
   

    def post(self, request, *args, **kwargs):
        secret = getattr(settings, "WEBHOOK_SECRET", None)
        raw_body = request.body or b""

        if secret:
            sig = request.META.get("HTTP_X_SIGNATURE") or request.META.get("HTTP_X_SIGNATURE".lower())
            if not sig:
                return Response({"detail": "Missing signature"}, status=status.HTTP_401_UNAUTHORIZED)
            try:
                method, provided = sig.split("=", 1)
            except Exception:
                return Response({"detail": "Invalid signature format"}, status=status.HTTP_401_UNAUTHORIZED)
            if method.lower() != "sha256":
                return Response({"detail": "Invalid signature method"}, status=status.HTTP_401_UNAUTHORIZED)
            mac = hmac.new(secret.encode(), raw_body, hashlib.sha256)
            expected = mac.hexdigest()
            if not hmac.compare_digest(expected, provided):
                return Response({"detail": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception:
            return Response({"detail": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

        event = payload.get("event")
        data = payload.get("data", {})

        if event == "user.created":
            user_id = data.get("id")
            email = data.get("email")
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            company_id = data.get("company_id")

            if not user_id:
                return Response({"detail": "Missing user id"}, status=status.HTTP_400_BAD_REQUEST)

            if email:
                try:
                    emp = Employee.objects.filter(company_id=company_id, email__iexact=email).first()
                    if emp:
                        emp.external_user_id = uuid.UUID(user_id)
                        emp.save(update_fields=["external_user_id"])
                        return Response({"status": "linked_by_email", "employee_id": str(emp.id)})
                except Exception as e:
                    return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            try:
                company = None
                if company_id:
                    company = Company.objects.filter(id=company_id).first()
                if not company:
                    return Response({"detail": "Company not found"}, status=status.HTTP_404_NOT_FOUND)

                emp = Employee.objects.create(
                    company=company,
                    external_user_id=uuid.UUID(user_id),
                    first_name=first_name or "",
                    last_name=last_name or "",
                    email=email or None,
                    employee_code=None,
                    role="other",
                )
                return Response({"status": "created_and_linked", "employee_id": str(emp.id)})

            except Exception as e:
                return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"detail": "event not handled"}, status=status.HTTP_200_OK)