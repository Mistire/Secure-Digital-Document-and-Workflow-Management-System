from rest_framework import viewsets, permissions, pagination
from .models import AuditEntry
from .serializers import AuditEntrySerializer

class AuditLogPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditEntry.objects.all().order_by('-timestamp')
    serializer_class = AuditEntrySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AuditLogPagination

