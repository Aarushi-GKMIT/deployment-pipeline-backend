const adminService = require("../services/admin.service");
const adminLoginSchema = require("../validators/admin/adminLogin.validator");
const adminSignupSchema = require("../validators/admin/adminSignup.validator");
const permissionsUpdateSchema = require("../validators/admin/permissionsUpdate.validator");

const signup = async (req, res, next) => {
    try {
        const data = adminSignupSchema.parse(req.body);
        await adminService.signup(data);

        res.status(201).json({ message: "Signup successful" });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const data = adminLoginSchema.parse(req.body);
        const result = await adminService.login(data); // { token, role, projectId }

        res.status(200).json({ message: "Login successful", ...result });
    } catch (err) {
        next(err);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const data = { id: req.user.id };
        const result = await adminService.getUsers(data); // projectUsers[]

        res.status(200).json({ message: "Users fetch successful", projectUsers: result });
    } catch (err) {
        next(err);
    }
};

const permissionsUpdate = async (req, res, next) => {
    try {
        const parsedBody = permissionsUpdateSchema.parse(req.body);
        const userId = req.params.userId;

        const data = {
            userId,
            adminId: req.user.id,
            canDeploy: parsedBody.canDeploy,
        };

        await adminService.permissionsUpdate(data);

        res.status(200).json({
            message: "Permission change successful",
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { signup, login, getUsers, permissionsUpdate };
