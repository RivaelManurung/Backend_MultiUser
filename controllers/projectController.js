const { body, query } = require("express-validator");
const validate = require("../middleware/validate");
const prisma = require("../prisma");

exports.validateCreateProject = [
  body("name").notEmpty().withMessage("Project name is required"),
  validate,
];

exports.validateUpdateProject = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Project name cannot be empty"),
  validate,
];

exports.validateInviteMember = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  validate,
];

exports.validateSearchUsers = [
  query("query").notEmpty().withMessage("Search query is required"),
  validate,
];

exports.createProject = async (req, res) => {
  const { name } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        ownerId: userId,
        members: { connect: { id: userId } },
      },
    });
    res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProjects = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
      },
    });
    res.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProjectById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
      },
      include: {
        tasks: true,
        members: { select: { id: true, email: true } },
        owner: { select: { id: true, email: true } },
      },
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
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id, ownerId: userId },
    });
    if (!project) {
      return res.status(403).json({ error: "Unauthorized or project not found" });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { name },
    });
    res.json(updatedProject);
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id, ownerId: userId },
    });
    if (!project) {
      return res.status(403).json({ error: "Unauthorized or project not found" });
    }

    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.inviteMemberByEmail = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id, ownerId: userId },
    });
    if (!project) {
      return res.status(403).json({ error: "Unauthorized or project not found" });
    }

    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { members: { connect: { id: invitedUser.id } } },
      include: { members: { select: { id: true, email: true } } },
    });
    res.json(updatedProject);
  } catch (error) {
    console.error("Invite member error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.searchUsers = async (req, res) => {
  const { query } = req.query;

  try {
    const users = await prisma.user.findMany({
      where: {
        email: { contains: query, mode: "insensitive" },
      },
      select: { id: true, email: true },
    });
    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTaskAnalytics = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
      },
    });
    if (!project) {
      return res.status(403).json({ error: "Unauthorized or project not found" });
    }

    const analytics = await prisma.task.groupBy({
      by: ["status"],
      where: { projectId: id },
      _count: { status: true },
    });
    res.json(analytics);
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.exportProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
      },
      include: { tasks: true, members: { select: { id: true, email: true } }, owner: { select: { id: true, email: true } } },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Export project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProjectMembers = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
      },
      include: {
        members: { select: { id: true, email: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json({ members: project.members });
  } catch (error) {
    console.error("Error fetching project members:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};