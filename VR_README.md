# VR Device API Integration

## Base URL
```
https://neuralport.onrender.com
```

## Endpoints

### 1. Authentication
Authenticate VR device and get access token.

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "deviceId": "VR-DEVICE-002",
  "username": "1111",
  "password": "1111"
}
```

**Response:**
```json
{
  "token": "elKFhWHw70SQRcV63CHIgiXSNR5J6d_H0llHs--EkhQ",
  "user": {
    "id": "298",
    "pin": "1111",
    "device_id": "VR-DEVICE-002",
    "tenant_id": "2"
  }
}
```

---

### 2. Upload Session Data
Upload VR session data including eye tracking and stress scores.

**Endpoint:** `POST /api/storage`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TOKEN_FROM_LOGIN>
```

**Request:**
```json
{
  "key": "fd06b6e2-3e6b-436c-ac7f-a93be138da97",
  "data": {
    "deviceId": "16AC60E8D5D7",
    "type": "stress",
    "score": 9.0,
    "userName": "1111",
    "eyeTrackingData": [
      {
        "frameId": 1,
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "time": 1763376768840.9329,
        "leftBlink": false,
        "rightBlink": false,
        "leftPupilMM": 3.2,
        "rightPupilMM": 3.1
      }
    ],
    "timestamp": "2025-12-19T10:00:00Z"
  },
  "meta": {
    "deviceId": "16AC60E8D5D7",
    "type": "stress"
  }
}
```

**Response (HTTP 201 Created):**
```json
{
  "id": 160,
  "key": "fd06b6e2-3e6b-436c-ac7f-a93be138da97",
  "created_at": "2025-12-19T10:00:00Z",
  "score": 9.0
}
```

---

## Important Notes

- **Payload Size:** Supports up to 20MB (handles large eye tracking datasets)
- **CORS:** Enabled for all origins (VR devices don't send browser Origin headers)
- **Session Key:** Use unique UUID for each VR session
- **Authentication:** ✅ Tokens are now **persistent** and stored in database with **24-hour expiration**
- **Score Extraction:** Backend automatically extracts `score` from `data.score` or `data.stress`
- **Success Status:** Storage API returns **201 Created** (not 200) - this is correct!

## Flow

1. VR headset powers on → User enters PIN
2. Call `/api/auth/login` → Receive token
3. VR session runs → Collect eye tracking data
4. Session ends → Call `/api/storage` with full dataset
5. Backend stores data + extracts score for analytics

## Error Codes

- **201 Created:** ✅ Success! Storage record created (this is the correct response)
- **401 Unauthorized:** Invalid/missing token → Re-authenticate via `/api/auth/login`
- **403 Forbidden:** Device not registered
- **400 Bad Request:** Missing required fields
- **413 Payload Too Large:** Exceeds 20MB limit

---

## Troubleshooting

### "Getting 401 errors after some time"
**Problem:** Token expired after 24 hours.

**Solution:**
```javascript
// Detect 401 and re-authenticate automatically
if (response.status === 401) {
  const newToken = await login(deviceId, pin);
  // Retry the request with new token
}
```

**Note:** Tokens now persist across server restarts and last for 24 hours from creation.

### "Is 201 an error?"
**No!** HTTP 201 means "Created" - your data was successfully stored. This is the correct response for POST requests that create resources.
