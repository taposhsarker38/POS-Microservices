# apps/inventory/views.py
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Category, Product, Stock, StockTransaction,
    InventoryChangeRequest
)
from .serializers import (
    CategorySerializer, ProductSerializer, StockSerializer, StockTransactionSerializer,
    InventoryChangeRequestSerializer, InventoryChangeRequestCreateSerializer
)
from .permissions import HasPermission, IsRequesterOrApproverOrReadOnly
from .utils import publish_audit, token_has_permission
from .notifications import check_and_notify_low_stock


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, HasPermission]


class ProductViewSet(viewsets.ModelViewSet):
    """
    CRUD for products.
    """
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, HasPermission]


class StockViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    @action(detail=False, methods=['post'], url_path='initialize')
    def initialize(self, request):
        product_id = request.data.get('product_id')
        company_id = request.data.get('company_id')
        wing_id = request.data.get('wing_id')
        qty = int(request.data.get('qty', 0))
        external_id = request.data.get('external_id', None)

        # ✅ Validation
        if not all([product_id, company_id, wing_id]):
            return Response({'detail': 'product_id, company_id, wing_id required'}, status=400)
        if qty <= 0:
            return Response({'detail': 'qty must be positive'}, status=400)

        with transaction.atomic():
            # ✅ get_or_create ensures duplicate prevention
            stock, created = Stock.objects.select_for_update().get_or_create(
                product_id=product_id,
                company_id=company_id,
                wing_id=wing_id,
                defaults={'qty': qty, 'reserved': 0}
            )
            if not created:
                stock.qty = qty
                stock.reserved = 0
                stock.save()

            # ✅ Transaction log
            if external_id and StockTransaction.objects.filter(external_id=external_id).exists():
                tx = StockTransaction.objects.filter(external_id=external_id).first()
                return Response({
                    'detail': 'already initialized',
                    'stock': StockSerializer(stock).data,
                    'tx': StockTransactionSerializer(tx).data
                }, status=200)

            tx = StockTransaction.objects.create(
                stock=stock,
                change=qty,
                reason='initialize',
                external_id=external_id,
                created_by_id=getattr(request.user, 'id', None),
                created_by_username=getattr(request.user, 'username', None)
            )

            # ✅ Audit log
            publish_audit({
                'actor_id': str(getattr(request.user, 'id', None)),
                'actor_username': getattr(request.user, 'username', None),
                'service': 'inventory-service',
                'action': 'stock.initialize',
                'resource_type': 'product',
                'resource_id': str(product_id),
                'details': {'qty': qty, 'company_id': company_id, 'wing_id': wing_id, 'external_id': external_id},
                'ip_address': request.META.get('REMOTE_ADDR')
            })

        return Response({
            'detail': 'initialized',
            'stock': StockSerializer(stock).data,
            'tx': StockTransactionSerializer(tx).data
        }, status=201)
    @action(detail=False, methods=['post'], url_path='reserve')
    def reserve(self, request):
        self.required_permission = 'stock.reserve'
        product_id = request.data.get('product_id')
        company_id = request.data.get('company_id')
        wing_id = request.data.get('wing_id')
        external_id = request.data.get('external_id')

        try:
            qty = int(request.data.get('qty', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'qty must be integer'}, status=400)
        if qty <= 0:
            return Response({'detail': 'qty must be positive'}, status=400)

        with transaction.atomic():
            stock, created = Stock.objects.select_for_update().get_or_create(
                product_id=product_id, company_id=company_id, wing_id=wing_id,
                defaults={'qty': qty, 'reserved': 0}
            )

            if external_id and StockTransaction.objects.filter(external_id=external_id).exists():
                return Response({'detail': 'already reserved'}, status=200)

            available = stock.qty - stock.reserved
            if available < qty:
                return Response({'detail': 'insufficient stock', 'available': available}, status=400)

            stock.reserved += qty
            stock.save()

            tx = StockTransaction.objects.create(
                stock=stock,
                change=-qty,
                reason='reserve',
                external_id=external_id,
                created_by_id=getattr(request.user, 'id', None),
                created_by_username=getattr(request.user, 'username', None)
            )

        publish_audit({
            'actor_id': str(getattr(request.user, 'id', None)),
            'actor_username': getattr(request.user, 'username', None),
            'service': 'inventory-service',
            'action': 'stock.reserve',
            'resource_type': 'product',
            'resource_id': str(product_id),
            'details': {'qty': qty, 'company_id': company_id, 'wing_id': wing_id, 'external_id': external_id},
            'ip_address': request.META.get('REMOTE_ADDR')
        })

        try:
            check_and_notify_low_stock(stock)
        except Exception:
            pass

        return Response({'detail': 'reserved', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data})

    @action(detail=False, methods=['post'], url_path='finalize')
    def finalize(self, request):
        self.required_permission = 'stock.decrease'
        product_id = request.data.get('product_id')
        company_id = request.data.get('company_id')
        wing_id = request.data.get('wing_id')
        external_id = request.data.get('external_id')

        try:
            qty = int(request.data.get('qty', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'qty must be integer'}, status=400)
        if qty <= 0:
            return Response({'detail': 'qty must be positive'}, status=400)

        with transaction.atomic():
            stock, created = Stock.objects.select_for_update().get_or_create(
                product_id=product_id, company_id=company_id, wing_id=wing_id,
                defaults={'qty': qty, 'reserved': 0}
            )

            if external_id and StockTransaction.objects.filter(external_id=external_id).exists():
                return Response({'detail': 'already finalized'}, status=200)

            if stock.reserved >= qty:
                stock.reserved -= qty
                stock.qty -= qty
            else:
                if stock.qty < qty:
                    return Response({'detail': 'insufficient stock', 'available': stock.qty}, status=400)
                stock.qty -= qty
                stock.reserved = max(0, stock.reserved - qty)

            stock.save()

            tx = StockTransaction.objects.create(
                stock=stock,
                change=-qty,
                reason='finalize',
                external_id=external_id,
                created_by_id=getattr(request.user, 'id', None),
                created_by_username=getattr(request.user, 'username', None)
            )

        publish_audit({
            'actor_id': str(getattr(request.user, 'id', None)),
            'actor_username': getattr(request.user, 'username', None),
            'service': 'inventory-service',
            'action': 'stock.finalize',
            'resource_type': 'product',
            'resource_id': str(product_id),
            'details': {'qty': qty, 'company_id': company_id, 'wing_id': wing_id, 'external_id': external_id},
            'ip_address': request.META.get('REMOTE_ADDR')
        })

        try:
            check_and_notify_low_stock(stock)
        except Exception:
            pass

        return Response({'detail': 'finalized', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data})

    @action(detail=False, methods=['post'], url_path='adjust')
    def adjust(self, request):
        product_id = request.data.get('product_id')
        company_id = request.data.get('company_id')
        wing_id = request.data.get('wing_id')
        external_id = request.data.get('external_id')
        reason = request.data.get('reason', 'adjust')

        try:
            change = int(request.data.get('change', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'change must be integer'}, status=400)
        if change == 0:
            return Response({'detail': 'change cannot be zero'}, status=400)

        user = request.user

        # direct adjust if user has permission
        if token_has_permission(request, 'stock.approve_adjust') or getattr(user, 'is_staff', False):
            with transaction.atomic():
                stock, _ = Stock.objects.select_for_update().get_or_create(
                    product_id=product_id, company_id=company_id, wing_id=wing_id,
                    defaults={'qty': 0, 'reserved': 0}
                )

                # idempotency check
                if external_id and StockTransaction.objects.filter(external_id=external_id).exists():
                    tx = StockTransaction.objects.filter(external_id=external_id).first()
                    return Response({'detail': 'already adjusted', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data}, status=200)

                stock.qty += change
                stock.save()

                tx = StockTransaction.objects.create(
                    stock=stock,
                    change=change,
                    reason=reason,
                    external_id=external_id,
                    created_by_id=getattr(user, 'id', None),
                    created_by_username=getattr(user, 'username', None)
                )

            publish_audit({
                'actor_id': str(getattr(user, 'id', None)),
                'actor_username': getattr(user, 'username', None),
                'service': 'inventory-service',
                'action': 'stock.adjust',
                'resource_type': 'product',
                'resource_id': str(product_id),
                'details': {'change': change, 'company_id': company_id, 'wing_id': wing_id, 'reason': reason, 'external_id': external_id},
                'ip_address': request.META.get('REMOTE_ADDR')
            })

            try:
                check_and_notify_low_stock(stock)
            except Exception:
                pass

            return Response({'detail': 'adjusted', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data}, status=200)

        # ELSE: create InventoryChangeRequest for approval
        with transaction.atomic():
            if external_id and InventoryChangeRequest.objects.filter(external_id=external_id).exists():
                existing = InventoryChangeRequest.objects.filter(external_id=external_id).first()
                return Response({'detail': 'request already exists', 'request': InventoryChangeRequestSerializer(existing).data}, status=200)

            icr_data = {
                'product': product_id,
                'company_id': company_id,
                'wing_id': wing_id,
                'change': change,
                'reason': reason,
                'external_id': external_id
            }

            icr_serializer = InventoryChangeRequestCreateSerializer(data=icr_data)
            icr_serializer.is_valid(raise_exception=True)
            icr_obj = icr_serializer.save(
                requested_by_id=getattr(user, 'id', None),
                requested_by_username=getattr(user, 'username', None),
                status=InventoryChangeRequest.STATUS_PENDING
            )

        publish_audit({
            'actor_id': str(getattr(user, 'id', None)),
            'actor_username': getattr(user, 'username', None),
            'service': 'inventory-service',
            'action': 'icr.created',
            'resource_type': 'inventory_change_request',
            'resource_id': str(icr_obj.id),
            'details': {'product': str(product_id), 'change': change, 'reason': reason, 'external_id': external_id},
            'ip_address': request.META.get('REMOTE_ADDR')
        })

        return Response({'detail': 'request_created', 'request': InventoryChangeRequestSerializer(icr_obj).data}, status=201)


