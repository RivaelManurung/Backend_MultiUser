require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const http = require("http");
const expressListEndpoints = require("express-list-endpoints");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.CLIENT_URL_PROD],
    credentials: true,
  },
});

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);
app.use(express.json());

// Dynamic CORS middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_PROD,
  "http://localhost:3000",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // pastikan lengkap
    allowedHeaders: ["Content-Type", "Authorization"], // pastikan lengkap jika pakai token
  })
);
app.options("*", cors()); // Tangani preflight

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import routes
let authController, registerController, projectRoutes, taskRoutes;
try {
  authController = require("./controllers/authController");
  registerController = require("./controllers/registerController");
  projectRoutes = require("./routes/projects");
  taskRoutes = require("./routes/tasks");
} catch (err) {
  console.error("Error loading routes/controllers:", err);
  process.exit(1);
}

// Define routes
app.post("/api/auth/login", authController.validateLogin, authController.login);
app.post(
  "/api/auth/register",
  registerController.validateRegister,
  registerController.register
);
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);

// Logging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// List endpoints for debugging
console.log("Registered routes:", expressListEndpoints(app));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
