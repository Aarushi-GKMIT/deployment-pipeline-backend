const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../src/services/admin.service");
jest.mock("../src/validators/admin/permissionsUpdate.validator");

const adminService = require("../src/services/admin.service");
const permissionsUpdateSchema = require("../src/validators/admin/permissionsUpdate.validator");
const adminRoutes = require("../src/routes/admin.routes");

describe("Admin Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/admin", adminRoutes);

    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        message: err.message || "Internal server error",
      });
    });

    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  // Get /admin/getUsers 

  describe("GET /admin/getUsers", () => {
    test("Should get users successfully for admin", async () => {
      const mockAdmin = { id: 1, role: "ADMIN" };
      const mockUsers = [
        { id: 2, name: "User 1", email: "user1@example.com" },
        { id: 3, name: "User 2", email: "user2@example.com" },
      ];

      jwt.verify.mockReturnValue(mockAdmin);
      adminService.getUsers.mockResolvedValue(mockUsers);

      const res = await request(app)
        .get("/admin/getUsers")
        .set("Authorization", "Bearer valid-token");

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Users fetch successful");
      expect(res.body.projectUsers).toEqual(mockUsers);
      expect(adminService.getUsers).toHaveBeenCalledWith({ id: mockAdmin.id });
    });

    test("Should return 401 when no token provided", async () => {
      const res = await request(app).get("/admin/getUsers");

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("No token provided");
      expect(adminService.getUsers).not.toHaveBeenCalled();
    });

    test("Should return 401 when token is invalid", async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const res = await request(app)
        .get("/admin/getUsers")
        .set("Authorization", "Bearer invalid-token");

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Invalid token");
    });

    test("Should return 403 when user is not admin", async () => {
      const mockUser = { id: 2, role: "USER" };
      jwt.verify.mockReturnValue(mockUser);

      const res = await request(app)
        .get("/admin/getUsers")
        .set("Authorization", "Bearer valid-token");

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Access denied — admin only");
      expect(adminService.getUsers).not.toHaveBeenCalled();
    });

    test("Should return 404 when admin not found", async () => {
      const mockAdmin = { id: 999, role: "ADMIN" };
      jwt.verify.mockReturnValue(mockAdmin);

      const error = new Error("Admin user not found");
      error.statusCode = 404;
      adminService.getUsers.mockRejectedValue(error);

      const res = await request(app)
        .get("/admin/getUsers")
        .set("Authorization", "Bearer valid-token");

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Admin user not found");
    });

    test("Should return 403 when admin has no project assigned", async () => {
      const mockAdmin = { id: 1, role: "ADMIN" };
      jwt.verify.mockReturnValue(mockAdmin);

      const error = new Error("Admin has no project assigned");
      error.statusCode = 403;
      adminService.getUsers.mockRejectedValue(error);

      const res = await request(app)
        .get("/admin/getUsers")
        .set("Authorization", "Bearer valid-token");

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Admin has no project assigned");
    });
  });

  // Patch /admin/permissionsUpdate/:userId

  describe("PATCH /admin/permissionsUpdate/:userId", () => {
    test("Should update permissions successfully", async () => {
      const mockAdmin = { id: 1, role: "ADMIN" };
      const userId = "5";
      const mockData = { canDeploy: true };

      jwt.verify.mockReturnValue(mockAdmin);
      permissionsUpdateSchema.parse = jest.fn().mockReturnValue(mockData);
      adminService.permissionsUpdate.mockResolvedValue(undefined);

      const res = await request(app)
        .patch(`/admin/permissionsUpdate/${userId}`)
        .set("Authorization", "Bearer valid-token")
        .send(mockData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Permission change successful");
      expect(adminService.permissionsUpdate).toHaveBeenCalledWith({
        userId,
        adminId: mockAdmin.id,
        canDeploy: true,
      });
    });

    test("Should grant deploy permission to user", async () => {
      const mockAdmin = { id: 1, role: "ADMIN" };
      const userId = "3";
      const mockData = { canDeploy: true };

      jwt.verify.mockReturnValue(mockAdmin);
      permissionsUpdateSchema.parse = jest.fn().mockReturnValue(mockData);
      adminService.permissionsUpdate.mockResolvedValue(undefined);

      const res = await request(app)
        .patch(`/admin/permissionsUpdate/${userId}`)
        .set("Authorization", "Bearer valid-token")
        .send(mockData);

      expect(res.statusCode).toBe(200);
      expect(adminService.permissionsUpdate).toHaveBeenCalledWith({
        userId,
        adminId: mockAdmin.id,
        canDeploy: true,
      });
    });

    test("Should revoke deploy permission from user", async () => {
      const mockAdmin = { id: 1, role: "ADMIN" };
      const userId = "3";
      const mockData = { canDeploy: false };

      jwt.verify.mockReturnValue(mockAdmin);
      permissionsUpdateSchema.parse = jest.fn().mockReturnValue(mockData);
      adminService.permissionsUpdate.mockResolvedValue(undefined);

      const res = await request(app)
        .patch(`/admin/permissionsUpdate/${userId}`)
        .set("Authorization", "Bearer valid-token")
        .send(mockData);

      expect(res.statusCode).toBe(200);
      expect(adminService.permissionsUpdate).toHaveBeenCalledWith({
        userId,
        adminId: mockAdmin.id,
        canDeploy: false,
      });
    });

    test("Should return 401 when no token provided", async () => {
      const res = await request(app)
        .patch("/admin/permissionsUpdate/5")
        .send({ canDeploy: true });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("No token provided");
    });

    test("Should return 403 when user is not admin", async () => {
      const mockUser = { id: 2, role: "USER" };
      jwt.verify.mockReturnValue(mockUser);

      const res = await request(app)
        .patch("/admin/permissionsUpdate/5")
        .set("Authorization", "Bearer valid-token")
        .send({ canDeploy: true });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Access denied — admin only");
    });

    test("Should return 400 when validation fails", async () => {
      const mockAdmin = { id: 1, role: "ADMIN" };
      jwt.verify.mockReturnValue(mockAdmin);

      const validationError = new Error("canDeploy must be a boolean");
      validationError.statusCode = 400;
      permissionsUpdateSchema.parse = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      const res = await request(app)
        .patch("/admin/permissionsUpdate/5")
        .set("Authorization", "Bearer valid-token")
        .send({ canDeploy: "invalid" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("canDeploy");
    });

    test("Should return 404 when user not found", async () => {
      const mockAdmin = { id: 1, role: "ADMIN" };
      jwt.verify.mockReturnValue(mockAdmin);
      permissionsUpdateSchema.parse = jest.fn().mockReturnValue({ canDeploy: true });

      const error = new Error("User not found");
      error.statusCode = 404;
      adminService.permissionsUpdate.mockRejectedValue(error);

      const res = await request(app)
        .patch("/admin/permissionsUpdate/999")
        .set("Authorization", "Bearer valid-token")
        .send({ canDeploy: true });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    test("Should return 403 when admin and user not in same project", async () => {
      const mockAdmin = { id: 1, role: "ADMIN" };
      jwt.verify.mockReturnValue(mockAdmin);
      permissionsUpdateSchema.parse = jest.fn().mockReturnValue({ canDeploy: true });

      const error = new Error("Admin and user are not in the same project");
      error.statusCode = 403;
      adminService.permissionsUpdate.mockRejectedValue(error);

      const res = await request(app)
        .patch("/admin/permissionsUpdate/5")
        .set("Authorization", "Bearer valid-token")
        .send({ canDeploy: true });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Admin and user are not in the same project");
    });

    test("Should return 404 when project not found", async () => {
      const mockAdmin = { id: 1, role: "ADMIN" };
      jwt.verify.mockReturnValue(mockAdmin);
      permissionsUpdateSchema.parse = jest.fn().mockReturnValue({ canDeploy: true });

      const error = new Error("Project not found");
      error.statusCode = 404;
      adminService.permissionsUpdate.mockRejectedValue(error);

      const res = await request(app)
        .patch("/admin/permissionsUpdate/5")
        .set("Authorization", "Bearer valid-token")
        .send({ canDeploy: true });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Project not found");
    });
  });
});