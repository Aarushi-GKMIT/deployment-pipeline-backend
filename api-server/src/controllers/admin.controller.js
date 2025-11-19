const adminService = require("../services/admin.service");
const adminLoginSchema = require("../validators/admin/adminLogin.validator");
const adminSignupSchema = require("../validators/admin/adminSignup.validator");

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


module.exports = { signup, login };
