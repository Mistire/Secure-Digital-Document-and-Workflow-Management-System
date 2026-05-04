from django.test import TestCase
from django.contrib.auth import get_user_model
from documents.models import Document
from .services import AccessControlService
from .models import Role, UserRole

User = get_user_model()

class AccessControlServiceTest(TestCase):
    def setUp(self):
        # Create Users with clearance
        self.user_public = User.objects.create_user(username='public_user', password='password', clearance_level='public')
        self.user_internal = User.objects.create_user(username='internal_user', password='password', clearance_level='internal')
        self.user_confidential = User.objects.create_user(username='confidential_user', password='password', clearance_level='confidential')
        
        # Create Documents with sensitivity
        self.doc_public = Document.objects.create(title='Public Doc', sensitivity_level='public', owner=self.user_public)
        self.doc_internal = Document.objects.create(title='Internal Doc', sensitivity_level='internal', owner=self.user_internal)
        self.doc_confidential = Document.objects.create(title='Confidential Doc', sensitivity_level='confidential', owner=self.user_confidential)

    def test_mac_enforcement(self):
        """Verify Mandatory Access Control Logic"""
        # Public User
        self.assertTrue(AccessControlService.check_mac(self.user_public, self.doc_public))
        self.assertFalse(AccessControlService.check_mac(self.user_public, self.doc_internal))
        self.assertFalse(AccessControlService.check_mac(self.user_public, self.doc_confidential))
        
        # Internal User
        self.assertTrue(AccessControlService.check_mac(self.user_internal, self.doc_public))
        self.assertTrue(AccessControlService.check_mac(self.user_internal, self.doc_internal))
        self.assertFalse(AccessControlService.check_mac(self.user_internal, self.doc_confidential))
        
        # Confidential User
        self.assertTrue(AccessControlService.check_mac(self.user_confidential, self.doc_public))
        self.assertTrue(AccessControlService.check_mac(self.user_confidential, self.doc_internal))
        self.assertTrue(AccessControlService.check_mac(self.user_confidential, self.doc_confidential))

    def test_rbac_enforcement(self):
        """Verify Role Based Access Control"""
        role_reviewer = Role.objects.create(name='Reviewer', permissions=['approve'])
        UserRole.objects.create(user=self.user_public, role=role_reviewer)
        
        # Public user tries to approve (has role)
        # Note: check_access checks MAC first. doc_public is accessible.
        self.assertTrue(AccessControlService.check_access(self.user_public, self.doc_public, 'approve'))
        
        # Public user tries to approve Internal (MAC denies, even if role exists)
        self.assertFalse(AccessControlService.check_access(self.user_public, self.doc_internal, 'approve'))

        # Public user tries actions they don't have role for
        self.assertFalse(AccessControlService.check_access(self.user_public, self.doc_public, 'delete'))
