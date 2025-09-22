from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def whoami(request):
    return Response({
        "user": {
            "id": getattr(request.user, 'id', None),
            "username": getattr(request.user, 'username', None),
            "role": getattr(request.user, 'role', None),
            "permissions": getattr(request.user, 'permissions', None),
        },
        "auth_claims": request.auth if isinstance(request.auth, dict) else None
    })
