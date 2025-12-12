from django.http import JsonResponse
from django.urls import path
from postgrest.exceptions import APIError

from .supabase_client import get_client


def health(request):
    return JsonResponse({"status": "ok"})


def profiles(request, user_id: str):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    supabase = get_client()

    auth_header = request.headers.get("Authorization") or ""
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        if token:
            supabase.postgrest.auth(token)

    try:
        response = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
    except APIError as exc:
        status_code = getattr(exc, "status_code", None)
        if status_code == 401:
            return JsonResponse(
                {"error": "Access denied by RLS policy"},
                status=403,
            )
        if getattr(exc, "code", "") == "PGRST116":
            return JsonResponse({"error": "Profile not found"}, status=404)
        raise

    if not response.data:
        return JsonResponse({"error": "Profile not found"}, status=404)

    return JsonResponse(response.data)


urlpatterns = [
    path("health", health),
    path("profiles/<str:user_id>", profiles),
]
