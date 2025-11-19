const { z } = require("zod");

const signupRouteSchema = z.looseObject({
    role: z.enum(["ADMIN", "USER"], {
        required_error: "Role is required for signup",
        invalid_type_error: "Role must be either ADMIN or USER",
    }),
});

const loginRouteSchema = z.looseObject({
    email: z.string({ required_error: "Email is required for login" }).email("Invalid email format"),
});

module.exports = { signupRouteSchema, loginRouteSchema };