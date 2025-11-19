const { z } = require("zod");

const userSignupSchema = z.object({
    name: z.string({ required_error: "Name is required" }).min(1, "Name is required"),
    email: z.string({ required_error: "Email is required" }).email("Invalid email"),
    password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),

    role: z.enum(["USER"], {
        required_error: "Role is required",
        invalid_type_error: "Role must be 'USER'",
    }),

    projectId: z.string({ required_error: "Project ID is required" }).min(1, "Project ID cannot be empty"),
    gitHubToken: z.string({ required_error: "GitHub token is required" }).min(1, "GitHub token cannot be empty"),
});

module.exports = userSignupSchema;
