from django.http import JsonResponse
from django.urls import path
from django.db import connection

from users.views import login, logout, me, get_authenticated_user
from users.storage_api import insert_storage, get_storage, list_scores, latest_score, get_user, get_users_by_group
from users.admin_api import create_user, rename_user, update_avatar


def health(request):
    return JsonResponse({"status": "ok"})


def profiles(request, user_id: int):
    """Get user profile by user ID"""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Authenticate the request
    user, tenant = get_authenticated_user(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    # Users can only access their own profile or profiles within their tenant
    if user.id != user_id:
        # Check if the requested user is in the same tenant
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT tenant_id FROM users WHERE id = %s",
                [user_id]
            )
            row = cursor.fetchone()
            if not row or row[0] != tenant.id:
                return JsonResponse({"error": "Access denied"}, status=403)

    # Fetch user profile
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                u.id,
                u.pin,
                u.tenant_id,
                t.device_id,
                t.name as tenant_name,
                up.name,
                up.uniform_number,
                up.portrait_image,
                up.metadata
            FROM users u
            JOIN tenants t ON u.tenant_id = t.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = %s
        """, [user_id])
        
        row = cursor.fetchone()
        if not row:
            return JsonResponse({"error": "Profile not found"}, status=404)

        profile = {
            "id": row[0],
            "pin": row[1],
            "tenant_id": row[2],
            "device_id": row[3],
            "tenant_name": row[4],
            "name": row[5],
            "uniform_number": row[6],
            "portrait_image": row[7],
            "metadata": row[8] or {}
        }

    return JsonResponse(profile)


urlpatterns = [
    path("health/", health),
    path("api/profiles/<int:user_id>/", profiles),
    # Authentication endpoints
    path("api/auth/login", login, name="login"),
    path("api/auth/logout", logout, name="logout"),
    path("api/auth/me", me, name="me"),
    
    # Storage API (matching old Scala routes)
    path("api/storage", insert_storage, name="insert_storage"),
    path("api/storage/<str:key>", get_storage, name="get_storage"),
    
    # Scores API
    path("api/tenants/<int:tenant_id>/users/<int:user_id>/scores", list_scores, name="list_scores"),
    path("api/tenants/<int:tenant_id>/users/<int:user_id>/latest", latest_score, name="latest_score"),
    
    # Users API
    path("api/users/<int:user_id>", get_user, name="get_user"),
    path("api/group/<int:link_id>", get_users_by_group, name="get_users_by_group"),
    
    # Admin API
    path("api/admin/users", create_user, name="create_user"),
    path("api/admin/rename", rename_user, name="rename_user"),
    path("api/admin/updateAvatar", update_avatar, name="update_avatar"),
]
