const { z } = require("zod");

const adminSignupSchema = z.object({
    name: z.string({ required_error: "Name is required" }).min(1, "Name is required"),
    email: z.string({ required_error: "Email is required" }).email("Invalid email"),
    password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),

    role: z.enum(["ADMIN"], {
        required_error: "Role is required",
        invalid_type_error: "Role must be 'ADMIN'",
    }),
});

module.exports = adminSignupSchema;
