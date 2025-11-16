const express = require("express");
const router = express.Router();

const isAuthenticatedUser = require("../middlewares/auth.middleware");
const isAdminMiddleware = require("../middlewares/isAdmin.middleware");
const projectController = require("../controllers/project.controller");

// Only Admin can create Project
router.post("/", isAuthenticatedUser, isAdminMiddleware, projectController.createProject);

module.exports = router;
