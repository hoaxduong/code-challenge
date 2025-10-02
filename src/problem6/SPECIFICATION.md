# Score Management API Specification

## 1. Overview

This module provides secure score management with real-time leaderboard updates. It prevents unauthorized score manipulation through action verification and implements live updates via WebSocket connections.

### 1.1 RESTful Design Principles

This API follows RESTful best practices:

**Resource-Based URLs:**
- Resources are nouns (users, actions, leaderboard)
- URLs represent resource hierarchy: `/api/v1/users/{userId}/score`
- No verbs in URLs - actions are expressed through HTTP methods

**Proper HTTP Methods:**
- `GET` - Retrieve resources (idempotent, cacheable)
- `POST` - Create new resources or trigger actions
- `PUT` - Update entire resources (not used for partial updates)
- `PATCH` - Partial resource updates (if needed)
- `DELETE` - Remove resources (if needed)

**Appropriate HTTP Status Codes:**
- `200 OK` - Successful GET/POST/PATCH
- `201 Created` - Resource successfully created (with Location header)
- `204 No Content` - Successful DELETE
- `304 Not Modified` - Resource hasn't changed (ETag validation)
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server-side error

**HATEOAS (Hypermedia as the Engine of Application State):**
- Responses include `links` object with related resources
- Clients can navigate the API through hyperlinks
- Reduces client-side coupling to URL structures

**Statelessness:**
- Each request contains all necessary information (JWT token)
- No server-side session state
- Enables horizontal scaling

**Caching:**
- Appropriate `Cache-Control`, `ETag`, and `Last-Modified` headers
- `304 Not Modified` responses for unchanged resources
- Public caching for leaderboard data

**Versioning:**
- API version in URL path: `/api/v1/`
- Allows backward compatibility and gradual migration

**Pagination & Filtering:**
- Query parameters for pagination: `limit`, `offset`, `page`
- Pagination metadata in responses
- Links to first, next, previous, last pages

**Consistent Error Format:**
- Standardized error response structure
- Error codes for programmatic handling
- Human-readable messages
- Timestamps for debugging

## 2. RESTful API Endpoints

### 2.1 Users Resource

#### Get Current User's Score
**Endpoint:** `GET /api/v1/users/me/score`

**Purpose:** Retrieve authenticated user's current score.

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Accept: application/json
```

**Response (200 OK):**
```json
{
  "id": "string (user_id)",
  "score": "number",
  "rank": "number",
  "totalActions": "number",
  "lastUpdated": "ISO8601 timestamp",
  "links": {
    "self": "/api/v1/users/me/score",
    "leaderboard": "/api/v1/leaderboard"
  }
}
```

#### Get Specific User's Score
**Endpoint:** `GET /api/v1/users/{userId}/score`

**Purpose:** Retrieve any user's public score data.

**Response (200 OK):**
```json
{
  "id": "string (user_id)",
  "username": "string",
  "score": "number",
  "rank": "number",
  "lastUpdated": "ISO8601 timestamp",
  "links": {
    "self": "/api/v1/users/{userId}/score",
    "user": "/api/v1/users/{userId}"
  }
}
```

### 2.2 Actions Resource

#### Create Action Token
**Endpoint:** `POST /api/v1/actions`

**Purpose:** Create a new action token for authorized score increment.

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "string (action type identifier)",
  "metadata": {
    "sessionId": "string",
    "clientFingerprint": "string"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "string (action_id UUID)",
  "token": "string (signed JWT token)",
  "type": "string",
  "expiresAt": "ISO8601 timestamp",
  "expectedScoreIncrement": "number",
  "links": {
    "self": "/api/v1/actions/{actionId}",
    "complete": "/api/v1/actions/{actionId}/complete"
  }
}
```

**Response Headers:**
```
Location: /api/v1/actions/{actionId}
```

#### Complete Action (Update Score)
**Endpoint:** `POST /api/v1/actions/{actionId}/complete`

**Purpose:** Complete an action and increment user score.

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "string (action token from creation)",
  "completedAt": "ISO8601 timestamp",
  "metadata": {
    "sessionId": "string",
    "clientFingerprint": "string"
  }
}
```

**Response (200 OK):**
```json
{
  "actionId": "string",
  "userId": "string",
  "score": {
    "previous": "number",
    "current": "number",
    "increment": "number"
  },
  "rank": {
    "previous": "number",
    "current": "number"
  },
  "completedAt": "ISO8601 timestamp",
  "links": {
    "self": "/api/v1/actions/{actionId}",
    "userScore": "/api/v1/users/me/score",
    "leaderboard": "/api/v1/leaderboard"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": {
    "code": "INVALID_ACTION",
    "message": "Action type not recognized",
    "details": "string",
    "timestamp": "ISO8601 timestamp"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Action token is invalid or expired",
    "timestamp": "ISO8601 timestamp"
  }
}
```

**Response (403 Forbidden):**
```json
{
  "error": {
    "code": "TOKEN_ALREADY_USED",
    "message": "This action has already been completed",
    "timestamp": "ISO8601 timestamp"
  }
}
```

**Response (429 Too Many Requests):**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many actions. Please try again later.",
    "retryAfter": "number (seconds)",
    "timestamp": "ISO8601 timestamp"
  }
}
```

