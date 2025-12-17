from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import json
import traceback
from datetime import datetime

from .views import get_authenticated_user


@csrf_exempt
def insert_storage(request):
    """POST /api/storage - Insert storage record"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    user, tenant = get_authenticated_user(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        body = json.loads(request.body)
        key = body.get('key')
        data = body.get('data', {})
        meta = body.get('meta', {})
        
        if not key:
            return JsonResponse({"error": "key is required"}, status=400)
        
        with connection.cursor() as cursor:
            # Insert storage record
            cursor.execute("""
                INSERT INTO storage (tenant_id, owner_user_id, key, data, meta, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, key, created_at
            """, [tenant.id, user.id, key, json.dumps(data), json.dumps(meta)])
            
            row = cursor.fetchone()
            
            # If data contains a score, insert into storage_scores
            if 'stress' in data or 'score' in data:
                score_value = data.get('stress') or data.get('score')
                if score_value is not None:
                    cursor.execute("""
                        INSERT INTO storage_scores (tenant_id, owner_user_id, key, score, created_at)
                        VALUES (%s, %s, %s, %s, NOW())
                    """, [tenant.id, user.id, key, float(score_value)])
        
        return JsonResponse({
            "id": row[0],
            "key": row[1],
            "created_at": row[2].isoformat()
        }, status=201)
        
    except Exception as e:
        print(f"Error inserting storage: {e}")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


def get_storage(request, key: str):
    """GET /api/storage/:key - Get storage by key"""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    user, tenant = get_authenticated_user(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, key, data, meta, version, created_at, updated_at
                FROM storage
                WHERE tenant_id = %s AND owner_user_id = %s AND key = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, [tenant.id, user.id, key])
            
            row = cursor.fetchone()
            if not row:
                return JsonResponse({"error": "Storage not found"}, status=404)
            
            return JsonResponse({
                "id": row[0],
                "key": row[1],
                "data": row[2],
                "meta": row[3],
                "version": row[4],
                "created_at": row[5].isoformat(),
                "updated_at": row[6].isoformat()
            })
            
    except Exception as e:
        print(f"Error getting storage: {e}")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


def list_scores(request, tenant_id: int, user_id: int):
    """GET /api/tenants/:tenantId/users/:userId/scores - List all scores"""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    auth_user, auth_tenant = get_authenticated_user(request)
    if not auth_user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    # Check access: must be same tenant
    if auth_tenant.id != tenant_id:
        return JsonResponse({"error": "Access denied"}, status=403)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, key, score, created_at
                FROM storage_scores
                WHERE tenant_id = %s AND owner_user_id = %s
                ORDER BY created_at DESC
            """, [tenant_id, user_id])
            
            scores = []
            for row in cursor.fetchall():
                scores.append({
                    "id": row[0],
                    "key": row[1],
                    "score": float(row[2]),
                    "created_at": row[3].isoformat()
                })
            
            return JsonResponse({"scores": scores})
            
    except Exception as e:
        print(f"Error listing scores: {e}")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


def latest_score(request, tenant_id: int, user_id: int):
    """GET /api/tenants/:tenantId/users/:userId/latest - Get latest score"""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    auth_user, auth_tenant = get_authenticated_user(request)
    if not auth_user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    # Check access
    if auth_tenant.id != tenant_id:
        return JsonResponse({"error": "Access denied"}, status=403)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, key, score, created_at
                FROM storage_scores
                WHERE tenant_id = %s AND owner_user_id = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, [tenant_id, user_id])
            
            row = cursor.fetchone()
            if not row:
                return JsonResponse({"error": "No scores found"}, status=404)
            
            return JsonResponse({
                "id": row[0],
                "key": row[1],
                "score": float(row[2]),
                "created_at": row[3].isoformat()
            })
            
    except Exception as e:
        print(f"Error getting latest score: {e}")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


def get_user(request, user_id: int):
    """GET /api/users/:userId - Get user by ID"""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    auth_user, auth_tenant = get_authenticated_user(request)
    if not auth_user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    u.id,
                    u.pin,
                    u.tenant_id,
                    t.device_id,
                    up.name,
                    up.uniform_number,
                    up.portrait_image
                FROM users u
                JOIN tenants t ON u.tenant_id = t.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.id = %s AND u.tenant_id = %s
            """, [user_id, auth_tenant.id])
            
            row = cursor.fetchone()
            if not row:
                return JsonResponse({"error": "User not found"}, status=404)
            
            return JsonResponse({
                "id": row[0],
                "pin": row[1],
                "tenant_id": row[2],
                "device_id": row[3],
                "name": row[4],
                "uniform_number": row[5],
                "portrait_image": row[6]
            })
            
    except Exception as e:
        print(f"Error getting user: {e}")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


def get_users_by_group(request, link_id: int):
    """GET /api/group/:linkId - Get users by linkedid (group)
    
    Note: In the old schema, users had a 'linkedid' field.
    We'll need to add this to user_profiles or use a different grouping mechanism.
    For now, return empty array or implement based on your grouping needs.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    auth_user, auth_tenant = get_authenticated_user(request)
    if not auth_user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    # TODO: Implement grouping mechanism
    # Old schema had 'linkedid' in users table
    # You may want to add a 'group_id' or 'linked_id' field to user_profiles
    
    return JsonResponse({
        "message": "Group feature not yet implemented",
        "users": []
    }, status=501)
