const { z } = require("zod");

const permissionsUpdateSchema = z.object({
    canDeploy: z.boolean({
        required_error: "canDeploy is required",
        invalid_type_error: "canDeploy must be a boolean",
    }),
});

module.exports = permissionsUpdateSchema;