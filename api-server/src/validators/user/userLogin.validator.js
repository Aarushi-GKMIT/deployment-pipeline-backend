const { z } = require("zod");

const userLoginSchema = z.object({
    email: z.string({ required_error: "Email is required" }).email("Invalid email"),
    password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});

module.exports = userLoginSchema;
