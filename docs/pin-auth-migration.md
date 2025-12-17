# Authentication Migration: Email → Device + PIN

## Overview
Authentication has been migrated from email/password to VR PIN-based authentication scoped by `deviceId`. This resolves cross-device PIN collision issues while keeping VR and storage flows intact.

## Backend Changes (Django)

### New Models
- **Tenant**: Represents a VR device identified by `deviceId`
- **User**: Represents a user identified by `(tenant + PIN)` combination

### Authentication Flow
1. Client sends login request:
   ```json
   {
     "deviceId": "<string>",
     "username": "<PIN>",
     "password": "<PIN>"
   }
   ```

2. Backend validates:
   - `username === password` (both should be PIN)
   - Finds or creates tenant by `deviceId`
   - Finds or creates user by `(tenant + PIN)` (lazy creation)

3. Backend returns:
   ```json
   {
     "token": "<session_token>",
     "user": {
       "id": "<uuid>",
       "pin": "<PIN>",
       "device_id": "<deviceId>",
       "tenant_id": "<uuid>",
       "created": true/false
     }
   }
   ```

### New Endpoints
- `POST /auth/login` - Authenticate with deviceId + PIN
- `POST /auth/logout` - Invalidate session token
- `GET /auth/me` - Get current authenticated user

### Files Modified
- `backend/api/users/models.py` - New Tenant and User models
- `backend/api/users/views.py` - Authentication views with session management
- `backend/api/config/settings.py` - Added 'users' app
- `backend/api/config/urls.py` - Added auth endpoints

## Frontend Changes (Vue)

### Auth Store
- Removed Supabase email/password authentication
- Implemented custom token-based authentication
- Tokens stored in localStorage
- New `signIn(deviceId, pin)` method

### Login UI
- Replaced "Email or Username" field with "Device ID" field
- Replaced "Password" field with "PIN" field
- Removed "Remember me" checkbox
- Removed "Forgot Password" link
- Updated form title: "VR Access"
- Updated subtitle: "Authenticate with Device ID and PIN"

### Account View
- Display Device ID (read-only)
- Display User ID (read-only)
- Display PIN (masked, read-only)
- Removed profile update functionality (for now)

### Files Modified
- `vue-app/src/stores/auth.ts` - Complete auth store rewrite
- `vue-app/src/views/LoginView.vue` - Updated login form
- `vue-app/src/views/AccountView.vue` - Updated to show device info
- `vue-app/src/lib/api.ts` - Use localStorage token instead of Supabase

## VR Compatibility
No changes required on VR side. The VR client already sends:
- `deviceId`
- `username` and `password` where both equal the PIN

## Session Management
Current implementation uses in-memory session store for simplicity. For production:
- Replace `SESSION_STORE` dict with Redis
- Add token expiration/refresh
- Consider using Django sessions or JWT

## Next Steps
If you need:
1. JWT integration instead of simple tokens
2. Redis session store
3. Token refresh mechanism
4. User profile management
5. Storage ingestion endpoint integration

Let me know and I can implement those features!
