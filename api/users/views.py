import json
import secrets
import traceback
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Tenant, User


# Simple in-memory session store (use Redis or Django sessions in production)
SESSION_STORE = {}


def generate_token():
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """
    Authenticate user using deviceId + PIN
    
    Expected payload:
    {
        "deviceId": "<string>",
        "username": "<PIN>",
        "password": "<PIN>"
    }
    """
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    device_id = data.get("deviceId")
    username = data.get("username")
    password = data.get("password")

    # Validation
    if not device_id:
        return JsonResponse({"error": "deviceId is required"}, status=400)
    
    if not username or not password:
        return JsonResponse({"error": "username and password are required"}, status=400)

    # Validate that username === password (both should be PIN)
    if username != password:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    pin = username  # username and password are the same PIN

    try:
        # Get or create tenant
        tenant, _ = Tenant.objects.get_or_create(
            device_id=device_id,
            defaults={'name': f'Device {device_id}'}
        )

        # Get or create user (lazy creation)
        user, created = User.objects.get_or_create(
            tenant=tenant,
            pin=pin
        )

        # Generate session token
        token = generate_token()
        SESSION_STORE[token] = {
            "user_id": user.id,
            "tenant_id": tenant.id,
            "device_id": device_id,
            "pin": pin
        }

        # Return user info
        return JsonResponse({
            "token": token,
            "user": {
                "id": user.id,
                "pin": user.pin,
                "device_id": device_id,
                "tenant_id": tenant.id,
                "created": created
            }
        }, status=200)
    except Exception as e:
        print(f"Login error: {e}")
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def logout(request):
    """Logout user by invalidating their token"""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        if token in SESSION_STORE:
            del SESSION_STORE[token]
    
    return JsonResponse({"message": "Logged out successfully"}, status=200)


@require_http_methods(["GET"])
def me(request):
    """Get current authenticated user info"""
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    token = auth_header.split(" ", 1)[1]
    session = SESSION_STORE.get(token)
    
    if not session:
        return JsonResponse({"error": "Invalid or expired token"}, status=401)
    
    try:
        user = User.objects.select_related("tenant").get(id=session["user_id"])
        return JsonResponse({
            "user": {
                "id": user.id,
                "pin": user.pin,
                "device_id": user.tenant.device_id,
                "tenant_id": user.tenant.id
            }
        }, status=200)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)


def get_authenticated_user(request):
    """
    Middleware helper to get authenticated user from request.
    Returns (user, tenant) tuple or (None, None) if not authenticated.
    """
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return None, None
    
    token = auth_header.split(" ", 1)[1]
    session = SESSION_STORE.get(token)
    
    if not session:
        return None, None
    
    try:
        user = User.objects.select_related("tenant").get(id=session["user_id"])
        return user, user.tenant
    except User.DoesNotExist:
        return None, None
