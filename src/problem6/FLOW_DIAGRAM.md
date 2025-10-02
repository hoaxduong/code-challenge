# Execution Flow Diagrams

## 1. Complete Score Update Flow (with Security)

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API as API Server
    participant Auth as Auth Service
    participant Redis
    participant DB as Database
    participant WS as WebSocket Service
    participant Queue as Message Queue

    Note over User,Queue: 1. Action Initiation Phase
    User->>Client: Initiate Action
    Client->>API: POST /api/v1/actions
    activate API
    API->>Auth: Validate JWT Token
    Auth-->>API: User Authenticated
    API->>Redis: Check Rate Limit
    Redis-->>API: Within Limits
    API->>API: Generate Action Token<br/>(UUID + Signature)
    API->>Redis: Store Token (TTL: 10min)
    API-->>Client: 201 Created<br/>Location: /api/v1/actions/{id}<br/>Action Token + Expected Score
    deactivate API

    Note over User,Queue: 2. Action Completion Phase
    User->>Client: Complete Action
    Client->>Client: Validate Completion

    Note over User,Queue: 3. Score Update Phase
    Client->>API: POST /api/v1/actions/{id}/complete<br/>(with Action Token)
    activate API
    API->>Auth: Validate JWT Token
    Auth-->>API: User Authenticated

    API->>Redis: Check Rate Limit
    alt Rate Limit Exceeded
        Redis-->>API: Limit Exceeded
        API-->>Client: 429 Rate Limit Error
    end

    API->>Redis: Get Action Token
    alt Token Not Found/Expired
        Redis-->>API: Token Invalid
        API-->>Client: 401 Invalid Token
    end

    API->>API: Verify Token Signature
    alt Signature Invalid
        API-->>Client: 401 Invalid Signature
    end

    API->>Redis: Check if Token Consumed
    alt Already Consumed
        Redis-->>API: Token Used
        API-->>Client: 403 Token Already Used
    end

    API->>API: Anti-Cheat Analysis<br/>(Timing, Pattern, Frequency)
    alt Suspicious Activity Detected
        API->>DB: Log Suspicious Event
        API-->>Client: 403 Suspicious Activity
    end

    API->>Redis: Mark Token as Consumed
    API->>DB: Begin Transaction
    API->>DB: Get Current Score (FOR UPDATE)
    DB-->>API: Current Score
    API->>API: Calculate New Score
    API->>DB: Update User Score
    API->>DB: Insert Score Event (Audit Log)
    API->>DB: Commit Transaction

    API->>Queue: Publish Score Update Event
    API->>Redis: Get Current Leaderboard
    Redis-->>API: Top 10 Users
    API->>API: Calculate New Position

    alt User Enters Top 10
        API->>Redis: Invalidate Leaderboard Cache
    end

    API-->>Client: 200 OK<br/>(Score: prev/current, Rank: prev/current, Links)
    deactivate API

    Note over User,Queue: 4. Real-time Broadcast Phase
    Queue->>WS: Score Update Event<br/>(userId, new score, action)
    activate WS

    WS->>Redis: Get Updated Leaderboard
    alt Cache Miss
        WS->>DB: Query Top 10 Users
        DB-->>WS: Top 10 Data
        WS->>Redis: Cache Leaderboard (TTL: 60s)
    else Cache Hit
        Redis-->>WS: Cached Top 10
    end

    WS->>WS: Prepare Broadcast Message<br/>(meta + data + type)
    WS->>Redis: Get All Connected Clients<br/>(from connection pool)
    Redis-->>WS: List of Active Connections

    loop For Each Connected Client
        WS->>Client: WebSocket Push<br/>{meta: {code: 200}, data: [...], type: "leaderboard.update"}
    end

    deactivate WS
    Client->>User: Update UI (Live)
```

## 2. Leaderboard Query Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as API Server
    participant Redis
    participant DB as Database

    Client->>API: GET /api/v1/leaderboard/top
    activate API

    API->>Redis: Get Cached Leaderboard<br/>(key: "leaderboard:top:10")

    alt Cache Hit
        Redis-->>API: Cached Data
        API-->>Client: 200 OK (from cache)
    else Cache Miss
        Redis-->>API: Cache Miss
        API->>DB: SELECT TOP 10 ORDER BY score DESC
        DB-->>API: Top 10 Users
        API->>Redis: Cache Result (TTL: 60s)
        API-->>Client: 200 OK (from DB)
    end

    deactivate API
```

## 3. WebSocket Connection Flow

