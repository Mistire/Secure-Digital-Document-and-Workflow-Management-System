import logging
import mimetypes
from django.contrib.contenttypes.models import ContentType
from django.core.files.base import ContentFile
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from cryptography.fernet import InvalidToken

from access_control.models import UserDOCPermission
from access_control.permissions import SecureAccessPolicy
from access_control.services import AccessControlService
from .models import Document, DocumentVersion
from .serializers import DocumentSerializer
from .utils import encrypt_file, decrypt_file

logger = logging.getLogger(__name__)

class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [SecureAccessPolicy]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Document.objects.none()
        
        if user.is_staff or user.is_superuser:
            return Document.objects.all()

        doc_content_type = ContentType.objects.get_for_model(Document)
        
        permitted_doc_ids = UserDOCPermission.objects.filter(
            user=user,
            content_type=doc_content_type,
            is_active=True
        ).values_list('object_id', flat=True)
        
        return Document.objects.filter(
            Q(owner=user) | Q(id__in=permitted_doc_ids)
        ).distinct()


    def perform_create(self, serializer):
        # 1. Encrypt the file before saving
        file_obj = self.request.FILES.get('file')
        if file_obj:
            encrypted_content = encrypt_file(file_obj.read())
            # Wrap encrypted content in a ContentFile
            encrypted_file = ContentFile(encrypted_content, name=file_obj.name)
            instance = serializer.save(owner=self.request.user, file=encrypted_file)
            
            # 2. Create version 1
            DocumentVersion.objects.create(
                document=instance,
                file=instance.file,
                version_number=1,
                created_by=self.request.user
            )
        else:
            serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        old_instance = self.get_object()
        file_obj = self.request.FILES.get('file')
        
        if file_obj:
            # 1. Encrypt and save new file
            encrypted_content = encrypt_file(file_obj.read())
            encrypted_file = ContentFile(encrypted_content, name=file_obj.name)
            instance = serializer.save(file=encrypted_file)
            
            # 2. Increment version
            last_version = instance.versions.order_by('-version_number').first()
            new_v = (last_version.version_number + 1) if last_version else 1
            DocumentVersion.objects.create(
                document=instance,
                file=instance.file,
                version_number=new_v,
                created_by=self.request.user
            )
        else:
            serializer.save()

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        document = self.get_object()
        is_owner = document.owner == request.user
        is_admin = request.user.is_staff or request.user.is_superuser
        is_active = document.status == 'active'

        if not (is_active or is_owner or is_admin):
            return HttpResponse("Unauthorized to download this document in its current state.", status=403)

        if not document.file:
            return HttpResponse("No file associated with this document.", status=404)

        try:
            if not document.file.storage.exists(document.file.name):
                return HttpResponse("File does not exist on server.", status=404)

            with document.file.open('rb') as f:
                raw_content = f.read()
            
            try:
                content = decrypt_file(raw_content)
            except (InvalidToken, ValueError):
                content = raw_content
                
            content_type, _ = mimetypes.guess_type(document.file.name)
            if not content_type:
                content_type = 'application/octet-stream'

            response = HttpResponse(content, content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{document.file.name.split("/")[-1]}"'
            return response
        except Exception as e:
            print(f"DOWNLOAD EXCEPTION: {str(e)}")
            return HttpResponse(f"Error processing file: {str(e)}", status=500)



