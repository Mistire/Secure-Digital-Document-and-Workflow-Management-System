from rest_framework import serializers
from .models import WorkflowLog

class WorkflowLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True)
    
    class Meta:
        model = WorkflowLog
        fields = '__all__'
