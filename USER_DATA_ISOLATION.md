# User Data Isolation - How It Works

## Overview
Each user on a VR device (tenant) sees ONLY their own data, identified by their unique PIN.

---

## Login Flow

### Example 1: User with PIN 0001
```
1. User enters: VR-DEVICE-001 + PIN: 0001
2. Backend creates/finds:
   - Tenant (device): VR-DEVICE-001
   - User: tenant_id=1, pin="0001", user_id=123
3. Returns token linked to user_id=123
4. Dashboard loads data for user_id=123 ONLY
```

### Example 2: User with PIN 0002 (same device)
```
1. User enters: VR-DEVICE-001 + PIN: 0002
2. Backend creates/finds:
   - Tenant (device): VR-DEVICE-001 (same tenant)
   - User: tenant_id=1, pin="0002", user_id=456  
3. Returns token linked to user_id=456
4. Dashboard loads data for user_id=456 ONLY
```

### Example 3: Admin Login
```
1. Admin enters: VR-DEVICE-001 + Admin Password
2. Backend finds:
   - Tenant (device): VR-DEVICE-001
   - No user_id (admin has no User record)
3. Returns token with is_admin=true
4. Dashboard loads ALL users on VR-DEVICE-001
```

---

## What Each User Sees

### Regular User (PIN: 0001)
```
Sidebar:
  ✅ Themselves (PIN 0001) - clickable to see details

Dashboard Stats:
  ✅ Total Users: 1 (just themselves)
  ✅ Total Sessions: Their actual session count
  ✅ Avg Response: Their average score
  ✅ Accuracy Rate: Their standard deviation

Chart:
  ✅ Only their own session data
  ✅ Only their stress scores over time
```

### Regular User (PIN: 0002) 
```
Sidebar:
  ✅ Themselves (PIN 0002) - clickable to see details
  ❌ Cannot see PIN 0001's data

Dashboard Stats:
  ✅ Total Users: 1 (just themselves)
  ✅ Their own stats (different from PIN 0001)

Chart:
  ✅ Only THEIR session data
  ❌ PIN 0001's data is NOT visible
```

### Admin
```
Sidebar:
  ✅ All users on the device:
     - PIN 0001
     - PIN 0002
     - PIN 0003
     - etc.
  ✅ Can click any user to see their data
  ✅ Can create new users
  ✅ Can edit user names/avatars

Dashboard Stats:
  ✅ Total Users: Total count (e.g., 3 users)
  ✅ Aggregated stats (N/A until implemented)

Chart:
  ✅ Can view any user's data by selecting them
```

---

## API Behavior

### `/api/auth/login`
```javascript
// Regular user login
POST { deviceId: "VR-DEVICE-001", username: "0001", password: "0001" }
→ Returns token linked to specific user (user_id=123)

// Different user, same device
POST { deviceId: "VR-DEVICE-001", username: "0002", password: "0002" }
→ Returns DIFFERENT token linked to different user (user_id=456)
```

### `/api/group/1` (Get Users)
```javascript
// Regular user (PIN 0001)
GET /api/group/1 with token for user_id=123
→ Returns ONLY user_id=123's data

// Regular user (PIN 0002)
GET /api/group/1 with token for user_id=456
→ Returns ONLY user_id=456's data

// Admin
GET /api/group/1 with admin token
→ Returns ALL users (123, 456, etc.)
```

### `/api/storage` (Session Data)
```javascript
// User with PIN 0001
POST /api/storage with token for user_id=123
→ Stores data linked to user_id=123, tenant_id=1

// User with PIN 0002
POST /api/storage with token for user_id=456
→ Stores data linked to user_id=456, tenant_id=1
→ This data is SEPARATE from PIN 0001's data
```

### `/api/tenants/1/users/123/scores` (Get Scores)
```javascript
// User PIN 0001 (user_id=123)
GET /api/tenants/1/users/123/scores
→ Returns ONLY scores for user_id=123
→ Cannot see user_id=456's scores

// User PIN 0002 (user_id=456)
GET /api/tenants/1/users/456/scores  
→ Returns ONLY scores for user_id=456
→ Cannot see user_id=123's scores
```

---

## Database Isolation

### Users Table
```sql
id  | tenant_id | pin  | created_at
----|-----------|------|------------
123 | 1         | 0001 | 2025-12-19
456 | 1         | 0002 | 2025-12-19
789 | 1         | 0003 | 2025-12-19
```

### Storage Table (Session Data)
```sql
id  | tenant_id | owner_user_id | key                  | data
----|-----------|---------------|----------------------|-------
1   | 1         | 123           | session-uuid-abc     | {...}  ← PIN 0001's data
2   | 1         | 456           | session-uuid-def     | {...}  ← PIN 0002's data
3   | 1         | 123           | session-uuid-ghi     | {...}  ← PIN 0001's data
```

**Query for PIN 0001:**
```sql
SELECT * FROM storage 
WHERE tenant_id = 1 AND owner_user_id = 123
-- Returns rows 1 and 3 ONLY
```

**Query for PIN 0002:**
```sql
SELECT * FROM storage 
WHERE tenant_id = 1 AND owner_user_id = 456
-- Returns row 2 ONLY
```

---

## Security

✅ **Token-Based:** Each user gets their own unique token  
✅ **User ID Enforcement:** All queries filter by `owner_user_id`  
✅ **Tenant Isolation:** Users can only see data from their own device (tenant)  
✅ **Admin Separation:** Admin accounts have no `user_id`, preventing data mixing  
✅ **No Cross-User Access:** User 123 cannot query data for user 456  

---

## Testing

### Test 1: Create Multiple Users on Same Device
```bash
# Create User 1
curl -X POST https://neuralport.onrender.com/api/auth/login \
  -d '{"deviceId":"VR-DEVICE-001","username":"0001","password":"0001"}'
# → Get token1

# Create User 2  
curl -X POST https://neuralport.onrender.com/api/auth/login \
  -d '{"deviceId":"VR-DEVICE-001","username":"0002","password":"0002"}'
# → Get token2 (different from token1)
```

### Test 2: Upload Data for Each User
```bash
# User 1 uploads session data
curl -X POST https://neuralport.onrender.com/api/storage \
  -H "Authorization: Bearer <token1>" \
  -d '{"key":"session1","data":{"score":8.5},"meta":{}}'
# → Stored with owner_user_id=123

# User 2 uploads session data
curl -X POST https://neuralport.onrender.com/api/storage \
  -H "Authorization: Bearer <token2>" \
  -d '{"key":"session2","data":{"score":6.2},"meta":{}}'
# → Stored with owner_user_id=456
```

### Test 3: Verify Data Isolation
```bash
# User 1 tries to get their data
curl -H "Authorization: Bearer <token1>" \
  https://neuralport.onrender.com/api/group/1
# → Returns ONLY user 123's info

# User 2 tries to get their data
curl -H "Authorization: Bearer <token2>" \
  https://neuralport.onrender.com/api/group/1
# → Returns ONLY user 456's info (different from above)
```

---

## Summary

✅ **Login with PIN 0001** → See ONLY PIN 0001's data  
✅ **Login with PIN 0002** → See ONLY PIN 0002's data  
✅ **Multiple users can exist on same device** → Each has isolated data  
✅ **Admin sees all users** → Can manage and view everyone's data  
✅ **Data cannot leak between users** → Enforced at API level  
