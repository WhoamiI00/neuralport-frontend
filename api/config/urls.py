from django.http import JsonResponse
from django.urls import path
from django.db import connection

from users.views import login, logout, me, get_authenticated_user


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
    path("health", health),
    path("profiles/<int:user_id>", profiles),
    # Authentication endpoints
    path("auth/login", login, name="login"),
    path("auth/logout", logout, name="logout"),
    path("auth/me", me, name="me"),
]
