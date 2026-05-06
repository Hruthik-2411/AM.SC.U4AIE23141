const express = require("express");
const cors = require("cors");

const scheduleRoutes = require("./routes/scheduleRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", scheduleRoutes);

app.get("/", (req, res) => {

    res.send("Vehicle Maintenance Scheduler Running");
});

const PORT = 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});