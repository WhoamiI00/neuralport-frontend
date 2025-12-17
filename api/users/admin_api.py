from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import json
import traceback

from .views import get_authenticated_user


@csrf_exempt
def create_user(request):
    """POST /api/admin/users - Create new user"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    auth_user, auth_tenant = get_authenticated_user(request)
    if not auth_user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        body = json.loads(request.body)
        pin = body.get('pin') or body.get('username')  # Support old 'username' param
        name = body.get('name')
        uniform_number = body.get('uniformNumber') or body.get('uniform_number', 0)
        portrait_image = body.get('portraitImage') or body.get('portrait_image')
        
        if not pin:
            return JsonResponse({"error": "PIN is required"}, status=400)
        
        # Validate 4-digit PIN
        if len(pin) != 4 or not pin.isdigit():
            return JsonResponse({"error": "PIN must be 4 digits"}, status=400)
        
        with connection.cursor() as cursor:
            # Check if user already exists
            cursor.execute("""
                SELECT id FROM users 
                WHERE tenant_id = %s AND pin = %s
            """, [auth_tenant.id, pin])
            
            if cursor.fetchone():
                return JsonResponse({"error": "User already exists"}, status=409)
            
            # Create user
            cursor.execute("""
                INSERT INTO users (tenant_id, pin, created_at, updated_at)
                VALUES (%s, %s, NOW(), NOW())
                RETURNING id
            """, [auth_tenant.id, pin])
            
            user_id = cursor.fetchone()[0]
            
            # Create profile if name provided
            if name:
                cursor.execute("""
                    INSERT INTO user_profiles (user_id, name, uniform_number, portrait_image, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, NOW(), NOW())
                """, [user_id, name, uniform_number, portrait_image])
        
        return JsonResponse({
            "id": user_id,
            "pin": pin,
            "name": name,
            "uniform_number": uniform_number
        }, status=201)
        
    except Exception as e:
        print(f"Error creating user: {e}")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def rename_user(request):
    """POST /api/admin/rename - Rename user"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    auth_user, auth_tenant = get_authenticated_user(request)
    if not auth_user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        body = json.loads(request.body)
        user_id = body.get('userId') or body.get('user_id')
        new_name = body.get('name') or body.get('newName')
        
        if not user_id or not new_name:
            return JsonResponse({"error": "userId and name are required"}, status=400)
        
        with connection.cursor() as cursor:
            # Verify user belongs to same tenant
            cursor.execute("""
                SELECT id FROM users 
                WHERE id = %s AND tenant_id = %s
            """, [user_id, auth_tenant.id])
            
            if not cursor.fetchone():
                return JsonResponse({"error": "User not found"}, status=404)
            
            # Update or create profile
            cursor.execute("""
                INSERT INTO user_profiles (user_id, name, created_at, updated_at)
                VALUES (%s, %s, NOW(), NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
                RETURNING name
            """, [user_id, new_name])
            
            updated_name = cursor.fetchone()[0]
        
        return JsonResponse({
            "userId": user_id,
            "name": updated_name,
            "success": True
        })
        
    except Exception as e:
        print(f"Error renaming user: {e}")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_avatar(request):
    """POST /api/admin/updateAvatar - Update user avatar/portrait"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    auth_user, auth_tenant = get_authenticated_user(request)
    if not auth_user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        body = json.loads(request.body)
        user_id = body.get('userId') or body.get('user_id')
        avatar_url = body.get('avatarUrl') or body.get('avatar_url') or body.get('portraitImage')
        
        if not user_id or not avatar_url:
            return JsonResponse({"error": "userId and avatarUrl are required"}, status=400)
        
        with connection.cursor() as cursor:
            # Verify user belongs to same tenant
            cursor.execute("""
                SELECT id FROM users 
                WHERE id = %s AND tenant_id = %s
            """, [user_id, auth_tenant.id])
            
            if not cursor.fetchone():
                return JsonResponse({"error": "User not found"}, status=404)
            
            # Update or create profile
            cursor.execute("""
                INSERT INTO user_profiles (user_id, portrait_image, created_at, updated_at)
                VALUES (%s, %s, NOW(), NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET portrait_image = EXCLUDED.portrait_image, updated_at = NOW()
                RETURNING portrait_image
            """, [user_id, avatar_url])
            
            updated_url = cursor.fetchone()[0]
        
        return JsonResponse({
            "userId": user_id,
            "avatarUrl": updated_url,
            "success": True
        })
        
    except Exception as e:
        print(f"Error updating avatar: {e}")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
