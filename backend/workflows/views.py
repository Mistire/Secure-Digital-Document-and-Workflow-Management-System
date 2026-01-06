from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from django.shortcuts import get_object_or_404
from documents.models import Document
from .models import WorkflowLog
from .serializers import WorkflowLogSerializer
from access_control.services import AccessControlService

class WorkflowViewSet(viewsets.GenericViewSet):
    queryset = Document.objects.all()
    serializer_class = WorkflowLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _transition(self, request, document, action_name, new_status, required_role=None):
        context = {'ip_address': AccessControlService.get_client_ip(request)}
        
        if not AccessControlService.check_access(request.user, document, action_name, context):
             return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)

        prev_status = document.status
        document.status = new_status
        document.save()
        
        WorkflowLog.objects.create(
            document=document,
            actor=request.user,
            action=action_name,
            previous_status=prev_status,
            new_status=new_status,
            comments=request.data.get('comments', '')
        )
        
        return Response({"status": "transition successful", "new_state": new_status})

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        document = self.get_object()
        if document.status != 'draft':
            return Response({"detail": "Example: Can only submit drafts."}, status=400)
        
        return self._transition(request, document, 'submit', 'review')

    @action(detail=True, methods=['post'])
    def approve_review(self, request, pk=None):
        document = self.get_object()
        if document.status != 'review':
            return Response({"detail": "Document not in review."}, status=400)
        return self._transition(request, document, 'approve_review', 'approval')

    @action(detail=True, methods=['post'])
    def approve_final(self, request, pk=None):
        document = self.get_object()
        if document.status != 'approval':
             return Response({"detail": "Document not pending approval."}, status=400)
        return self._transition(request, document, 'approve_final', 'active')

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        document = self.get_object()
        return self._transition(request, document, 'reject', 'draft')

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        document = self.get_object()
        if document.status != 'active':
            return Response({"detail": "Only approved (active) documents can be archived."}, status=400)
        return self._transition(request, document, 'archive', 'archived')
