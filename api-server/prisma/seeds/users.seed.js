const bcrypt = require("bcrypt");

async function seedUsers(prisma) {
    const adminRole = await prisma.roles.findUnique({
        where: { roleName: "ADMIN" },
    });

    const userRole = await prisma.roles.findUnique({
        where: { roleName: "USER" },
    });

    await prisma.users.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            name: "Admin User",
            email: "admin@example.com",
            password: await bcrypt.hash("Admin123!", 10),
            roleId: adminRole.id,
        },
    });

    await prisma.users.upsert({
        where: { email: "user@example.com" },
        update: {},
        create: {
            name: "Normal User",
            email: "user@example.com",
            password: await bcrypt.hash("User123!", 10),
            roleId: userRole.id,
        },
    });

    console.log("Users seeded");
}

module.exports = { seedUsers };