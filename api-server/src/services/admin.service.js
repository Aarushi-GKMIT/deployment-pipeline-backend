const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");

const signup = async (data) => {
    const { name, email, password } = data;

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) throw new ApiError(409, "User already exists");

    // Find Role ID
    const roleRecord = await prisma.roles.findUnique({
        where: { roleName: "ADMIN" },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
        data: { name, email, password: hashedPassword, roleId: roleRecord.id },
    });
};

const login = async (data) => {
    const { email, password } = data;

    const user = await prisma.users.findUnique({
        where: { email },
        select: {
            id: true,
            password: true,
            projectId: true,
            role: {
                select: { roleName: true },
            },
        },
    });

    if (!user) throw new ApiError(404, "User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new ApiError(401, "Invalid credentials");

    const token = jwt.sign({ id: user.id, role: user.role.roleName }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return {
        token,
        role: user.role.roleName,
        projectId: user.projectId,
    };
};

module.exports = { signup, login };