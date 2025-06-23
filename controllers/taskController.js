const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assigneeId } = req.body;
  const userId = req.userId;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || !(project.ownerId === userId || project.members.some(m => m.id === userId))) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const task = await prisma.task.create({
    data: { title, description, projectId, assigneeId },
  });
  res.json(task);
};

exports.getTasks = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.userId;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: true },
  });

  if (!project || !(project.ownerId === userId || project.members.some(m => m.id === userId))) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(project.tasks);
};