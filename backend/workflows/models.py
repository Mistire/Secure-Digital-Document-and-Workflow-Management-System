from django.db import models
from django.conf import settings
from documents.models import Document

class WorkflowLog(models.Model):
    class Action(models.TextChoices):
        SUBMIT = 'submit', 'Submit for Review'
        APPROVE_REVIEW = 'approve_review', 'Approve (Review Stage)'
        REJECT = 'reject', 'Reject'
        APPROVE_FINAL = 'approve_final', 'Final Approval'
        ARCHIVE = 'archive', 'Archive'

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='workflow_logs')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    previous_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    comments = models.TextField(blank=True)

    def __str__(self):
        return f"{self.document.title}: {self.action} by {self.actor}"
