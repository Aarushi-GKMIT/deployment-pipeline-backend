const prisma = require("../config/prisma");
const { signupRouteSchema, loginRouteSchema } = require("../validators/middleware/roleRouter.validator");

const roleRouter = async (req, res, next) => {
    const path = req.path;

    try {
        if (path === "/signup") {
            const result = signupRouteSchema.safeParse(req.body);

            if (!result.success) {
                return res.status(400).json({
                    message: result.error.issues[0].message,
                });
            }

            const { role } = result.data;

            req.controllerType = role === "ADMIN" ? "admin" : "user";
            return next();
        }

        if (path === "/login") {
            const result = loginRouteSchema.safeParse(req.body);

            if (!result.success) {
                return res.status(400).json({
                    message: result.error.issues[0].message,
                });
            }

            const { email } = result.data;

            const user = await prisma.users.findUnique({
                where: { email },
                include: { role: true },
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            req.controllerType = user.role.roleName === "ADMIN" ? "admin" : "user";
            req.userFromDB = user;

            return next();
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = roleRouter;