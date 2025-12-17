# VR Device API Integration Guide

## Overview
This document describes the API endpoints that VR devices use to authenticate and send sensor data to the NeuralPort backend.

**Admin System:** Each VR device has exactly ONE admin per device. The first person to login on a device becomes the admin and sets the admin password.

## Endpoints

### 1. Authentication
VR devices authenticate using their MAC address (deviceId) and user's PIN.

**Endpoint:** `POST /api/auth/login`

#### First User (Admin Setup)
When the first user logs in to a device, they become the admin.

**First Request:**
```json
{
  "deviceId": "VR-DEVICE-002",     // VR device MAC address
  "username": "1111",              // User's PIN
  "password": "1111"               // Must match username
}
```

**Response (200 OK):**
```json
{
  "needsAdminSetup": true,
  "message": "First user must set admin password"
}
```

**Second Request (with admin password):**
```json
{
  "deviceId": "VR-DEVICE-002",
  "username": "1111",
  "password": "1111",
  "adminPassword": "admin123"      // Admin password to set
}
```

**Response (200 OK):**
```json
{
  "token": "elKFhWHw70SQRcV63CHIgiXSNR5J6d_H0llHs--EkhQ",
  "user": {
    "id": "298",
    "pin": "1111",
    "device_id": "VR-DEVICE-002",
    "tenant_id": "2",
    "is_admin": true
  },
  "message": "Admin account created successfully"
}
```

#### Admin Login (Subsequent)
Admin logs in using their admin password as the PIN.

**Request:**
```json
{
  "deviceId": "VR-DEVICE-002",
  "username": "admin123",          // Admin password
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "token": "xyz...",
  "user": {
    "id": "298",
    "pin": "admin123",
    "device_id": "VR-DEVICE-002",
    "tenant_id": "2",
    "is_admin": true
  }
}
```

#### Regular User Login
Regular users just use their PIN.

**Request:**
```json
{
  "deviceId": "VR-DEVICE-002",
  "username": "2222",              // User's PIN
  "password": "2222"
}
```

**Response (200 OK):**
```json
{
  "token": "abc...",
  "user": {
    "id": "299",
    "pin": "2222",
    "device_id": "VR-DEVICE-002",
    "tenant_id": "2",
    "is_admin": false
  }
}
```

**Notes:**
- Only registered devices (in `devices` table) can authenticate
- First user on a device becomes admin automatically
- Admin password is required for first user setup
- Admin uses their password as PIN for subsequent logins
- Regular users use their numeric PIN

### 2. Storage Insertion
VR devices send sensor data, including stress scores and eye tracking telemetry.

**Endpoint:** `POST /api/storage`

**Headers:**
```
Authorization: Bearer <TOKEN_FROM_LOGIN>
```

**Request Body:**
```json
{
  "key": "fd06b6e2-3e6b-436c-ac7f-a93be138da97",  // Unique session ID (UUID)
  "data": {
    "deviceId": "16AC60E8D5D7",
    "type": "stress",
    "score": 9.0,                                  // Stress score (0-10)
    "userName": "6666",
    "blinkCount": 0,
    "pupilDiameter": 0.0,
    "eyeTrackingData": [                           // Array of eye tracking frames
      {
        "frameId": 4,
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "time": 1763376768840.9329,
        "cellID": "None",
        "imagePair": "F",
        "leftBlink": false,
        "rightBlink": false,
        "leftPupilMM": 0.0,
        "rightPupilMM": 0.0
      }
      // ... thousands more frames
    ],
    "uuid": "fd06b6e2-3e6b-436c-ac7f-a93be138da97",
    "timestamp": "2025-11-17T03:52:54.4844689Z"
  },
  "meta": {
    "deviceId": "16AC60E8D5D7",
    "timestamp": "2025-11-17T03:52:54.4844689Z",
    "type": "stress"
  }
}
```

**Response (201 Created):**
```json
{
  "id": 160,
  "key": "79937f4f-7d46-49cd-a51b-a8aed9b05d00",
  "created_at": "2025-12-17T10:49:57.123456+00:00",
  "score": 9.0
}
```

**Notes:**
- The `data` field can contain very large JSON payloads (MB size)
- Eye tracking data arrays can contain thousands of data points
- Score is automatically extracted from `data.stress` or `data.score`
- Score is stored in both `storage` and `storage_scores` tables
- The `key` must be unique per tenant (use UUID for sessions)

## Data Flow

1. **VR Device Powers On** → Displays PIN entry screen
2. **User Enters PIN** → VR sends authentication request
3. **Backend Authenticates** → Creates/retrieves tenant and user, returns token
4. **VR Session Starts** → Device collects sensor data (eye tracking, stress)
5. **Session Ends** → VR sends complete session data to storage endpoint
6. **Backend Processes** → Stores full payload + extracts score for analytics

## Storage Architecture

### Storage Table
- Stores complete VR session data (all sensor readings)
- Uses JSONB for efficient large payload storage
- Indexed by tenant_id and key for fast retrieval

### Storage Scores Table
- Extracted scores for quick analytics queries
- Used by dashboard for charts and statistics
- Links to storage via key (UUID)

## Testing

Test the VR API flow using the provided test script:
```bash
cd C:\Users\ankit\Videos\neuralport
python test_vr_storage.py
```

This simulates:
1. VR device authentication with PIN 6666
2. Storage insertion with real VR payload from test_api.json
3. Score extraction verification

## Large Data Handling

The storage API is designed to handle large VR payloads:
- PostgreSQL JSONB can store up to 1GB per field
- Eye tracking data typically contains 1000-5000 frames per session
- Example test data: ~800KB compressed JSON
- No size limits enforced (database will handle)

## Error Handling

Common errors:
- **401 Unauthorized**: Invalid or missing token
- **403 Forbidden**: Device not registered in `devices` table
- **400 Bad Request**: Missing required fields (deviceId, username, password, key)
- **500 Internal Server Error**: Database constraint violations (duplicate key)

For duplicate key errors, ensure each VR session uses a unique UUID.

## Device Registration

New VR devices must be registered in the `devices` table before they can be used.

### Using Django Management Command

**Register a new device:**
```bash
cd backend/api
python manage.py add_device "VR-DEVICE-003" "Conference Room VR"
```

**List all devices:**
```bash
python manage.py list_devices
```

**Output:**
```
📱 Registered VR Devices:

Device ID: VR-DEVICE-003
Name:      Conference Room VR
Admin:     ❌ Not set
Users:     0
Created:   2025-12-17 11:32
```

### Using SQL (Direct)

```sql
INSERT INTO devices (device_id, name, admin_password, created_at, updated_at)
VALUES ('VR-DEVICE-003', 'Conference Room VR', NULL, NOW(), NOW());
```

**Notes:**
- `admin_password` should be NULL - it will be set by the first user
- `device_id` must be unique (usually the VR headset's MAC address)
- Device registration is a one-time setup per VR headset
