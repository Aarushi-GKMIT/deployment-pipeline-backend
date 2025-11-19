async function seedRoles(prisma) {
    const roles = [{ roleName: "ADMIN" }, { roleName: "USER" }];

    for (const role of roles) {
        await prisma.roles.upsert({
            where: { roleName: role.roleName },
            update: {},
            create: role,
        });
    }

    console.log("Roles seeded");
}

module.exports = { seedRoles };
