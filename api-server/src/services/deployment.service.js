const { RunTaskCommand } = require("@aws-sdk/client-ecs");
const prisma = require("../config/prisma");
const { ecsClient, ecsConfig } = require("../config/ecs");
const ApiError = require("../utils/apiError");

const createDeployment = async (data) => {
    const { userId, projectId } = data;

    const project = await prisma.projects.findUnique({
        where: { id: projectId },
    });

    if (!project) throw new ApiError(404, "Project not found");
    if (!project.allowedUserId.includes(userId)) throw new ApiError(403, "You are not allowed to deploy this project");

    // Create deployment record
    const deployment = await prisma.deployments.create({
        data: {
            status: "QUEUED",
            user: { connect: { id: userId } },
            project: { connect: { id: projectId } },
        },
    });

    // Prepare ECS task environment
    const environment = [
        { name: "GIT_REPOSITORY_URL", value: project.gitUrl },
        { name: "PROJECT_ID", value: String(projectId) },
        { name: "DEPLOYMENT_ID", value: String(deployment.id) },
        { name: "AWS_REGION", value: process.env.AWS_REGION },
        { name: "S3_BUCKET", value: process.env.S3_BUCKET },
        { name: "AWS_ACCESS_KEY_ID", value: process.env.AWS_ACCESS_KEY_ID },
        { name: "AWS_SECRET_ACCESS_KEY", value: process.env.AWS_SECRET_ACCESS_KEY },
    ];

    const command = new RunTaskCommand({
        cluster: ecsConfig.CLUSTER,
        taskDefinition: ecsConfig.TASK,
        launchType: "FARGATE",
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: "ENABLED",
                subnets: [process.env.ECS_SUBNETS_1, process.env.ECS_SUBNETS_2],
                securityGroups: [process.env.ECS_SECURITY_GROUPS],
            },
        },
        overrides: {
            containerOverrides: [
                {
                    name: "builder-image",
                    environment,
                },
            ],
        },
    });

    try {
        await ecsClient.send(command);
    } catch (err) {
        throw new ApiError(500, "Failed to start ECS deployment task: " + err.message);
    }

    const deploymentUrl = `http://${project.id}.${process.env.S3_URL}`;

    return { deploymentUrl };
};

module.exports = { createDeployment };