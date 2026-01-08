from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import RegisterView, UserViewSet, CustomTokenObtainPairView, CaptchaView, VerifyEmailView
from rest_framework.routers import DefaultRouter
from django.urls import include

router = DefaultRouter()
router.register(r'users', UserViewSet)

from .mfa_views import MFASetupView, MFAVerifyView

# ...

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('captcha/', CaptchaView.as_view(), name='captcha'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('mfa/setup/', MFASetupView.as_view(), name='mfa_setup'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='mfa_verify'),
    path('admin/', include(router.urls)),
]
