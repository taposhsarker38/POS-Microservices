# apps/inventory/views.py
from uuid import UUID

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.db.models import F

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Category, Product, Batch, Stock, StockTransaction,
    InventoryChangeRequest, InventoryAlert, NotificationPreference
)
from .serializers import (
    CategorySerializer, ProductSerializer, BatchSerializer,
    StockSerializer, StockTransactionSerializer,
    InventoryChangeRequestSerializer, InventoryChangeRequestCreateSerializer
)
from .permissions import HasPermission, IsRequesterOrApproverOrReadOnly
from .utils import publish_audit, token_has_permission
from .notifications import check_and_notify_low_stock


# Helper utilities
def parse_uuid(value, field_name='id'):
    """Return string uuid if valid, else raise ValueError."""
    if value is None:
        raise ValueError(f'{field_name} is required')
    try:
        return str(UUID(str(value)))
    except Exception:
        raise ValueError(f'{field_name} is invalid')


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


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all().order_by('-created_at')
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated, HasPermission]


class StockViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, HasPermission]

    def _get_product(self, product_id):
        pid = parse_uuid(product_id, 'product_id')
        return get_object_or_404(Product, id=pid)

    def _get_or_create_batch(self, product, batch_no=None, expiry=None, cost_price=None, qty=0):
        if not batch_no:
            return None
        batch, created = Batch.objects.get_or_create(
            product=product,
            batch_no=batch_no,
            defaults={'expiry_date': expiry, 'cost_price': cost_price or 0, 'qty': qty}
        )
        # if exists and qty provided, you may choose to update batch.qty externally via initialize
        return batch

    @action(detail=False, methods=['post'], url_path='initialize')
    def initialize(self, request):
        """
        Initialize single or multiple stock entries.
        Accept either:
        - single item fields (product_id, company_id, wing_id, qty, external_id, batch_no ...)
        OR
        - {"items": [ { ... }, ... ] }
        """
        payload_items = request.data.get('items')
        if payload_items is None:
            payload_items = [request.data]

        results = []
        user = request.user

        with transaction.atomic():
            for item in payload_items:
                try:
                    product = self._get_product(item.get('product_id'))
                except ValueError as e:
                    results.append({'error': str(e), 'status': 'skipped', 'item': item})
                    continue
                except Exception:
                    results.append({'error': 'product not found', 'status': 'skipped', 'item': item})
                    continue

                try:
                    company_id = parse_uuid(item.get('company_id'), 'company_id')
                    wing_id = parse_uuid(item.get('wing_id'), 'wing_id')
                except ValueError as e:
                    results.append({'error': str(e), 'status': 'skipped', 'item': item})
                    continue

                try:
                    qty = int(item.get('qty', 0))
                except (TypeError, ValueError):
                    results.append({'error': 'qty must be integer', 'status': 'skipped', 'item': item})
                    continue
                if qty <= 0:
                    results.append({'error': 'qty must be positive', 'status': 'skipped', 'item': item})
                    continue

                external_id = item.get('external_id')
                batch_no = item.get('batch_no')
                expiry = item.get('expiry')
                cost_price = item.get('cost_price')

                batch = self._get_or_create_batch(product, batch_no=batch_no, expiry=expiry, cost_price=cost_price, qty=qty)

                stock, created = Stock.objects.select_for_update().get_or_create(
                    product=product, company_id=company_id, wing_id=wing_id, batch=batch,
                    defaults={'qty': qty, 'reserved': 0}
                )
                if not created:
                    # When re-initializing we reset reserved to 0 and set qty
                    stock.qty = qty
                    stock.reserved = 0
                    stock.save()

                # idempotency check for transactions
                if external_id and StockTransaction.objects.filter(external_id=external_id).exists():
                    tx = StockTransaction.objects.filter(external_id=external_id).first()
                    results.append({'status': 'exists', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data})
                    continue

                tx = StockTransaction.objects.create(
                    stock=stock,
                    change=qty,
                    transaction_type='initialize',
                    cost_price=cost_price,
                    reason='initialize',
                    external_id=external_id,
                    created_by_id=getattr(user, 'id', None),
                    created_by_username=getattr(user, 'username', None)
                )

                # publish audit safely
                try:
                    publish_audit({
                        'actor_id': str(getattr(user, 'id', None)),
                        'actor_username': getattr(user, 'username', None),
                        'service': 'inventory-service',
                        'action': 'stock.initialize',
                        'resource_type': 'product',
                        'resource_id': str(product.id),
                        'details': {'qty': qty, 'company_id': company_id, 'wing_id': wing_id, 'external_id': external_id, 'batch_no': batch_no},
                        'ip_address': request.META.get('REMOTE_ADDR')
                    })
                except Exception:
                    pass

                results.append({'status': 'created', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data})

        return Response({'items': results}, status=201)

    @action(detail=False, methods=['post'], url_path='reserve')
    def reserve(self, request):
        self.required_permission = 'stock.reserve'
        try:
            product = self._get_product(request.data.get('product_id'))
        except Exception as e:
            return Response({'detail': str(e)}, status=400)

        try:
            company_id = parse_uuid(request.data.get('company_id'), 'company_id')
            wing_id = parse_uuid(request.data.get('wing_id'), 'wing_id')
        except ValueError as e:
            return Response({'detail': str(e)}, status=400)

        try:
            qty = int(request.data.get('qty', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'qty must be integer'}, status=400)
        if qty <= 0:
            return Response({'detail': 'qty must be positive'}, status=400)

        external_id = request.data.get('external_id')
        batch_no = request.data.get('batch_no')
        batch = self._get_or_create_batch(product, batch_no=batch_no) if batch_no else None

        with transaction.atomic():
            stock, created = Stock.objects.select_for_update().get_or_create(
                product=product, company_id=company_id, wing_id=wing_id, batch=batch,
                defaults={'qty': 0, 'reserved': 0}
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
                transaction_type='reserve',
                reason='reserve',
                external_id=external_id,
                created_by_id=getattr(request.user, 'id', None),
                created_by_username=getattr(request.user, 'username', None)
            )

        try:
            publish_audit({
                'actor_id': str(getattr(request.user, 'id', None)),
                'actor_username': getattr(request.user, 'username', None),
                'service': 'inventory-service',
                'action': 'stock.reserve',
                'resource_type': 'product',
                'resource_id': str(product.id),
                'details': {'qty': qty, 'company_id': company_id, 'wing_id': wing_id, 'external_id': external_id, 'batch_no': batch_no},
                'ip_address': request.META.get('REMOTE_ADDR')
            })
        except Exception:
            pass

        try:
            check_and_notify_low_stock(stock)
        except Exception:
            pass

        return Response({'detail': 'reserved', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data})

    @action(detail=False, methods=['post'], url_path='finalize')
    def finalize(self, request):
        self.required_permission = 'stock.decrease'
        try:
            product = self._get_product(request.data.get('product_id'))
        except Exception as e:
            return Response({'detail': str(e)}, status=400)

        try:
            company_id = parse_uuid(request.data.get('company_id'), 'company_id')
            wing_id = parse_uuid(request.data.get('wing_id'), 'wing_id')
        except ValueError as e:
            return Response({'detail': str(e)}, status=400)

        try:
            qty = int(request.data.get('qty', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'qty must be integer'}, status=400)
        if qty <= 0:
            return Response({'detail': 'qty must be positive'}, status=400)

        external_id = request.data.get('external_id')
        batch_no = request.data.get('batch_no')
        batch = self._get_or_create_batch(product, batch_no=batch_no) if batch_no else None

        with transaction.atomic():
            stock, created = Stock.objects.select_for_update().get_or_create(
                product=product, company_id=company_id, wing_id=wing_id, batch=batch,
                defaults={'qty': 0, 'reserved': 0}
            )

            if external_id and StockTransaction.objects.filter(external_id=external_id).exists():
                return Response({'detail': 'already finalized'}, status=200)

            # Must ensure we don't let stock go negative accidentally
            if stock.reserved >= qty:
                # consume reserved first
                stock.reserved -= qty
                stock.qty -= qty
            else:
                # if not enough reserved, ensure overall qty covers it
                if stock.qty < qty:
                    return Response({'detail': 'insufficient stock', 'available': stock.qty}, status=400)
                stock.qty -= qty
                stock.reserved = max(0, stock.reserved - qty)

            stock.save()

            tx = StockTransaction.objects.create(
                stock=stock,
                change=-qty,
                transaction_type='finalize',
                reason='finalize',
                external_id=external_id,
                created_by_id=getattr(request.user, 'id', None),
                created_by_username=getattr(request.user, 'username', None)
            )

        try:
            publish_audit({
                'actor_id': str(getattr(request.user, 'id', None)),
                'actor_username': getattr(request.user, 'username', None),
                'service': 'inventory-service',
                'action': 'stock.finalize',
                'resource_type': 'product',
                'resource_id': str(product.id),
                'details': {'qty': qty, 'company_id': company_id, 'wing_id': wing_id, 'external_id': external_id, 'batch_no': batch_no},
                'ip_address': request.META.get('REMOTE_ADDR')
            })
        except Exception:
            pass

        try:
            check_and_notify_low_stock(stock)
        except Exception:
            pass

        return Response({'detail': 'finalized', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data})

    @action(detail=False, methods=['post'], url_path='adjust')
    def adjust(self, request):
        # adjust can either directly apply (if user has permission) or create ICR (pending)
        try:
            product = self._get_product(request.data.get('product_id'))
        except Exception as e:
            return Response({'detail': str(e)}, status=400)

        try:
            company_id = parse_uuid(request.data.get('company_id'), 'company_id')
            wing_id = parse_uuid(request.data.get('wing_id'), 'wing_id')
        except ValueError as e:
            return Response({'detail': str(e)}, status=400)

        try:
            change = int(request.data.get('change', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'change must be integer'}, status=400)
        if change == 0:
            return Response({'detail': 'change cannot be zero'}, status=400)

        external_id = request.data.get('external_id')
        reason = request.data.get('reason', 'adjust')
        user = request.user

        # Direct adjust if user can approve
        if token_has_permission(request, 'stock.approve_adjust') or getattr(user, 'is_staff', False):
            with transaction.atomic():
                stock, _ = Stock.objects.select_for_update().get_or_create(
                    product=product, company_id=company_id, wing_id=wing_id,
                    defaults={'qty': 0, 'reserved': 0}
                )

                if external_id and StockTransaction.objects.filter(external_id=external_id).exists():
                    tx = StockTransaction.objects.filter(external_id=external_id).first()
                    return Response({'detail': 'already adjusted', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data}, status=200)

                # If negative change, ensure we don't go below zero
                if change < 0 and (stock.qty + change) < 0:
                    return Response({'detail': 'insufficient stock for this adjustment'}, status=400)

                stock.qty += change
                # Ensure reserved doesn't exceed qty (in case of negative change)
                if stock.reserved > stock.qty:
                    stock.reserved = min(stock.reserved, stock.qty)
                stock.save()

                tx = StockTransaction.objects.create(
                    stock=stock,
                    change=change,
                    transaction_type='adjust',
                    reason=reason,
                    external_id=external_id,
                    created_by_id=getattr(user, 'id', None),
                    created_by_username=getattr(user, 'username', None)
                )

            try:
                publish_audit({
                    'actor_id': str(getattr(user, 'id', None)),
                    'actor_username': getattr(user, 'username', None),
                    'service': 'inventory-service',
                    'action': 'stock.adjust',
                    'resource_type': 'product',
                    'resource_id': str(product.id),
                    'details': {'change': change, 'company_id': company_id, 'wing_id': wing_id, 'reason': reason, 'external_id': external_id},
                    'ip_address': request.META.get('REMOTE_ADDR')
                })
            except Exception:
                pass

            try:
                check_and_notify_low_stock(stock)
            except Exception:
                pass

            return Response({'detail': 'adjusted', 'stock': StockSerializer(stock).data, 'tx': StockTransactionSerializer(tx).data}, status=200)

        # Else create InventoryChangeRequest for approval
        with transaction.atomic():
            if external_id and InventoryChangeRequest.objects.filter(external_id=external_id).exists():
                existing = InventoryChangeRequest.objects.filter(external_id=external_id).first()
                return Response({'detail': 'request already exists', 'request': InventoryChangeRequestSerializer(existing).data}, status=200)

            icr_data = {
                'product': product.id,
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

        try:
            publish_audit({
                'actor_id': str(getattr(user, 'id', None)),
                'actor_username': getattr(user, 'username', None),
                'service': 'inventory-service',
                'action': 'icr.created',
                'resource_type': 'inventory_change_request',
                'resource_id': str(icr_obj.id),
                'details': {'product': str(product.id), 'change': change, 'reason': reason, 'external_id': external_id},
                'ip_address': request.META.get('REMOTE_ADDR')
            })
        except Exception:
            pass

        return Response({'detail': 'request_created', 'request': InventoryChangeRequestSerializer(icr_obj).data}, status=201)


class InventoryChangeRequestViewSet(viewsets.ModelViewSet):
    queryset = InventoryChangeRequest.objects.all().order_by('-created_at')
    serializer_class = InventoryChangeRequestSerializer
    permission_classes = [IsAuthenticated, HasPermission, IsRequesterOrApproverOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['create']:
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
        try:
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
        except Exception:
            pass

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
            # ensure reserved does not exceed qty
            if stock.reserved > stock.qty:
                stock.reserved = min(stock.reserved, stock.qty)
            stock.save()

            # create transaction if not present
            if req.external_id and StockTransaction.objects.filter(external_id=req.external_id).exists():
                tx = StockTransaction.objects.filter(external_id=req.external_id).first()
            else:
                tx = StockTransaction.objects.create(
                    stock=stock,
                    change=req.change,
                    transaction_type='adjust',
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

        try:
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
        except Exception:
            pass

        # notify requester (via audit or notification system)
        try:
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
        except Exception:
            pass

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

        try:
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
        except Exception:
            pass

        # notify requester (placeholder)
        try:
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
        except Exception:
            pass

        return Response({'detail': 'rejected'}, status=200)

    def get_queryset(self):
        qs = super().get_queryset()
        status_q = self.request.query_params.get('status')
        if status_q:
            qs = qs.filter(status=status_q)

        # restrict list to requester unless user has approve permission
        try:
            if not token_has_permission(self.request, 'stock.approve_adjust'):
                user_id = getattr(self.request.user, 'id', None)
                qs = qs.filter(requested_by_id=user_id)
        except Exception:
            # fallback: restrict to requester
            user_id = getattr(self.request.user, 'id', None)
            qs = qs.filter(requested_by_id=user_id)
        return qs
