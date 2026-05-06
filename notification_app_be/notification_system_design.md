# Notification System Design

---

# Stage 1

## Problem Understanding

The frontend team requires a clean REST API structure to display notifications for students. The platform supports multiple notification types such as placements, events, and results. The APIs should support notification retrieval, unread counts, and read-status updates.

Instead of designing very generic APIs, I focused mainly on the actions the frontend will repeatedly need during page loads and notification interactions.

---

## API Design Approach

I designed the APIs using simple REST conventions with predictable routes and structured JSON responses.

The system supports:

- Fetching all notifications
- Fetching unread notifications
- Marking notifications as read
- Fetching unread notification count

I kept the APIs lightweight because notification systems usually experience very high read traffic.

---

# API Endpoints

---

## 1. Get All Notifications

### Endpoint

```http
GET /api/notifications
```

### Response

```json
{
  "notifications": [
    {
      "id": "101",
      "type": "Placement",
      "message": "Microsoft hiring drive announced",
      "isRead": false,
      "createdAt": "2026-04-22T17:40:00Z"
    }
  ]
}
```

---

## 2. Get Unread Notifications

### Endpoint

```http
GET /api/notifications/unread
```

### Response

```json
{
  "notifications": [
    {
      "id": "102",
      "type": "Result",
      "message": "Mid sem results published",
      "isRead": false
    }
  ]
}
```

---

## 3. Mark Notification as Read

### Endpoint

```http
PATCH /api/notifications/:id/read
```

### Response

```json
{
  "message": "Notification marked as read"
}
```

---

## 4. Get Unread Notification Count

### Endpoint

```http
GET /api/notifications/unread/count
```

### Response

```json
{
  "count": 12
}
```

---

## Real-Time Notification Strategy

For real-time updates, I would prefer WebSockets instead of repeatedly polling the server because continuous polling increases unnecessary database and network load.

Using WebSockets allows the backend to push notifications instantly whenever a new notification is created.

---

## Why I Chose This Design

I kept the APIs simple because notification systems are usually frontend-heavy systems where:
- Reads happen much more frequently than writes
- Low latency is important
- The frontend requires fast unread counts and quick updates

The APIs are also easy to scale later using caching layers.

---

# Stage 2

## Database Design

For storing notifications, I would prefer MongoDB instead of a relational database.

The main reason is that notification systems generate a very large amount of data continuously, and notification structures may evolve over time.

Different notification types may later contain:
- links
- metadata
- attachments
- company details
- event details

A document database provides flexibility without frequent schema migrations.

---

# Notification Schema

```json
{
  "_id": "ObjectId",
  "studentId": 1042,
  "type": "Placement",
  "message": "Amazon hiring drive announced",
  "isRead": false,
  "createdAt": "2026-04-22T17:40:00Z"
}
```

---

## Why MongoDB Fits Well

I chose MongoDB mainly because:

- Notifications are append-heavy
- The schema is relatively flexible
- Horizontal scaling is easier
- Reads are usually based on studentId

The system mainly performs:
- inserts
- unread filtering
- sorting by timestamp

which MongoDB handles efficiently with proper indexing.

---

## SQL vs NoSQL

I would still consider SQL if:
- strong transactional consistency becomes critical
- notification relationships become more complex

However, for high-volume notification feeds, MongoDB provides better flexibility and scalability.

---

## Potential Scaling Problems

As the system grows:
- unread queries may become slow
- sorting millions of notifications can become expensive
- repeated page refreshes may overload the database

To solve this later:
- indexing
- caching
- pagination
- queue-based processing

would become important.

---

# Stage 3

## Query Analysis

Given query:

```sql
SELECT * FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

---

## Is This Query Correct?

Yes, logically the query is correct because it fetches unread notifications for a particular student and sorts them by latest notifications first.

However, this query becomes slow when the notification table grows to millions of rows.

---

## Why This Query Becomes Slow

The major issue is that the database may scan a huge number of rows before filtering the required student notifications.

The sorting operation on `createdAt` also becomes expensive without proper indexing.

As notification volume increases, full table scans become very inefficient.

---

## Better Indexing Strategy

Instead of creating indexes on every column, I would create a compound index:

```sql
(studentID, isRead, createdAt)
```

This helps because:
- filtering happens on studentID
- unread filtering happens on isRead
- sorting happens on createdAt

A compound index improves both filtering and sorting performance together.

---

## Why Indexing Every Column Is Not Good

Adding indexes on every column increases:
- storage usage
- insert overhead
- update overhead

Since notifications are inserted very frequently, excessive indexing can slow down writes significantly.

So indexes should only be added for high-frequency query patterns.

---

## Query for Placement Notifications in Last 7 Days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL 7 DAY;
```

---

## Computational Cost

Without indexing:
- Time complexity increases significantly because of scans and sorting.

With proper compound indexing:
- query execution becomes much faster because only matching records are scanned.

---

# Stage 4

## Problem Understanding

Currently, notifications are fetched from the database on every page load for every student.

This creates heavy repeated read traffic on the database.

During placement season or result announcements, thousands of students may refresh simultaneously, causing database overload.

---

## My Approach

Instead of directly hitting the database every time, I would introduce Redis caching.

