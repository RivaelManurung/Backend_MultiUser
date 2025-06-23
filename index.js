const express = require("express");
const cors = require("cors");
const registerRoute = require("./routes/register.js");
const authRoute = require("./routes/auth.js");
const projectsRoute = require("./routes/projects.js");
const tasksRoute = require("./routes/tasks.js");

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" })); // Adjust for deployment

app.use("/api/register", registerRoute);
app.use("/api/auth", authRoute);
app.use("/api/projects", projectsRoute);
app.use("/api/tasks", tasksRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));