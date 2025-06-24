const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  validateCreateTask,
  validateUpdateTask,
} = require("../controllers/taskController");

const router = express.Router();

router.use(authMiddleware);

router.post("/tasks", validateCreateTask, createTask);
router.get("/projects/:projectId/tasks", getTasks);
router.patch("/tasks/:taskId", validateUpdateTask, updateTask);
router.delete("/tasks/:taskId", deleteTask);

module.exports = router;