const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const http = require("http");
const expressListEndpoints = require("express-list-endpoints");

const authController = require("./controllers/authController");
const registerController = require("./controllers/registerController");
const projectRoutes = require("./routes/projects"); // Add this

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// Routes
app.post("/api/auth/login", authController.validateLogin, authController.login);
app.post("/api/auth/register", registerController.validateRegister, registerController.register);
app.use("/api", projectRoutes); // Mount project routes

// Socket.io
io.on("connection", (socket) => {
  const { projectId } = socket.handshake.query;
  socket.join(projectId);

  socket.on("taskUpdate", (task) => {
    socket.to(projectId).emit("taskUpdated", task);
  });

  socket.on("taskCreated", (task) => {
    socket.to(projectId).emit("taskCreated", task);
  });
});

// Show routes
console.log(expressListEndpoints(app));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));