class InventoryChangeRequestViewSet(viewsets.ModelViewSet):
    queryset = InventoryChangeRequest.objects.all().order_by('-created_at')
    serializer_class = InventoryChangeRequestSerializer
    permission_classes = [IsAuthenticated, HasPermission, IsRequesterOrApproverOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return InventoryChangeRequestCreateSerializer
        return InventoryChangeRequestSerializer

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            requested_by_id=getattr(user, 'id', None),
            requested_by_username=getattr(user, 'username', None),
            status=InventoryChangeRequest.STATUS_PENDING
        )
        req = serializer.instance
        publish_audit({
            'actor_id': str(getattr(user, 'id', None)),
            'actor_username': getattr(user, 'username', None),
            'service': 'inventory-service',
            'action': 'icr.created',
            'resource_type': 'inventory_change_request',
            'resource_id': str(req.id),
            'details': {'product': str(req.product_id), 'change': req.change, 'reason': req.reason, 'external_id': req.external_id},
            'ip_address': self.request.META.get('REMOTE_ADDR')
        })

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        self.required_permission = 'stock.approve_adjust'
        req = self.get_object()

        if req.status != InventoryChangeRequest.STATUS_PENDING:
            return Response({'detail': 'request not pending'}, status=400)

        with transaction.atomic():
            stock, _ = Stock.objects.select_for_update().get_or_create(
                product=req.product, company_id=req.company_id, wing_id=req.wing_id,
                defaults={'qty': 0, 'reserved': 0}
            )

            new_qty = stock.qty + req.change
            if new_qty < 0:
                return Response({'detail': 'insufficient stock for requested decrease'}, status=400)

            stock.qty = new_qty
            stock.save()

            # create transaction if not idempotent
            if req.external_id and StockTransaction.objects.filter(external_id=req.external_id).exists():
                tx = StockTransaction.objects.filter(external_id=req.external_id).first()
            else:
                tx = StockTransaction.objects.create(
                    stock=stock,
                    change=req.change,
                    reason=f'approved:{req.reason}',
                    external_id=req.external_id,
                    created_by_id=getattr(request.user, 'id', None),
                    created_by_username=getattr(request.user, 'username', None)
                )

            req.status = InventoryChangeRequest.STATUS_APPROVED
            req.approver_id = getattr(request.user, 'id', None)
            req.approver_username = getattr(request.user, 'username', None)
            req.approver_comment = request.data.get('approver_comment', '')
            req.acted_at = timezone.now()
            req.save()

        publish_audit({
            'actor_id': str(getattr(request.user, 'id', None)),
            'actor_username': getattr(request.user, 'username', None),
            'service': 'inventory-service',
            'action': 'icr.approved',
            'resource_type': 'inventory_change_request',
            'resource_id': str(req.id),
            'details': {'stock_id': str(stock.id), 'change': req.change, 'tx_id': str(tx.id), 'external_id': req.external_id},
            'ip_address': request.META.get('REMOTE_ADDR')
        })

        # notify requester (placeholder via audit pubsub)
        publish_audit({
            'actor_id': str(getattr(request.user, 'id', None)),
            'actor_username': getattr(request.user, 'username', None),
            'service': 'inventory-service',
            'action': 'notification.icr.approved',
            'resource_type': 'inventory_change_request',
            'resource_id': str(req.id),
            'details': {'to': str(req.requested_by_id)},
            'ip_address': request.META.get('REMOTE_ADDR')
        })

        try:
            check_and_notify_low_stock(stock)
        except Exception:
            pass

        return Response({'detail': 'approved', 'stock': {'id': str(stock.id), 'qty': stock.qty}, 'tx': {'id': str(tx.id)}}, status=200)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        self.required_permission = 'stock.approve_adjust'
        req = self.get_object()

        if req.status != InventoryChangeRequest.STATUS_PENDING:
            return Response({'detail': 'request not pending'}, status=400)

        req.status = InventoryChangeRequest.STATUS_REJECTED
        req.approver_id = getattr(request.user, 'id', None)
        req.approver_username = getattr(request.user, 'username', None)
        req.approver_comment = request.data.get('approver_comment', '')
        req.acted_at = timezone.now()
        req.save()

        publish_audit({
            'actor_id': str(getattr(request.user, 'id', None)),
            'actor_username': getattr(request.user, 'username', None),
            'service': 'inventory-service',
            'action': 'icr.rejected',
            'resource_type': 'inventory_change_request',
            'resource_id': str(req.id),
            'details': {'reason': req.approver_comment},
            'ip_address': request.META.get('REMOTE_ADDR')
        })

        # notify requester (placeholder)
        publish_audit({
            'actor_id': str(getattr(request.user, 'id', None)),
            'actor_username': getattr(request.user, 'username', None),
            'service': 'inventory-service',
            'action': 'notification.icr.rejected',
            'resource_type': 'inventory_change_request',
            'resource_id': str(req.id),
            'details': {'to': str(req.requested_by_id)},
            'ip_address': request.META.get('REMOTE_ADDR')
        })

        return Response({'detail': 'rejected'}, status=200)

    def get_queryset(self):
        qs = super().get_queryset()
        status_q = self.request.query_params.get('status')
        if status_q:
            qs = qs.filter(status=status_q)

        token = getattr(self.request, 'auth', None)
        perms = token.get('permissions') if token and hasattr(token, 'get') else []
        if not perms or 'stock.approve_adjust' not in perms:
            user_id = getattr(self.request.user, 'id', None)
            qs = qs.filter(requested_by_id=user_id)
        return qs
