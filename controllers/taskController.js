const prisma = require("../prisma");
const { body } = require("express-validator");
const validate = require("../middleware/validate");

exports.validateCreateTask = [
  body("title")
    .notEmpty()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title is required and must be <= 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be <= 500 characters"),
  body("status")
    .optional()
    .isIn(["todo", "in_progress", "done"]) // Match frontend statuses
    .withMessage("Invalid status"),
  body("assigneeId")
    .optional()
    .isUUID()
    .withMessage("Invalid assignee ID"),
  body("projectId")
    .notEmpty()
    .isUUID()
    .withMessage("Project ID is required and must be a valid UUID"),
  validate,
];

exports.createTask = async (req, res) => {
  const { title, description, status = "todo", assigneeId, projectId } = req.body;
  const userId = req.user.id; // Match authMiddleware

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true, owner: true },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (
      project.ownerId !== userId &&
      !project.members.some((m) => m.id === userId)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const task = await prisma.task.create({
      data: { title, description, status, projectId, assigneeId },
      include: { assignee: true }, // Include assignee for frontend
    });

    // Emit Socket.io event
    req.io.emit(`project:${projectId}:taskCreated`, task);

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTasks = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true, owner: true, tasks: { include: { assignee: true } } },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (
      project.ownerId !== userId &&
      !project.members.some((m) => m.id === userId)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(project.tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.validateUpdateTask = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title must be <= 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be <= 500 characters"),
  body("status")
    .optional()
    .isIn(["todo", "in_progress", "done"])
    .withMessage("Invalid status"),
  body("assigneeId")
    .optional()
    .isUUID()
    .withMessage("Invalid assignee ID"),
  validate,
];

exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, assigneeId } = req.body;
  const userId = req.user.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true, owner: true } } },
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (
      task.project.ownerId !== userId &&
      !task.project.members.some((m) => m.id === userId)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { title, description, status, assigneeId },
      include: { assignee: true },
    });

    // Emit Socket.io event
    req.io.emit(`project:${task.projectId}:taskUpdated`, updatedTask);

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true, owner: true } } },
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (
      task.project.ownerId !== userId &&
      !task.project.members.some((m) => m.id === userId)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.task.delete({ where: { id: taskId } });

    // Emit Socket.io event
    req.io.emit(`project:${task.projectId}:taskDeleted`, taskId);

    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};