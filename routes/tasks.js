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

router.post("/:projectId", validateCreateTask, createTask);
router.get("/:projectId", getTasks);
router.put("/:projectId/:taskId", validateUpdateTask, updateTask);
router.delete("/:projectId/:taskId", deleteTask);

module.exports = router;