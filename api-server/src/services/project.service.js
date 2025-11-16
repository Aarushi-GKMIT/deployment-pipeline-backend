const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { checkRepoAccess } = require("../utils/github");
const ApiError = require("../utils/apiError");

const createProject = async (data) => {
    const { name, gitUrl, adminGithubToken, userId } = data;

    // Check if user already has a project
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { projectId: true },
    });

    if (user.projectId) throw new ApiError(400, "Project Already Exist");

    // Validate repo access
    const accessAllowed = await checkRepoAccess(gitUrl, adminGithubToken);
    if (!accessAllowed) throw new ApiError(403, "GitHub access denied — invalid token");

    // Hash the GitHub token before storing
    const hashedToken = await bcrypt.hash(adminGithubToken, 10);

    // Create the project
    const project = await prisma.projects.create({
        data: {
            name,
            gitUrl,
            adminGithubToken: hashedToken,
            allowedUserId: [userId],
            users: { connect: { id: userId } },
        },
    });

    // Update user with project ID
    await prisma.users.update({
        where: { id: userId },
        data: { projectId: project.id },
    });

    return { projectId: project.id };
};

module.exports = { createProject };