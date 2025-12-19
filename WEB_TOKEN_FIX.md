# Web App Token Expiration Fix

## Problem
Users were unable to access the dashboard after some time and had to logout/login again.

## Root Cause
The web app stores authentication tokens in `localStorage` but never validates if the token is still valid on the backend. When tokens expired (before: on server restart, now: after 24 hours), the app kept using the old invalid token.

## Solution Implemented

### 1. **Automatic Token Validation** ([router/index.ts](../vue-app/src/router/index.ts))
Added navigation guard that validates token before accessing protected routes:

```typescript
// Before navigating to protected routes
if (to.meta.requiresAuth && authStore.isAuthenticated) {
  const isValid = await authStore.validateToken()
  if (!isValid) {
    return next('/login')  // Redirect to login if expired
  }
}
```

### 2. **Auto-Logout on 401** ([lib/api.ts](../vue-app/src/lib/api.ts))
Created centralized `handleApiResponse()` helper that:
- Detects 401 Unauthorized responses
- Clears expired tokens from localStorage
- Redirects to login page with expiration message
- Applies to ALL API calls automatically

```typescript
async function handleApiResponse(response: Response) {
  if (response.status === 401) {
    console.warn('Token expired, clearing auth state')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/login?expired=true'
    throw new Error('Session expired. Please login again.')
  }
  // ... handle response
}
```

### 3. **Token Validation Method** ([stores/auth.ts](../vue-app/src/stores/auth.ts))
Added `validateToken()` function:
- Calls `/api/auth/me` to check if token is still valid
- Returns true/false instead of throwing errors
- Auto-logs out on 401 errors

### 4. **Expiration Message** ([views/LoginView.vue](../vue-app/src/views/LoginView.vue))
Shows user-friendly message when redirected due to token expiration:
```
"Your session has expired. Please login again."
```

---

## What Changed for Users

### Before Fix:
1. User logs in → navigates to dashboard ✅
2. Token expires (server restart or 24hr expiration) ❌
3. User tries to access data → gets silent failures
4. Dashboard appears but no data loads
5. User manually logs out and back in to fix

### After Fix:
1. User logs in → navigates to dashboard ✅
2. Token expires after 24 hours
3. User tries to access data → auto-redirected to login
4. Shows message: "Your session has expired. Please login again."
5. User logs back in → everything works

---

## Files Modified

1. **[router/index.ts](../vue-app/src/router/index.ts)**
   - Added token validation before route navigation

2. **[stores/auth.ts](../vue-app/src/stores/auth.ts)**
   - Added `validateToken()` method
   - Added auto-logout on 401 in `fetchCurrentUser()`

3. **[lib/api.ts](../vue-app/src/lib/api.ts)**
   - Created `handleApiResponse()` helper
   - Updated ALL API functions to use it (8 functions)

4. **[views/LoginView.vue](../vue-app/src/views/LoginView.vue)**
   - Show expiration message when `?expired=true` in URL

---

## API Functions Updated

All these functions now auto-logout on 401:
- ✅ `fetchProfile()`
- ✅ `insertStorage()`
- ✅ `getStorage()`
- ✅ `listScores()`
- ✅ `getLatestScore()`
- ✅ `getUser()`
- ✅ `getUsersByGroup()`
- ✅ `createUser()`
- ✅ `renameUser()`
- ✅ `updateAvatar()`

---

## Testing

### Test Token Expiration:
1. Login to web app
2. Open DevTools → Application → Local Storage
3. Delete `auth_token` (simulates expiration)
4. Try to navigate to dashboard or view data
5. **Expected:** Auto-redirect to login with message

### Test Normal Flow:
1. Login with valid credentials
2. Navigate to dashboard
3. View user data and scores
4. **Expected:** Everything works normally

---

## Benefits

✅ **No more silent failures** - Users know when session expires  
✅ **Automatic cleanup** - Invalid tokens removed from localStorage  
✅ **Consistent behavior** - All API calls handle 401 the same way  
✅ **User-friendly** - Clear message about why they need to login again  
✅ **No data loss** - Users redirected immediately, not after errors  

---

## Deployment

No backend changes needed for this fix - it's entirely frontend.

```bash
cd vue-app
npm run build
# Deploy to Vercel (automatic on git push)
```

The fix works with both the old in-memory sessions and new database-backed sessions.

---

## Combined with Backend Fix

When combined with the backend session persistence fix:

| Scenario | Old Behavior | New Behavior |
|----------|--------------|--------------|
| Server restart | ❌ Token invalid, silent failure | ✅ Token persists, keeps working |
| 24hr expiration | ❌ Silent failure, broken UI | ✅ Auto-redirect to login with message |
| Network error | ❌ Generic error | ✅ Specific error messages |
| Manual logout | ✅ Works | ✅ Works (+ clears backend session) |

---

## Future Improvements (Optional)

1. **Token Refresh Endpoint:**
   - Add `/api/auth/refresh` to extend session without re-entering PIN
   - Call automatically when token is close to expiring

2. **Session Activity Tracking:**
   - Update `expires_at` on each API call (sliding expiration)
   - Keep active users logged in longer

3. **Remember Me:**
   - Longer token duration for "Remember Me" checkbox
   - 7 days vs 24 hours

4. **Offline Detection:**
   - Don't auto-logout if network is down
   - Retry failed requests when back online
