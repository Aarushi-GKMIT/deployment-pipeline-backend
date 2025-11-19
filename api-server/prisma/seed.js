const { PrismaClient } = require("@prisma/client");
const { seedRoles } = require("./seeds/roles.seed");
const { seedUsers } = require("./seeds/users.seed");
const { seedProjects } = require("./seeds/projects.seed");
const { seedDeployments } = require("./seeds/deployments.seed");

const prisma = new PrismaClient();

async function main() {
    await seedRoles(prisma);
    await seedUsers(prisma);
    await seedProjects(prisma);
    await seedDeployments(prisma);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