```mermaid
sequenceDiagram
    participant Client
    participant LB as Load Balancer
    participant WS as WebSocket Server
    participant Auth as Auth Service
    participant Redis
    participant DB as Database

    Client->>LB: wss://api.domain.com/api/v1/ws/leaderboard
    LB->>WS: Route Connection (Sticky Session)
    activate WS

    WS->>Client: Connection Opened

    Client->>WS: Subscribe Message<br/>{type: "subscribe", auth: "Bearer JWT"}

    WS->>Auth: Validate JWT Token
    alt Invalid Token
        Auth-->>WS: Invalid
        WS->>Client: Error Message<br/>{meta: {code: 401}, error: {...}}
        WS->>Client: Close Connection (1008)
    else Valid Token
        Auth-->>WS: Valid User (userId: abc123)
        WS->>Redis: Add Connection to Pool<br/>(user:abc123:connections)

        WS->>Redis: Get Cached Leaderboard
        alt Cache Hit
            Redis-->>WS: Cached Top 10
        else Cache Miss
            WS->>DB: Query Top 10 Users
            DB-->>WS: Top 10 Data
            WS->>Redis: Cache Result (TTL: 60s)
        end

        WS->>Client: Initial State Message<br/>{meta: {code: 200}, data: [...], type: "leaderboard.initial"}

        Note over Client,DB: Connection Active - Client subscribed

        Note over Client,DB: On Disconnect
        Client->>WS: Close Connection
        WS->>Redis: Remove from Connection Pool<br/>(user:abc123:connections)
        deactivate WS
    end
```

## 4. Complete WebSocket Real-time Flow

```mermaid
sequenceDiagram
    participant User1 as User 1
    participant Client1 as Client 1 (Browser)
    participant User2 as User 2
    participant Client2 as Client 2 (Browser)
    participant WS as WebSocket Server
    participant Queue as Message Queue
    participant Redis
    participant DB as Database

    Note over User1,DB: Phase 1: Clients Connect & Subscribe

    Client1->>WS: wss://api.domain.com/api/v1/ws/leaderboard
    activate WS
    WS->>Client1: Connection Opened
    Client1->>WS: {type: "subscribe", auth: "Bearer JWT1"}
    WS->>WS: Validate JWT1
    WS->>Redis: Add Client1 to connection pool
    WS->>Redis: Get leaderboard cache
    Redis-->>WS: Top 10 data
    WS->>Client1: {meta: {code: 200}, type: "leaderboard.initial", data: [...]}
    Client1->>User1: Show leaderboard

    Client2->>WS: wss://api.domain.com/api/v1/ws/leaderboard
    WS->>Client2: Connection Opened
    Client2->>WS: {type: "subscribe", auth: "Bearer JWT2"}
    WS->>WS: Validate JWT2
    WS->>Redis: Add Client2 to connection pool
    WS->>Redis: Get leaderboard cache
    Redis-->>WS: Top 10 data
    WS->>Client2: {meta: {code: 200}, type: "leaderboard.initial", data: [...]}
    Client2->>User2: Show leaderboard

    Note over User1,DB: Phase 2: Score Update Triggers Broadcast

    User1->>Client1: Complete Action
    Client1->>Client1: Score update happens<br/>(via REST API - see diagram 1)

    Queue->>WS: Score Update Event<br/>{userId: "user1", newScore: 500}

    WS->>Redis: Invalidate leaderboard cache
    WS->>DB: Query new Top 10
    DB-->>WS: Updated leaderboard
    WS->>Redis: Cache new leaderboard

    WS->>Redis: Get all connected clients
    Redis-->>WS: [Client1, Client2, ...]

    WS->>WS: Prepare broadcast message<br/>{meta, type, data, changeInfo}

    par Broadcast to All Clients
        WS->>Client1: {meta: {code: 200}, type: "leaderboard.update", data: [...]}
        WS->>Client2: {meta: {code: 200}, type: "leaderboard.update", data: [...]}
    end

    Client1->>User1: Update UI (Live)
    Client2->>User2: Update UI (Live)

    Note over User1,DB: Phase 3: Heartbeat & Connection Maintenance

    loop Every 30 seconds
        WS->>Client1: {type: "ping", timestamp: "..."}
        WS->>Client2: {type: "ping", timestamp: "..."}
        Client1->>WS: {type: "pong", timestamp: "..."}
        Client2->>WS: {type: "pong", timestamp: "..."}
    end

    Note over User1,DB: Phase 4: Client Disconnect

    User2->>Client2: Navigate away
    Client2->>WS: Close connection (1001)
    WS->>Redis: Remove Client2 from pool
    deactivate WS
```

## 5. Anti-Cheat Detection Flow

