const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteMemberByEmail,
  searchUsers,
  getTaskAnalytics,
  exportProject,
  validateCreateProject,
  validateUpdateProject,
  validateInviteMember,
  validateSearchUsers,
  getProjectMembers, // Add this
} = require("../controllers/projectController");

const router = express.Router();

router.use(authMiddleware);

router.post("/projects", validateCreateProject, createProject);
router.get("/projects", getProjects);
router.get("/projects/:id", getProjectById);
router.put("/projects/:id", validateUpdateProject, updateProject);
router.delete("/projects/:id", deleteProject);
router.post("/projects/:id/invite", validateInviteMember, inviteMemberByEmail);
router.get("/projects/search-users", validateSearchUsers, searchUsers);
router.get("/projects/:id/analytics", getTaskAnalytics);
router.get("/projects/:id/export", exportProject);
router.get("/projects/:id/members", getProjectMembers); // Add this route

module.exports = router;