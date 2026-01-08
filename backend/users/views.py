import base64
import requests
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.mail import send_mail
from django.http import HttpResponse
from django.shortcuts import redirect
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import generics, status, viewsets, permissions
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .captcha import generate_captcha
from .serializers import (
    UserRegistrationSerializer, 
    UserAdminSerializer, 
    CustomTokenObtainPairSerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        recaptcha_token = request.data.get('recaptcha_token')
        if not recaptcha_token:
            return Response({'recaptcha': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            recaptcha_response = requests.post(
                'https://www.google.com/recaptcha/api/siteverify',
                data={
                    'secret': settings.RECAPTCHA_SECRET_KEY,
                    'response': recaptcha_token
                }
            )
            recaptcha_response.raise_for_status() 
            res_data = recaptcha_response.json()
        except requests.exceptions.RequestException:
            return Response({'error': 'Could not verify reCAPTCHA. Please try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError:
            return Response({'error': 'Invalid reCAPTCHA response from Google.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if not res_data.get('success'):
            return Response({'error': 'Invalid or expired reCAPTCHA. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
        
        response = super().post(request, *args, **kwargs)
        if response.status_code == 201:
            username = response.data['username']
            user = User.objects.get(username=username)
            user.is_active = False 
            user.save()

            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(str(user.pk)))
            
            verify_url = f"http://localhost:3000/verify-email?uid={uid}&token={token}"
            
            html_content = render_to_string('emails/verification_email.html', {
                'username': user.username,
                'verify_url': verify_url,
            })
            
            try:
                send_mail(
                    'Verify your account',
                    f'Please verify your account by visiting: {verify_url}',
                    settings.EMAIL_HOST_USER,
                    [user.email],
                    fail_silently=False,
                    html_message=html_content,
                )
            except Exception as mail_err:
                print(f"--- EMAIL SENDING FAILED: {str(mail_err)} ---")
            
            return Response({'detail': 'Registration successful. Please check your email (and spam folder) to verify your account.'}, status=status.HTTP_201_CREATED)
        return response

class VerifyEmailView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        uidb64 = request.GET.get('uid')
        token = request.GET.get('token')
        
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return redirect('http://localhost:3000/login?verified=true')
        return redirect('http://localhost:3000/login?verified=error')

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'detail': 'Email successfully verified.'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid verification link or token.'}, status=status.HTTP_400_BAD_REQUEST)

class CaptchaView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        key, image_bytes = generate_captcha()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        return Response({
            'captcha_key': key,
            'captcha_image': f"data:image/png;base64,{image_base64}"
        })

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']