**Response Headers (Rate Limiting):**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000000
Retry-After: 60
```

#### Get Action Details
**Endpoint:** `GET /api/v1/actions/{actionId}`

**Purpose:** Retrieve action status and details.

**Response (200 OK):**
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "status": "pending|completed|expired",
  "createdAt": "ISO8601 timestamp",
  "expiresAt": "ISO8601 timestamp",
  "completedAt": "ISO8601 timestamp (if completed)",
  "scoreIncrement": "number (if completed)",
  "links": {
    "self": "/api/v1/actions/{actionId}",
    "user": "/api/v1/users/{userId}"
  }
}
```

### 2.3 Leaderboard Resource

#### Get Leaderboard
**Endpoint:** `GET /api/v1/leaderboard`

**Purpose:** Retrieve ranked list of top users.

**Query Parameters:**
- `limit`: number (default: 10, max: 100) - Number of users to return
- `offset`: number (default: 0) - Pagination offset
- `page`: number (alternative to offset) - Page number (1-based)

**Request Headers:**
```
Accept: application/json
If-None-Match: "etag-value" (optional, for caching)
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "rank": "number",
      "userId": "string",
      "username": "string",
      "score": "number",
      "lastUpdated": "ISO8601 timestamp",
      "links": {
        "user": "/api/v1/users/{userId}",
        "score": "/api/v1/users/{userId}/score"
      }
    }
  ],
  "pagination": {
    "limit": "number",
    "offset": "number",
    "total": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  },
  "links": {
    "self": "/api/v1/leaderboard?limit=10&offset=0",
    "first": "/api/v1/leaderboard?limit=10&offset=0",
    "next": "/api/v1/leaderboard?limit=10&offset=10",
    "prev": null
  },
  "meta": {
    "lastRefresh": "ISO8601 timestamp",
    "cacheAge": "number (seconds)"
  }
}
```

**Response (304 Not Modified):**
- Returns when ETag matches (no body)

**Response Headers:**
```
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Cache-Control: public, max-age=60
Last-Modified: Wed, 21 Oct 2025 07:28:00 GMT
```

#### Get User's Rank
**Endpoint:** `GET /api/v1/leaderboard/users/{userId}`

**Purpose:** Get specific user's leaderboard position with surrounding context.

**Response (200 OK):**
```json
{
  "user": {
    "rank": "number",
    "userId": "string",
    "username": "string",
    "score": "number"
  },
  "context": {
    "above": [
      {
        "rank": "number",
        "userId": "string",
        "username": "string",
        "score": "number"
      }
    ],
    "below": [
      {
        "rank": "number",
        "userId": "string",
        "username": "string",
        "score": "number"
      }
    ]
  },
  "links": {
    "self": "/api/v1/leaderboard/users/{userId}",
    "userScore": "/api/v1/users/{userId}/score",
    "fullLeaderboard": "/api/v1/leaderboard"
  }
}
```

### 2.3 WebSocket Real-time Updates

**Endpoint:** `ws://api.domain.com/ws/leaderboard`

**Purpose:** Push real-time leaderboard updates to connected clients.

**Connection Handshake:**
```json
{
  "type": "subscribe",
  "channel": "leaderboard.top10",
  "auth": "Bearer <JWT_TOKEN>"
}
```

**Server Push Message:**
```json
{
  "type": "leaderboard.update",
  "timestamp": "ISO8601 timestamp",
  "data": {
    "leaderboard": [...],
    "changeType": "score_update|new_entry|rank_change"
  }
}
```

## 3. Security Mechanisms

### 3.1 Action Token System

**Purpose:** Prevent replay attacks and unauthorized score updates.

**Token Generation Flow:**

1. When user initiates an action, client requests an action token
2. Server generates signed token with:
   - Action ID (UUID)
   - User ID
   - Action type
   - Expiration time (5-10 minutes)
   - Difficulty/expected completion time
   - HMAC signature
3. Client completes action with this token
4. Server validates token on score update

**Token Structure:**

```
actionToken = base64(
  actionId + userId + actionType + expiresAt + expectedScore
) + "." + HMAC-SHA256(tokenData, SECRET_KEY)
```

### 3.2 Rate Limiting

**Per-User Limits:**

- Actions per minute: 10
- Actions per hour: 100
- Score updates per day: 500

**Implementation:** Token bucket algorithm with Redis backend

