const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");

const isAuthenticatedUser = require("../middlewares/auth.middleware");
const isAdminMiddleware = require("../middlewares/isAdmin.middleware");

// Admin Only routes
router.get("/getUsers", isAuthenticatedUser, isAdminMiddleware, adminController.getUsers);
router.patch("/permissionsUpdate/:userId", isAuthenticatedUser, isAdminMiddleware, adminController.permissionsUpdate);

module.exports = router;