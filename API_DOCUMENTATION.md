# NeuralPort API Endpoints

## Base URL
Development: `http://127.0.0.1:8000`

## Authentication

### Login
**POST** `/api/auth/login`

Request:
```json
{
  "username": "VR-DEVICE-001",  // Device ID
  "password": "1111"             // 4-digit PIN
}
```

Response:
```json
{
  "token": "session-token-here",
  "user": {
    "id": 258,
    "pin": "1111",
    "device_id": "VR-DEVICE-001",
    "name": "Shohei Ohtani",
    "uniform_number": "0017"
  }
}
```

### Get Current User
**GET** `/api/auth/me`

Headers: `Authorization: Bearer {token}`

### Logout
**POST** `/api/auth/logout`

Headers: `Authorization: Bearer {token}`

---

## Storage API

### Insert Storage
**POST** `/api/storage`

Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "key": "unique-key-123",
  "data": {
    "docType": "stress",
    "stress": 75,
    "timestamp": "2025-12-17T10:00:00Z"
  },
  "meta": {
    "source": "vr-app"
  }
}
```

Response:
```json
{
  "id": 150,
  "key": "unique-key-123",
  "created_at": "2025-12-17T13:45:00.123Z"
}
```

### Get Storage by Key
**GET** `/api/storage/{key}`

Headers: `Authorization: Bearer {token}`

Response:
```json
{
  "id": 150,
  "key": "unique-key-123",
  "data": { "stress": 75, ... },
  "meta": { "source": "vr-app" },
  "version": 1,
  "created_at": "2025-12-17T13:45:00.123Z",
  "updated_at": "2025-12-17T13:45:00.123Z"
}
```

---

## Scores API

### List User Scores
**GET** `/api/tenants/{tenantId}/users/{userId}/scores`

Headers: `Authorization: Bearer {token}`

Response:
```json
{
  "scores": [
    {
      "id": 190,
      "key": "score-key",
      "score": 75.5,
      "created_at": "2025-12-17T13:45:00.123Z"
    }
  ]
}
```

### Get Latest Score
**GET** `/api/tenants/{tenantId}/users/{userId}/latest`

Headers: `Authorization: Bearer {token}`

Response:
```json
{
  "id": 190,
  "key": "latest-score",
  "score": 88.3,
  "created_at": "2025-12-17T14:30:00.123Z"
}
```

---

## Users API

### Get User Profile
**GET** `/api/users/{userId}`

Headers: `Authorization: Bearer {token}`

Response:
```json
{
  "id": 258,
  "pin": "0017",
  "tenant_id": 1,
  "device_id": "VR-DEVICE-001",
  "name": "Shohei Ohtani",
  "uniform_number": "0017",
  "portrait_image": "https://..."
}
```

### Get User Profile (Alternative)
**GET** `/api/profiles/{userId}/`

Headers: `Authorization: Bearer {token}`

---

## Admin API

### Create User
**POST** `/api/admin/users`

Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "pin": "7777",
  "name": "New User",
  "uniform_number": 777,
  "portrait_image": "https://..."
}
```

Response:
```json
{
  "id": 295,
  "pin": "7777",
  "name": "New User",
  "uniform_number": 777
}
```

### Rename User
**POST** `/api/admin/rename`

Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "userId": 295,
  "name": "Updated Name"
}
```

### Update Avatar
**POST** `/api/admin/updateAvatar`

Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "userId": 295,
  "avatarUrl": "https://example.com/avatar.png"
}
```

---

## Migration Notes

### ✅ Completed
- All 45 users migrated from old database
- 74 storage records with proper ownership
- 79 score records linked to users
- 37 user profiles with names and uniform numbers
- All users consolidated under VR-DEVICE-001
- Only 4-digit PINs allowed

### Authentication Changes
- **Old**: Username + Password → JWT token via `/api/token`
- **New**: Device ID + PIN → Session token via `/api/auth/login`

### Database
- Cleaned up 7 unnecessary tables
- Kept core tables: `tenants`, `users`, `user_profiles`, `storage`, `storage_scores`
- All data under tenant `VR-DEVICE-001` (ID: 1)

### Current Users
39 active users with 4-digit PINs, including:
- PIN 0001 - Jay Adya (11 storage records)
- PIN 0017 - Shohei Ohtani (11 storage records)
- PIN 1111 - test (16 storage records)
- PIN 5678 - (2 storage records)
- And 35 more...
