const express = require("express");
const router = express.Router();

const isAuthenticatedUser = require("../middlewares/auth.middleware");
const deployController = require("../controllers/deployment.controller");

router.post("/", isAuthenticatedUser, deployController.createDeployment);

module.exports = router;
