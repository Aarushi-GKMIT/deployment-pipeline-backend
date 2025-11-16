const { z } = require("zod");

const createProjectSchema = z.object({
    name: z.string({ required_error: "Name is required" }).min(1, "Name is required"),
    gitUrl: z.string({ required_error: "Git URL is required" }).url("Invalid URL"),
    adminGithubToken: z
        .string({ required_error: "Admin GitHub token is required" })
        .min(1, "Admin GitHub token is required"),
});

module.exports = createProjectSchema;