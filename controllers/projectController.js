const prisma = require("../prisma");
const { body, query } = require("express-validator");
const validate = require("../middleware/validate");

exports.validateCreateProject = [
  body("name")
    .notEmpty()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Project name is required and must be <= 100 characters"),
  validate,
];

exports.createProject = async (req, res) => {
  const { name } = req.body;
  const userId = req.userId;

  try {
    const project = await prisma.project.create({
      data: { name, ownerId: userId },
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProjects = async (req, res) => {
  const userId = req.userId;

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
      },
      include: { members: { select: { id: true, email: true } }, tasks: true },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.validateUpdateProject = [
  body("name")
    .notEmpty()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Project name is required and must be <= 100 characters"),
  validate,
];
exports.getProjectById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        members: { some: { userId } },
      },
      include: { tasks: true, members: { include: { user: true } } },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.userId;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.ownerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { name },
    });
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.ownerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.validateInviteMember = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  validate,
];

exports.inviteMemberByEmail = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const userId = req.userId;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.ownerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { members: { connect: { id: user.id } } },
      include: { members: { select: { id: true, email: true } } },
    });
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.validateSearchUsers = [
  query("query").notEmpty().trim().withMessage("Search query is required"),
  validate,
];

exports.searchUsers = async (req, res) => {
  const { query } = req.query;

  try {
    const users = await prisma.user.findMany({
      where: { email: { contains: query, mode: "insensitive" } },
      select: { id: true, email: true },
      take: 10,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTaskAnalytics = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (
      !project ||
      !(
        project.ownerId === userId ||
        project.members.some((m) => m.id === userId)
      )
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const analytics = await prisma.task.groupBy({
      by: ["status"],
      where: { projectId: id },
      _count: { status: true },
    });

    const result = { todo: 0, "in-progress": 0, done: 0 };
    analytics.forEach(({ status, _count }) => {
      result[status] = _count.status;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.exportProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        members: { select: { id: true, email: true } },
        owner: { select: { id: true, email: true } },
      },
    });

    if (
      !project ||
      !(
        project.ownerId === userId ||
        project.members.some((m) => m.id === userId)
      )
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=project-${id}.json`
    );
    res.setHeader("Content-Type", "application/json");
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
