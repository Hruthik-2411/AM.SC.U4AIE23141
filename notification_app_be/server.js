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