The flow becomes:

```text
Student Request
      ↓
Redis Cache
      ↓
Database (only if cache miss occurs)
```

---

## Why Redis Helps

Most students repeatedly request recent unread notifications.

Caching unread notifications temporarily reduces:
- repeated database reads
- sorting operations
- query execution load

This significantly improves response time.

---

## Additional Optimizations

I would also implement:

### Pagination

Instead of loading hundreds of notifications together:

```http
GET /api/notifications?page=1&limit=20
```

This reduces payload size and DB load.

---

### WebSockets

Instead of refreshing the entire page repeatedly, new notifications can be pushed instantly.

This reduces unnecessary API calls.

---

### Lazy Loading

Older notifications should load only when the student scrolls further down.

---

## Tradeoff

Caching introduces cache invalidation complexity because updates must sync properly between Redis and the database.

However, the performance gain is worth it for large-scale notification systems.

---

# Stage 5

## Problem in Current Implementation

The provided pseudocode processes notifications sequentially:

```python
for student in students:
    send_email()
    save_to_db()
```

This causes several problems:
- slow execution
- poor scalability
- one failure may interrupt remaining processing
- email API latency affects the whole system

If email sending fails midway, the system enters a partially completed state.

---

## My Approach

I would redesign the system using:
- message queues
- worker services
- retry mechanisms

---

## Improved Architecture

```text
Notification Request
        ↓
Message Queue
        ↓
Worker Services
   ↙           ↘
Email Worker   In-App Worker
```

---

## Why Queues Improve Reliability

Queues decouple notification generation from notification delivery.

This means:
- the API responds quickly
- failures can be retried
- workers can scale independently
- email delays do not block database operations

---

## Revised Pseudocode

```python
function notify_all(student_ids, message):

    notification_id = save_notification(message)

    for student_id in student_ids:

        push_to_queue({
            student_id,
            notification_id,
            type: "EMAIL"
        })

        push_to_queue({
            student_id,
            notification_id,
            type: "IN_APP"
        })
```

---

## Why Save to DB First

I would save notification metadata first because:
- delivery systems may fail temporarily
- retries become easier
- notification state tracking becomes possible

---

## Retry Strategy

Failed jobs should:
- retry automatically
- move to dead-letter queues after repeated failures

This prevents permanent notification loss.

---

# Stage 6

## Problem Understanding

The system now requires a Priority Inbox feature where the top important unread notifications appear first.

Priority order:

```text
Placement > Result > Event
```

Newer notifications should also appear before older ones when priorities are equal.

Notifications must be fetched from the provided API instead of hardcoding them.

---

## My Approach

I solved this problem using:
- priority mapping
- sorting by priority
- sorting by timestamp

I assigned weights:

| Type | Weight |
|------|---------|
| Placement | 3 |
| Result | 2 |
| Event | 1 |

The notifications are sorted using:
1. Higher priority first
2. More recent timestamp first

---

## Why I Chose Sorting

For the current scale, sorting is simple and maintainable.

For extremely large real-time systems, I would later consider:
- heaps
- priority queues
- streaming systems

but sorting is sufficient for this implementation.

---

# Stage 6 Code

## priorityInbox.js

```js
function getPriorityNotifications(notifications, topN = 10) {

    const priorityMap = {
        Placement: 3,
        Result: 2,
        Event: 1
    };

    notifications.sort((a, b) => {

        const priorityDifference =
            priorityMap[b.Type] - priorityMap[a.Type];

        if (priorityDifference !== 0) {

            return priorityDifference;
        }

        return (
            new Date(b.Timestamp) -
            new Date(a.Timestamp)
        );
    });

    return notifications.slice(0, topN);
}

module.exports = getPriorityNotifications;
```

---

## notificationService.js

```js
const axios = require("axios");

const getAccessToken = require("./authService");

async function fetchNotifications() {

    try {

        const token = await getAccessToken();

        const response = await axios.get(
            "http://20.207.122.201/evaluation-service/notifications",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data.notifications;

    } catch (error) {

        console.log(error.response?.data || error.message);
    }
}

module.exports = fetchNotifications;
```

---

## server.js

```js
const express = require("express");

const fetchNotifications = require("./services/notificationService");

const getPriorityNotifications = require("./algorithms/priorityInbox");

const Log = require("../logging_middleware/logger");

const app = express();

app.use(express.json());

app.get("/priority-notifications", async (req, res) => {

    try {

        await Log(
            "backend",
            "info",
            "route",
            "Fetching priority notifications"
        );

        const notifications = await fetchNotifications();

        const topNotifications =
            getPriorityNotifications(notifications, 10);

        await Log(
            "backend",
            "info",
            "service",
            "Priority notifications generated"
        );

        res.status(200).json({
            total: topNotifications.length,
            notifications: topNotifications
        });

    } catch (error) {

        console.log(error);

        await Log(
            "backend",
            "error",
            "handler",
            error.message
        );

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});
```

---

## Final Thoughts

The overall design focuses on:
- scalability
- clean API design
- reduced database load
- fault tolerance
- maintainability

I intentionally kept the architecture modular so that future improvements like Kafka, Redis, WebSockets, or distributed workers can be integrated without major redesign.