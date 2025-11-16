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

const getUsers = async (data) => {
    const { id } = data;

    const admin = await prisma.users.findUnique({
        where: { id },
    });

    if (!admin) {
        throw new ApiError(404, "Admin user not found");
    }

    if (!admin.projectId) {
        throw new ApiError(403, "Admin has no project assigned");
    }

    const projectUsers = await prisma.users.findMany({
        where: {
            projectId: admin.projectId,
            NOT: { id }, // exclude admin
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    return projectUsers;
};

const permissionsUpdate = async (data) => {
    const { adminId, userId, canDeploy } = data;

    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { projectId: true },
    });

    if (!user) throw new ApiError(404, "User not found");

    const admin = await prisma.users.findUnique({
        where: { id: adminId },
        select: { projectId: true },
    });

    if (!admin) throw new ApiError(404, "Admin not found");

    if (admin.projectId !== user.projectId) {
        throw new ApiError(403, "Admin and user are not in the same project");
    }

    const project = await prisma.projects.findUnique({
        where: { id: user.projectId },
        select: { allowedUserId: true },
    });

    if (!project) throw new ApiError(404, "Project not found");

    const allowedUsers = project.allowedUserId || [];

    if (canDeploy) {
        if (!allowedUsers.includes(userId)) {
            await prisma.projects.update({
                where: { id: user.projectId },
                data: {
                    allowedUserId: {
                        push: userId,
                    },
                },
            });

            return;
        }
    }

    const updatedList = allowedUsers.filter((id) => id !== userId);

    await prisma.projects.update({
        where: { id: user.projectId },
        data: { allowedUserId: updatedList },
    });
};

module.exports = { signup, login, getUsers, permissionsUpdate };