# Session Persistence Fix - Migration Guide

## Problem Summary

### Issue 1: "Storage API returns 201 status code"
**Status:** ✅ **NOT A BUG** - This is correct behavior!
- HTTP 201 means "Created" and is the proper response for POST requests that create resources
- Your VR app should accept 201 as success (not just 200)

### Issue 2: "Auth token doesn't work after some time"
**Status:** ✅ **FIXED** - Tokens now persist in database
- **Old behavior:** Tokens stored in Python dictionary → lost on server restart
- **New behavior:** Tokens stored in PostgreSQL database with 24-hour expiration

---

## Changes Made

### 1. New Database Model: `Session`
**File:** `backend/api/users/models.py`

Added persistent session storage with:
- Unique token index for fast lookup
- 24-hour expiration (configurable)
- Auto-cleanup of expired sessions
- Support for both admin and regular user sessions

```python
class Session(models.Model):
    token = models.TextField(unique=True, db_index=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    expires_at = models.DateTimeField()
    is_admin = models.BooleanField(default=False)
```

### 2. Updated Authentication Logic
**File:** `backend/api/users/views.py`

- Removed in-memory `SESSION_STORE` dictionary
- All authentication now uses `Session.create_session()` and `Session.get_valid_session()`
- Automatic expiration checking on every request
- Expired sessions are deleted automatically

### 3. Updated Documentation
**File:** `backend/VR_README.md`

- Clarified that 201 is the **correct** success response
- Updated authentication notes (tokens now persist)
- Added troubleshooting section for common issues
- Removed warning about server restarts clearing tokens

---

## Deployment Steps

### Step 1: Apply Database Migration
```bash
cd backend/api
python manage.py migrate users
```

This creates the `sessions` table in your database.

### Step 2: Deploy to Render
```bash
git add .
git commit -m "Fix: Persist auth tokens in database with 24hr expiration"
git push origin main
```

Render will automatically:
1. Run migrations (`python manage.py migrate`)
2. Restart the service with new code

### Step 3: Test Authentication
```bash
# Login (should work as before)
curl -X POST https://neuralport.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"VR-DEVICE-002","username":"1111","password":"1111"}'

# Response: {"token": "...", "user": {...}}

# Test storage with token (should return 201)
curl -X POST https://neuralport.onrender.com/api/storage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"key":"test-123","data":{"score":8.5},"meta":{}}'

# Expected: HTTP 201 Created (this is SUCCESS!)
```

---

## VR App Changes Needed

### Update Success Check
```csharp
// OLD - Only checking for 200
if (response.StatusCode == HttpStatusCode.OK) {
    // Success
}

// NEW - Accept both 200 and 201
if (response.IsSuccessStatusCode) {  // This covers 200-299
    // Success
}
```

### Token Expiration Handling (Optional)
Tokens now last 24 hours, but you can still implement retry logic:

```csharp
public async Task<Response> MakeAuthenticatedRequest(string endpoint, string data) {
    var response = await httpClient.PostAsync(endpoint, data);
    
    if (response.StatusCode == HttpStatusCode.Unauthorized) {
        // Token expired - re-authenticate
        await Login(deviceId, pin);
        // Retry request
        response = await httpClient.PostAsync(endpoint, data);
    }
    
    return response;
}
```

---

## Benefits

✅ **Tokens persist across server restarts**  
✅ **Automatic cleanup of expired sessions**  
✅ **24-hour session duration** (configurable in `Session.create_session()`)  
✅ **Database-backed** (scales better than in-memory)  
✅ **Compatible with existing VR app** (no API changes)

---

## Rollback (If Needed)

If something goes wrong, rollback steps:

```bash
# 1. Revert code changes
git revert HEAD

# 2. Remove migration
cd backend/api
python manage.py migrate users 0003_previous_migration

# 3. Push revert
git push origin main
```

The old in-memory session store will be restored.

---

## Next Steps (Optional Improvements)

1. **Add session cleanup task:**
   - Create Django management command to delete expired sessions
   - Schedule with cron or Celery

2. **Add token refresh endpoint:**
   - Allow extending session without re-entering PIN
   - Useful for long VR sessions

3. **Monitor session usage:**
   - Add logging for session creation/expiration
   - Track active sessions per device

---

## Questions?

Check the logs at: https://dashboard.render.com/web/neuralport

Look for:
- `DEBUG: Valid session found for tenant: VR-DEVICE-002`
- `DEBUG: Session not found or expired for token: ...`

These debug logs will help diagnose any authentication issues.
