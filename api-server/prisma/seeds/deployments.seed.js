async function seedDeployments(prisma) {
    const project = await prisma.projects.findFirst();
    const user = await prisma.users.findUnique({
        where: { email: "admin@example.com" },
    });

    if (!project || !user) {
        console.log("Skipping deployments (missing user/project)");
        return;
    }

    await prisma.deployments.create({
        data: {
            status: "QUEUED",
            projectId: project.id,
            userId: user.id,
        },
    });

    console.log("Deployments seeded");
}

module.exports = { seedDeployments };
