const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

exports.createProject = async (req, res) => {
  const { name } = req.body;
  const userId = req.userId;

  const project = await prisma.project.create({
    data: { name, ownerId: userId },
  });
  res.json(project);
};

exports.getProjects = async (req, res) => {
  const userId = req.userId;
  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
    },
    include: { members: true, tasks: true },
  });
  res.json(projects);
};

exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.userId;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: { name },
  });
  res.json(updatedProject);
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await prisma.project.delete({ where: { id } });
  res.json({ message: "Project deleted" });
};

exports.addMember = async (req, res) => {
  const { id } = req.params;
  const { memberId } = req.body;
  const userId = req.userId;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: { members: { connect: { id: memberId } } },
  });
  res.json(updatedProject);
};