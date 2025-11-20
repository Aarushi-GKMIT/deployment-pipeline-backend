const { z } = require("zod");

const createDeploymentSchema = z.object({
    projectId: z.string({ required_error: "Project ID is required" }).min(1, "Project ID cannot be empty"),
});

module.exports = createDeploymentSchema;