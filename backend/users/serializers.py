from rest_framework import serializers, exceptions
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import pyotp

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'phone_number', 'department')
        extra_kwargs = {
            'email': {'required': True},
            'department': {'required': False},
            'phone_number': {'required': False}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number', ''),
            department=validated_data.get('department', '')
        )
        return user

class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone_number', 'department', 'clearance_level', 'is_staff', 'is_active', 'password')
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['otp'] = serializers.CharField(required=False, write_only=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['department'] = user.department
        token['clearance_level'] = user.clearance_level
        token['mfa_enabled'] = user.mfa_enabled

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        if self.user.mfa_enabled:
            otp = attrs.get('otp')
            if not otp:
                raise exceptions.AuthenticationFailed("MFA_REQUIRED", code="mfa_required")
            
            totp = pyotp.TOTP(self.user.mfa_secret)
            if not totp.verify(otp):
                raise exceptions.AuthenticationFailed("Invalid OTP code", code="invalid_otp")
        
        return data
