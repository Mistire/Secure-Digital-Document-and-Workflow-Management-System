from rest_framework import serializers
from .models import AuditEntry

class AuditEntrySerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AuditEntry
        fields = '__all__'
