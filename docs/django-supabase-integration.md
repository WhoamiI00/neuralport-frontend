# Supabase request flow with PostgREST auth

Before any Supabase operation, extract the `Authorization` header from the incoming
request, parse its bearer token, and set it on PostgREST:

By calling `supabase.postgrest.auth(token)` prior to queries, PostgREST receives the
JWT and Row Level Security (RLS) becomes effective for the subsequent database calls.

## Example (GET /profiles/:user_id)

```python
from django.http import JsonResponse
from django.urls import path
from postgrest.exceptions import APIError

from .supabase_client import get_client


def profiles(request, user_id: str):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    auth_header = request.headers.get("Authorization")
    if not auth_header:
      return JsonResponse(
        {"error": "Authorization header required"},
        status=400
      )

    supabase = get_client()

    if auth_header.startswith("Bearer "):
      token = auth_header.split(" ", 1)[1]
        if token:
            supabase.postgrest.auth(token)

    response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )

    return JsonResponse(response.data)

urlpatterns = [
    path("profiles/<str:user_id>", profiles),
]
```
