
from rest_framework import views, permissions, status
from rest_framework.response import Response
import pyotp
import qrcode
import io
import base64
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

User = get_user_model()

class MFASetupView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Generate MFA QR Code",
        description="Generates a new TOTP secret and returns a QR code image (base64) and the secret key.",
        responses={200: OpenApiResponse(description="QR Code and Secret")}
    )
    def get(self, request):
        user = request.user
        if not user.mfa_secret:
            user.mfa_secret = pyotp.random_base32()
            user.save()
        
        # Generare Provisioning URI
        totp = pyotp.TOTP(user.mfa_secret)
        provisioning_uri = totp.provisioning_uri(name=user.username, issuer_name="SecureDocs")
        
        # Generate QR Code
        qr = qrcode.make(provisioning_uri)
        img_buffer = io.BytesIO()
        qr.save(img_buffer, format="PNG")
        img_str = base64.b64encode(img_buffer.getvalue()).decode()
        
        return Response({
            "secret": user.mfa_secret,
            "qr_code": f"data:image/png;base64,{img_str}"
        })

class MFAVerifyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Verify and Enable MFA",
        description="Verify the OTP code provided by the user. If correct, enable MFA for the user.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {'code': {'type': 'string'}}
            }
        },
        responses={
            200: OpenApiResponse(description="MFA Enabled"),
            400: OpenApiResponse(description="Invalid Code")
        }
    )
    def post(self, request):
        code = request.data.get('code')
        user = request.user
        
        if not user.mfa_secret:
             return Response({"error": "MFA setup not initiated"}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(code):
            user.mfa_enabled = True
            user.save()
            return Response({"message": "MFA enabled successfully"})
        
        return Response({"error": "Invalid OTP code"}, status=status.HTTP_400_BAD_REQUEST)
