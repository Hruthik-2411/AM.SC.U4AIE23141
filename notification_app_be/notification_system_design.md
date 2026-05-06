# Notification System Design

---

# Stage 1

## API Design

I designed simple REST APIs for:
- fetching notifications
- unread notifications
- unread count
- marking notifications as read

### APIs

```http
GET /api/notifications
GET /api/notifications/unread
GET /api/notifications/unread/count
PATCH /api/notifications/:id/read
```

### Example Response

```json
{
  "id": "101",
  "type": "Placement",
  "message": "Amazon hiring drive",
  "isRead": false
}
```

## Real-Time Notifications

For real-time updates, I would use WebSockets instead of repeatedly refreshing the page because it reduces unnecessary API calls and improves user experience.

---

# Stage 2

## Database Design

I would prefer MongoDB because notification systems generate a large amount of data continuously and the schema may change in the future.

### Schema

```json
{
  "studentId": 1042,
  "type": "Placement",
  "message": "Microsoft hiring drive",
  "isRead": false,
  "createdAt": "2026-04-22"
}
```

## Why MongoDB

- Flexible schema
- Easy horizontal scaling
- Better for large notification feeds

As the system grows, indexing and caching will become important for performance.

---

# Stage 3

## Query Optimization

### Given Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

## Why It Becomes Slow

When the table grows to millions of rows, the database may scan too many records before filtering unread notifications.

## Better Solution

I would create a compound index on:

```sql
(studentID, isRead, createdAt)
```

This improves both filtering and sorting performance.

## Query for Placement Notifications in Last 7 Days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL 7 DAY;
```

---

# Stage 4

## Scalability Problem

Fetching notifications directly from the database on every page refresh creates heavy database load.

## Solution

I would use:
- Redis caching
- Pagination
- WebSockets

### Example Pagination

```http
GET /api/notifications?page=1&limit=20
```

## Why Redis

Most students repeatedly request recent notifications. Caching reduces repeated database reads and improves response time.

---

# Stage 5

## Problem in Current Design

The current implementation processes notifications sequentially, which becomes slow for large numbers of students.

If email sending fails midway, some students may never receive notifications.

## Better Approach

I would use:
- message queues
- worker services
- retry mechanisms

### Improved Flow

```text
API Request
    ↓
Queue
    ↓
Workers
```

This improves:
- scalability
- fault tolerance
- processing speed

## Revised Pseudocode

```python
function notify_all(student_ids, message):

    save_notification(message)

    for student_id in student_ids:

        push_to_queue(student_id, message)
```

---

# Stage 6

## Priority Inbox

The system should display important unread notifications first.

Priority order:

```text
Placement > Result > Event
```

Newer notifications should appear first when priorities are equal.

## My Approach

I assigned weights:

| Type | Weight |
|------|---------|
| Placement | 3 |
| Result | 2 |
| Event | 1 |

Notifications are sorted by:
1. Priority
2. Timestamp

---

# priorityInbox.js

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

# notificationService.js

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

# server.js

```js
const express = require("express");

const fetchNotifications = require("./services/notificationService");

const getPriorityNotifications = require("./algorithms/priorityInbox");

const Log = require("../logging_middleware/logger");

const app = express();

app.use(express.json());

app.get("/priority-notifications", async (req, res) => {

    try {

        const notifications = await fetchNotifications();

        const topNotifications =
            getPriorityNotifications(notifications, 10);

        res.status(200).json({
            total: topNotifications.length,
            notifications: topNotifications
        });

    } catch (error) {

        console.log(error);

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

# Final Conclusion

The design focuses on:
- scalability
- clean API structure
- faster notification retrieval
- priority-based notification ordering
- modular backend architecture