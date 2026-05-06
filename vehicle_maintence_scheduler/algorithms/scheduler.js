function optimizeTasks(tasks, maxHours) {

    const n = tasks.length;

    const dp = Array.from(
        { length: n + 1 },
        () => Array(maxHours + 1).fill(0)
    );

    for (let i = 1; i <= n; i++) {

        const duration = tasks[i - 1].Duration;
        const impact = tasks[i - 1].Impact;

        for (let h = 0; h <= maxHours; h++) {

            if (duration <= h) {

                dp[i][h] = Math.max(
                    impact + dp[i - 1][h - duration],
                    dp[i - 1][h]
                );

            } else {

                dp[i][h] = dp[i - 1][h];
            }
        }
    }

    let selectedTasks = [];

    let h = maxHours;

    for (let i = n; i > 0; i--) {

        if (dp[i][h] !== dp[i - 1][h]) {

            selectedTasks.push(tasks[i - 1]);

            h -= tasks[i - 1].Duration;
        }
    }

    return {
        maximumImpact: dp[n][maxHours],
        selectedTasks
    };
}

module.exports = optimizeTasks;
