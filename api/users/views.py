import json
import secrets
import traceback
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connection
from .models import Tenant, User, Session


def generate_token():
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """
    Authenticate user using deviceId + PIN
    
    Flow:
    1. Check if deviceId exists in devices table
    2. If device has no users, first login becomes admin and needs to set password
    3. For subsequent logins, check if PIN matches admin password (for admin)
    4. Regular users just need their PIN
    
    Expected payload:
    {
        "deviceId": "<string>",
        "username": "<PIN>",
        "password": "<PIN>",
        "adminPassword": "<optional, only for first user setup>"
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
    admin_password = data.get("adminPassword")  # Only for first user setup

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
        # Get or create tenant (represents the VR device)
        tenant, tenant_created = Tenant.objects.get_or_create(
            device_id=device_id,
            defaults={'name': f'Device {device_id}'}
        )
        
        # Check if this device has any users or admin password set
        user_count = User.objects.filter(tenant=tenant).count()
        has_admin = bool(tenant.admin_password)
        
        if not has_admin:
            # First time setup - need to set admin password
            if not admin_password:
                return JsonResponse({
                    "needsAdminSetup": True,
                    "message": "First user must set admin password"
                }, status=200)
            
            # Store admin password in tenant (admin doesn't get a User entry)
            tenant.admin_password = admin_password
            tenant.save()
            
            # Generate session token for admin (24 hour expiration)
            token = generate_token()
            Session.create_session(
                token=token,
                tenant=tenant,
                user=None,
                device_id=device_id,
                pin=admin_password,
                is_admin=True,
                hours=24
            )
            
            return JsonResponse({
                "token": token,
                "user": {
                    "id": None,
                    "pin": admin_password,
                    "device_id": device_id,
                    "tenant_id": str(tenant.id),
                    "is_admin": True
                },
                "message": "Admin account created successfully"
            })
        
        # Check if this PIN is for the admin
        if tenant.admin_password and pin == tenant.admin_password:
            # This is admin login - admin cannot use the training system
            token = generate_token()
            Session.create_session(
                token=token,
                tenant=tenant,
                user=None,
                device_id=device_id,
                pin=pin,
                is_admin=True,
                hours=24
            )
            
            return JsonResponse({
                "token": token,
                "user": {
                    "id": None,
                    "pin": pin,
                    "device_id": device_id,
                    "tenant_id": str(tenant.id),
                    "is_admin": True
                },
                "message": "Admin login successful"
            })
        else:
            # Regular user login
            user, _ = User.objects.get_or_create(tenant=tenant, pin=pin)
            is_admin = False

        # Generate session token (24 hour expiration)
        token = generate_token()
        Session.create_session(
            token=token,
            tenant=tenant,
            user=user,
            device_id=device_id,
            pin=pin,
            is_admin=False,
            hours=24
        )

        # Return user info
        return JsonResponse({
            "token": token,
            "user": {
                "id": str(user.id),
                "pin": user.pin,
                "device_id": device_id,
                "tenant_id": str(tenant.id),
                "is_admin": is_admin
            }
        })
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
        Session.objects.filter(token=token).delete()
    
    return JsonResponse({"message": "Logged out successfully"}, status=200)


@require_http_methods(["GET"])
def me(request):
    """Get current authenticated user info"""
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    token = auth_header.split(" ", 1)[1]
    session = Session.get_valid_session(token)
    
    if not session:
        return JsonResponse({"error": "Invalid or expired token"}, status=401)
    
    try:
        # Check if this is an admin session
        if session.is_admin:
            return JsonResponse({
                "user": {
                    "id": None,
                    "pin": session.pin,
                    "device_id": session.tenant.device_id,
                    "tenant_id": str(session.tenant.id),
                    "is_admin": True
                }
            }, status=200)
        
        # Regular user
        user = session.user
        if not user:
            return JsonResponse({"error": "User not found"}, status=404)
        
        # Regular users are never admin
        is_admin = False
        
        return JsonResponse({
            "user": {
                "id": user.id,
                "pin": user.pin,
                "device_id": user.tenant.device_id,
                "tenant_id": user.tenant.id,
                "is_admin": is_admin
            }
        }, status=200)
    except Exception as e:
        print(f"Error in /me: {e}")
        traceback.print_exc()
        return JsonResponse({"error": "User not found"}, status=404)


def get_authenticated_user(request):
    """
    Middleware helper to get authenticated user from request.
    Returns (user, tenant) tuple or (None, None) if not authenticated.
    For admin sessions, returns (None, tenant) since admins don't have User entries.
    """
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        print("DEBUG: No Bearer token in Authorization header")
        return None, None
    
    token = auth_header.split(" ", 1)[1]
    session = Session.get_valid_session(token)
    
    if not session:
        print(f"DEBUG: Session not found or expired for token: {token[:20]}...")
        return None, None
    
    print(f"DEBUG: Valid session found for tenant: {session.tenant.device_id}")
    
    # Check if this is an admin session
    if session.is_admin:
        print(f"DEBUG: Admin session detected, tenant_id: {session.tenant.id}")
        return None, session.tenant  # Admin has no User object
    
    # Regular user session
    if session.user:
        print(f"DEBUG: Returning user: ({session.user.id}, {session.tenant.device_id})")
        return session.user, session.tenant
    
    print(f"DEBUG: Session has no user")
    return None, None
