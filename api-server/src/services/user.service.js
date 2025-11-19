const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { checkRepoAccess } = require("../utils/github");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");

const signup = async (data) => {
    const { name, email, password, role, projectId, gitHubToken } = data;

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) throw new ApiError(409, "User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const project = await prisma.projects.findFirst({
        where: { id: projectId },
        select: { gitUrl: true },
    });

    if (!project) throw new ApiError(404, "Project not found");

    // Validate repo access
    const accessAllowed = await checkRepoAccess(project.gitUrl, gitHubToken);
    if (!accessAllowed) throw new ApiError(403, "GitHub access denied — invalid token");

    // Find Role ID
    const roleRecord = await prisma.roles.findUnique({
        where: { roleName: role },
    });

    await prisma.users.create({
        data: { name, email, password: hashedPassword, roleId: roleRecord.id, projectId },
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

    // Fetch project and check membership
    const project = await prisma.projects.findUnique({
        where: { id: user.projectId },
        select: {
            allowedUserId: true,
        },
    });

    let isMember = false;

    if (project) {
        isMember = project.allowedUserId.includes(user.id);
    }

    const roleName = user.role.roleName;
    const token = jwt.sign({ id: user.id, role: roleName }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return {
        token,
        role: roleName,
        isMember,
        projectId: user.projectId,
    };
};

module.exports = { signup, login };
