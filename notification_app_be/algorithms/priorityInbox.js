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