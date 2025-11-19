async function seedProjects(prisma) {
    const admin = await prisma.users.findUnique({
        where: { email: "admin@example.com" },
    });

    await prisma.projects.create({
        data: {
            name: "Sample Project",
            gitUrl: "https://github.com/example/repo",
            adminGithubToken: "dummy-token",
            allowedUserId: [admin.id],
        },
    });

    console.log("Projects seeded");
}

module.exports = { seedProjects };
