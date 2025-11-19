const userService = require("../services/user.service");
const userSignupSchema = require("../validators/user/userSignup.validator");
const userLoginSchema = require("../validators/user/userLogin.validator");

const signup = async (req, res, next) => {
    try {
        const data = userSignupSchema.parse(req.body);
        await userService.signup(data);

        res.status(201).json({ message: "Signup successful" });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const data = userLoginSchema.parse(req.body);
        const result = await userService.login(data); // { token, role, isMember, projectId }

        res.status(200).json({ message: "Login successful", ...result });
    } catch (err) {
        next(err);
    }
};

module.exports = { signup, login };