const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const http = require("http");
const expressListEndpoints = require("express-list-endpoints");

const app = express();
const server = http.createServer(app);

// Allowed origins → Tambahkan URL Vercel
const allowedOrigins = [
  "http://localhost:3000", // local dev Next.js
  "https://frontend-multi-user.vercel.app" // production Vercel
];

const io = new Server(server, {
  cors: { origin: allowedOrigins },
});

// Perbaikan CORS di Express → pakai array allowedOrigins
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true, // jika pakai cookies/token
}));

app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// Middleware to attach io to req for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
let authController, registerController, projectRoutes, taskRoutes;
try {
  authController = require("./controllers/authController");
  registerController = require("./controllers/registerController");
  projectRoutes = require("./routes/projects");
  taskRoutes = require("./routes/tasks");
} catch (error) {
  console.error("Error loading controllers/routes:", error);
  process.exit(1);
}

app.post("/api/auth/login", authController.validateLogin, authController.login);
app.post("/api/auth/register", registerController.validateRegister, registerController.register);
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);

// Debug logging for all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Show routes
console.log("Registered routes:", expressListEndpoints(app));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