**Response Headers:**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640000000
```

### 3.3 Anti-Cheat Measures

1. **Action Timing Analysis**
   - Track completion time vs expected time
   - Flag suspiciously fast completions
   - Implement cooldown periods

2. **Pattern Detection**
   - Monitor score update patterns
   - Detect abnormal behavior (too consistent timing, high frequency)
   - Implement ML-based anomaly detection

3. **Session Validation**
   - Verify session integrity
   - Check client fingerprint consistency
   - Validate request origin

4. **Token Expiration**
   - Action tokens expire after 10 minutes
   - One-time use only (mark as consumed)
   - Store consumed tokens in Redis with TTL

### 3.4 Authentication & Authorization

**Authentication:** JWT-based with refresh tokens

**Authorization Checks:**
- Valid user session
- User account in good standing (not banned/suspended)
- Action token belongs to requesting user
- Action token not expired or consumed

## 4. Data Models

### 4.1 User Score

```typescript
interface UserScore {
  userId: string;
  username: string;
  score: number;
  lastUpdated: Date;
  totalActions: number;
  suspicionScore: number; // 0-100, for anti-cheat
}
```

### 4.2 Action Token

```typescript
interface ActionToken {
  actionId: string;
  userId: string;
  actionType: string;
  createdAt: Date;
  expiresAt: Date;
  consumed: boolean;
  consumedAt?: Date;
  expectedScoreIncrement: number;
  signature: string;
}
```

### 4.3 Score Update Event

```typescript
interface ScoreUpdateEvent {
  eventId: string;
  userId: string;
  actionId: string;
  previousScore: number;
  newScore: number;
  increment: number;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  validated: boolean;
}
```

## 5. Database Design

### 5.1 Tables

**users_scores**
- PRIMARY KEY: user_id
- Indexed: score (DESC), last_updated
- Partitioned by score range for efficient leaderboard queries

**action_tokens** (Redis for performance)
- KEY: action_id
- TTL: token expiration time
- Stores: serialized token data

**score_events** (append-only log)
- PRIMARY KEY: event_id
- Indexed: user_id, timestamp
- Used for audit trail and anti-cheat analysis

**leaderboard_cache** (Redis)
- KEY: "leaderboard:top:10"
- TTL: 60 seconds
- Stores: serialized top 10 users

### 5.2 Caching Strategy

1. **Read-through cache** for leaderboard (Redis)
2. **Write-through update** on score changes
3. **Cache invalidation** on top 10 changes
4. **Background refresh** every 60 seconds

## 6. Performance Requirements

- Score update API: < 100ms p95
- Leaderboard query: < 50ms p95
- WebSocket message latency: < 200ms
- Support: 10,000+ concurrent WebSocket connections
- Throughput: 1,000+ score updates per second

## 7. Error Handling

### 7.1 Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| INVALID_TOKEN | 401 | Action token is invalid or malformed |
| EXPIRED_TOKEN | 401 | Action token has expired |
| CONSUMED_TOKEN | 403 | Action token already used |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| SUSPICIOUS_ACTIVITY | 403 | Anti-cheat system flagged user |
| INVALID_ACTION | 400 | Action type not recognized |
| USER_SUSPENDED | 403 | User account suspended |
| SERVER_ERROR | 500 | Internal server error |

### 7.2 Retry Policy

- Client should retry on 5xx errors with exponential backoff
- Do not retry on 4xx errors (except 429)
- Maximum 3 retry attempts

## 8. Monitoring & Observability

### 8.1 Metrics

- Score update request rate
- Action token generation rate
- Token validation failure rate
- WebSocket connection count
- Leaderboard cache hit rate
- Suspicious activity detection rate
- API latency percentiles (p50, p95, p99)

### 8.2 Alerts

- Spike in token validation failures
- Unusual score update patterns
- High rate of suspicious activity flags
- WebSocket connection issues
- Database query performance degradation

### 8.3 Logging

- All score updates (with user ID, action ID, IP)
- Token generation and validation events
- Anti-cheat triggers
- Security events (failed auth, suspicious patterns)

## 9. Scalability Considerations

1. **Horizontal Scaling**
   - Stateless API servers behind load balancer
   - Sticky sessions for WebSocket connections
   - Redis Cluster for distributed caching

2. **Database Sharding**
   - Shard users_scores by user_id
   - Separate read replicas for leaderboard queries

3. **Message Queue**
   - Async processing of score events
   - Kafka/RabbitMQ for event streaming
   - Decouple score update from leaderboard refresh

4. **CDN & Edge Computing**
   - Cache leaderboard data at edge
   - Reduce latency for global users

## 10. Testing Strategy

### 10.1 Unit Tests
- Token generation and validation
- Score calculation logic
- Rate limiting enforcement
- Anti-cheat algorithms

### 10.2 Integration Tests
- End-to-end score update flow
- WebSocket connection and updates
- Token lifecycle (create → consume → expire)
- Database consistency

### 10.3 Security Tests
- Penetration testing for token forgery
- Replay attack simulation
- Rate limiting bypass attempts
- SQL injection and XSS testing

### 10.4 Load Tests
- 1000+ concurrent score updates
- 10,000+ WebSocket connections
- Leaderboard query under load
- Redis cache performance

## 11. Deployment Considerations

- Blue-green deployment for zero downtime
- Database migrations with backward compatibility
- Feature flags for gradual rollout
- Rollback plan for emergency scenarios
- Health check endpoints for load balancer
