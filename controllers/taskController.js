const prisma = require("../prisma");const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { io } = require("../index");

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
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid status"),
  body("assigneeId")
    .optional()
    .isUUID()
    .withMessage("Invalid assignee ID"),
  validate,
];

exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, status = "todo", assigneeId } = req.body;
  const userId = req.userId;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project || !(project.ownerId === userId || project.members.some(m => m.id === userId))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const task = await prisma.task.create({
      data: { title, description, status, projectId, assigneeId },
    });

    io.to(projectId).emit("taskCreated", task);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTasks = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.userId;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true, tasks: true },
    });

    if (!project || !(project.ownerId === userId || project.members.some(m => m.id === userId))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(project.tasks);
  } catch (error) {
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
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid status"),
  body("assigneeId")
    .optional()
    .isUUID()
    .withMessage("Invalid assignee ID"),
  validate,
];

exports.updateTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, description, status, assigneeId } = req.body;
  const userId = req.userId;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project || !(project.ownerId === userId || project.members.some(m => m.id === userId))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { title, description, status, assigneeId },
    });

    io.to(projectId).emit("taskUpdated", task);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  const userId = req.userId;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project || !(project.ownerId === userId || project.members.some(m => m.id === userId))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.task.delete({ where: { id: taskId } });
    io.to(projectId).emit("taskDeleted", taskId);
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};