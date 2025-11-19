// Implemented soft delete

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient().$extends({
    query: {
        $allModels: {
            async delete({ model, operation, args, query }) {
                operation = "update";
                args.data = { deletedAt: new Date() };
                return query(args);
            },
            async deleteMany({ model, operation, args, query }) {
                operation = "updateMany";
                args.data = { deletedAt: new Date() };
                return query(args);
            },
            async findFirst({ model, operation, args, query }) {
                args.where.deletedAt = null;
                return query(args);
            },
            async findUnique({ model, operation, args, query }) {
                args.where.deletedAt = null;
                return query(args);
            },
            async findMany({ model, operation, args, query }) {
                args.where.deletedAt = null;
                return query(args);
            },
        },
    },
});

module.exports = prisma;