const request = require("supertest");
const express = require("express");

// Mock dependencies
jest.mock("../src/config/prisma", () => ({
  users: {
    findUnique: jest.fn(),
  },
}));
jest.mock("../src/services/admin.service");
jest.mock("../src/services/user.service");
jest.mock("../src/validators/middleware/roleRouter.validator");
jest.mock("../src/validators/admin/adminSignup.validator");
jest.mock("../src/validators/admin/adminLogin.validator");
jest.mock("../src/validators/user/userSignup.validator");
jest.mock("../src/validators/user/userLogin.validator");

const prisma = require("../src/config/prisma");
const adminService = require("../src/services/admin.service");
const userService = require("../src/services/user.service");
const { signupRouteSchema, loginRouteSchema } = require("../src/validators/middleware/roleRouter.validator");
const adminSignupSchema = require("../src/validators/admin/adminSignup.validator");
const adminLoginSchema = require("../src/validators/admin/adminLogin.validator");
const userSignupSchema = require("../src/validators/user/userSignup.validator");
const userLoginSchema = require("../src/validators/user/userLogin.validator");
const authRoutes = require("../src/routes/auth.routes");

describe("Auth Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/auth", authRoutes);

    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        message: err.message || "Internal server error",
      });
    });

    jest.clearAllMocks();
  });

  // Signup tests

  describe("POST /auth/signup", () => {
    test("Should signup admin successfully", async () => {
      const mockData = { email: "admin@example.com", password: "Admin@123", role: "ADMIN" };

      signupRouteSchema.safeParse = jest.fn().mockReturnValue({ success: true, data: { role: "ADMIN" } });
      adminSignupSchema.parse = jest.fn().mockReturnValue(mockData);
      adminService.signup.mockResolvedValue(undefined);

      const res = await request(app).post("/auth/signup").send(mockData);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Signup successful");
      expect(adminService.signup).toHaveBeenCalledWith(mockData);
    });

    test("Should signup user successfully", async () => {
      const mockData = { email: "user@example.com", password: "User@123", role: "USER" };

      signupRouteSchema.safeParse = jest.fn().mockReturnValue({ success: true, data: { role: "USER" } });
      userSignupSchema.parse = jest.fn().mockReturnValue(mockData);
      userService.signup.mockResolvedValue(undefined);

      const res = await request(app).post("/auth/signup").send(mockData);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Signup successful");
      expect(userService.signup).toHaveBeenCalledWith(mockData);
    });

    test("Should return 400 when validation fails", async () => {
      signupRouteSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: { issues: [{ message: "Invalid role" }] },
      });

      const res = await request(app).post("/auth/signup").send({ email: "test@example.com" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid role");
    });

    test("Should return 409 when user already exists", async () => {
      signupRouteSchema.safeParse = jest.fn().mockReturnValue({ success: true, data: { role: "USER" } });
      userSignupSchema.parse = jest.fn().mockReturnValue({ email: "existing@example.com" });

      const error = new Error("User already exists");
      error.statusCode = 409;
      userService.signup.mockRejectedValue(error);

      const res = await request(app).post("/auth/signup").send({ email: "existing@example.com", role: "USER" });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe("User already exists");
    });
  });

  // Login Tests

  describe("POST /auth/login", () => {
    test("Should login admin successfully", async () => {
      const mockData = { email: "admin@example.com", password: "Admin@123" };
      const mockUser = { id: 1, email: "admin@example.com", role: { roleName: "ADMIN" } };
      const mockResult = { token: "admin-token", role: "ADMIN", projectId: 10 };

      loginRouteSchema.safeParse = jest.fn().mockReturnValue({ success: true, data: mockData });
      prisma.users.findUnique.mockResolvedValue(mockUser);
      adminLoginSchema.parse = jest.fn().mockReturnValue(mockData);
      adminService.login.mockResolvedValue(mockResult);

      const res = await request(app).post("/auth/login").send(mockData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.token).toBe("admin-token");
      expect(adminService.login).toHaveBeenCalled();
    });

    test("Should login user successfully", async () => {
      const mockData = { email: "user@example.com", password: "User@123" };
      const mockUser = { id: 2, email: "user@example.com", role: { roleName: "USER" } };
      const mockResult = { token: "user-token", role: "USER", isMember: true };

      loginRouteSchema.safeParse = jest.fn().mockReturnValue({ success: true, data: mockData });
      prisma.users.findUnique.mockResolvedValue(mockUser);
      userLoginSchema.parse = jest.fn().mockReturnValue(mockData);
      userService.login.mockResolvedValue(mockResult);

      const res = await request(app).post("/auth/login").send(mockData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.token).toBe("user-token");
      expect(userService.login).toHaveBeenCalled();
    });

    test("Should return 404 when user not found", async () => {
      loginRouteSchema.safeParse = jest.fn().mockReturnValue({ success: true, data: { email: "none@example.com" } });
      prisma.users.findUnique.mockResolvedValue(null);

      const res = await request(app).post("/auth/login").send({ email: "none@example.com", password: "Test@123" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    test("Should return 401 when credentials are invalid", async () => {
      const mockData = { email: "user@example.com", password: "Wrong@123" };
      const mockUser = { id: 2, email: "user@example.com", role: { roleName: "USER" } };

      loginRouteSchema.safeParse = jest.fn().mockReturnValue({ success: true, data: mockData });
      prisma.users.findUnique.mockResolvedValue(mockUser);
      userLoginSchema.parse = jest.fn().mockReturnValue(mockData);

      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      userService.login.mockRejectedValue(error);

      const res = await request(app).post("/auth/login").send(mockData);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Invalid credentials");
    });
  });
});