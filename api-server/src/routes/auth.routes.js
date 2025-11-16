const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const adminController = require("../controllers/admin.controller");

const roleRouter = require("../middlewares/roleRouter.middleware");

router.post("/signup", roleRouter, (req, res, next) => {
    if (req.controllerType === "admin") {
        return adminController.signup(req, res, next);
    } else {
        return userController.signup(req, res, next);
    }
});

router.post("/login", roleRouter, (req, res, next) => {
    if (req.controllerType === "admin") {
        return adminController.login(req, res, next);
    } else {
        return userController.login(req, res, next);
    }
});

module.exports = router;