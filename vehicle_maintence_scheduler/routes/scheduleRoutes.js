const express = require("express");

const fetchDepots = require("../services/depotService");
const fetchVehicles = require("../services/vehicleService");

const optimizeTasks = require("../algorithms/scheduler");

const Log = require("../utils/logger");

const router = express.Router();

router.get("/schedule", async (req, res) => {

    try {

        await Log(
            "backend",
            "info",
            "route",
            "Vehicle scheduling started"
        );

        const depots = await fetchDepots();

        const vehicles = await fetchVehicles();

        let results = [];

        for (const depot of depots) {

            const optimized = optimizeTasks(
                vehicles,
                depot.MechanicHours
            );

            results.push({
                depotID: depot.ID,
                mechanicHours: depot.MechanicHours,
                maximumImpact: optimized.maximumImpact,
                selectedTasks: optimized.selectedTasks
            });
        }

        await Log(
            "backend",
            "info",
            "service",
            "Vehicle scheduling completed"
        );

        res.status(200).json(results);

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

module.exports = router;