```mermaid
flowchart TD
    A[Score Update Request] --> B{Valid Action Token?}
    B -->|No| Z[Reject: Invalid Token]
    B -->|Yes| C{Token Consumed?}
    C -->|Yes| Y[Reject: Token Already Used]
    C -->|No| D[Calculate Completion Time]

    D --> E{Completion Time<br/>Too Fast?}
    E -->|Yes| F[Increment Suspicion Score]
    E -->|No| G[Check Action Pattern]

    G --> H{Detect Abnormal<br/>Pattern?}
    H -->|Yes| F
    H -->|No| I[Check Frequency]

    I --> J{Too Many Actions<br/>in Short Time?}
    J -->|Yes| F
    J -->|No| K{Suspicion Score<br/>> Threshold?}

    F --> K

    K -->|Yes| L[Flag User]
    K -->|No| M[Process Score Update]

    L --> N{Suspicion Score<br/>> Critical?}
    N -->|Yes| O[Auto-Suspend Account]
    N -->|No| P[Log for Manual Review]

    O --> X[Reject: Account Suspended]
    P --> M
    M --> Q[Update Score]
    Q --> R[Success Response]

    style Z fill:#f88
    style Y fill:#f88
    style X fill:#f88
    style R fill:#8f8
    style O fill:#fa0
    style L fill:#fa0
```

## 5. System Architecture Overview

```mermaid
graph TB
    subgraph Client Layer
        UA[User Browser/App]
        WC[WebSocket Client]
    end

    subgraph Load Balancing
        LB[Load Balancer]
        WSLB[WebSocket Load Balancer<br/>Sticky Sessions]
    end

    subgraph API Layer
        AS1[API Server 1]
        AS2[API Server 2]
        AS3[API Server N]
    end

    subgraph WebSocket Layer
        WS1[WS Server 1]
        WS2[WS Server 2]
        WS3[WS Server N]
    end

    subgraph Service Layer
        AUTH[Auth Service]
        ANTICHEAT[Anti-Cheat Service]
    end

    subgraph Cache Layer
        RC1[Redis Cluster<br/>- Tokens<br/>- Rate Limits<br/>- Leaderboard Cache]
    end

    subgraph Message Queue
        MQ[Kafka/RabbitMQ<br/>Score Events]
    end

    subgraph Database Layer
        MASTER[(Primary DB<br/>Write)]
        REPLICA1[(Replica 1<br/>Read)]
        REPLICA2[(Replica 2<br/>Read)]
    end

    subgraph Background Workers
        BG1[Leaderboard Refresh Worker]
        BG2[Analytics Worker]
        BG3[Anti-Cheat ML Worker]
    end

    UA -->|HTTPS| LB
    WC -->|WSS| WSLB

    LB --> AS1 & AS2 & AS3
    WSLB --> WS1 & WS2 & WS3

    AS1 & AS2 & AS3 --> AUTH
    AS1 & AS2 & AS3 --> ANTICHEAT
    AS1 & AS2 & AS3 --> RC1
    AS1 & AS2 & AS3 --> MASTER
    AS1 & AS2 & AS3 --> REPLICA1 & REPLICA2
    AS1 & AS2 & AS3 --> MQ

    WS1 & WS2 & WS3 --> AUTH
    WS1 & WS2 & WS3 --> RC1
    WS1 & WS2 & WS3 --> REPLICA1 & REPLICA2

    MQ --> WS1 & WS2 & WS3
    MQ --> BG1 & BG2 & BG3

    BG1 --> RC1
    BG1 --> REPLICA1 & REPLICA2
    BG2 --> REPLICA1 & REPLICA2
    BG3 --> MASTER
    BG3 --> REPLICA1 & REPLICA2

    MASTER -.->|Replication| REPLICA1 & REPLICA2

    style UA fill:#e1f5ff
    style WC fill:#e1f5ff
    style AUTH fill:#ffe1e1
    style ANTICHEAT fill:#ffe1e1
    style RC1 fill:#fff4e1
    style MASTER fill:#e1ffe1
    style REPLICA1 fill:#e1ffe1
    style REPLICA2 fill:#e1ffe1
```

## 6. Token Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> Created: Client Requests Token
    Created --> Active: Token Generated<br/>(Stored in Redis)

    Active --> Consumed: Valid Score Update
    Active --> Expired: TTL Exceeded (10min)
    Active --> Invalid: Validation Failed

    Consumed --> [*]: Removed after 1 hour
    Expired --> [*]: Auto-removed by Redis
    Invalid --> [*]: Logged & Removed

    note right of Active
        - Stored in Redis with TTL
        - Signature verified
        - One-time use only
    end note

    note right of Consumed
        - Marked as used
        - Cannot be reused
        - Kept for audit trail
    end note
```
