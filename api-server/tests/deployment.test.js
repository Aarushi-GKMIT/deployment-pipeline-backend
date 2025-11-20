const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../src/services/deployment.service");
jest.mock("../src/validators/deployment/createDeployment.validator");

const deploymentService = require("../src/services/deployment.service");
const createDeploymentSchema = require("../src/validators/deployment/createDeployment.validator");
const deploymentRoutes = require("../src/routes/deployment.routes");

describe("Deployment Route Create Deployment", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/deployment", deploymentRoutes);

    // Add error handler middleware
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        message: err.message || "Internal server error",
      });
    });

    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  // Positive Test - Successful deployment creation
  test("Should create deployment successfully with valid token", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    const mockDeploymentData = {
      projectId: 5,
    };
    const mockResult = {
      deploymentUrl: "http://5.example-s3.com",
    };

    jwt.verify.mockReturnValue(mockUser);

    createDeploymentSchema.parse = jest.fn().mockReturnValue(mockDeploymentData);

    deploymentService.createDeployment.mockResolvedValue(mockResult);

    const res = await request(app)
      .post("/deployment")
      .set("Authorization", "Bearer valid-token")
      .send(mockDeploymentData);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "Deployment created successfully");
    expect(res.body).toHaveProperty("deploymentUrl");
    expect(res.body.deploymentUrl).toBe("http://5.example-s3.com");
    expect(deploymentService.createDeployment).toHaveBeenCalledWith({
      ...mockDeploymentData,
      userId: mockUser.id,
    });
  });

  // Negative Tests
  test("Should return 401 when no token is provided", async () => {
    const res = await request(app)
      .post("/deployment")
      .send({ projectId: 5 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "No token provided");
    expect(deploymentService.createDeployment).not.toHaveBeenCalled();
  });

  test("Should return 401 when token is invalid", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const res = await request(app)
      .post("/deployment")
      .set("Authorization", "Bearer invalid-token")
      .send({ projectId: 5 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token");
    expect(deploymentService.createDeployment).not.toHaveBeenCalled();
  });

  test("Should return 401 when Authorization header is malformed", async () => {
    const res = await request(app)
      .post("/deployment")
      .set("Authorization", "InvalidFormat")
      .send({ projectId: 5 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "No token provided");
  });


  test("Should return 400 when request body validation fails", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    jwt.verify.mockReturnValue(mockUser);


    const validationError = new Error("Validation failed");
    validationError.statusCode = 400;
    createDeploymentSchema.parse = jest.fn().mockImplementation(() => {
      throw validationError;
    });

    const res = await request(app)
      .post("/deployment")
      .set("Authorization", "Bearer valid-token")
      .send({ invalidField: "data" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });


  test("Should return 404 when project is not found", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    const mockDeploymentData = { projectId: 999 };

    jwt.verify.mockReturnValue(mockUser);
    createDeploymentSchema.parse = jest.fn().mockReturnValue(mockDeploymentData);

    // Mock service throwing 404 error
    const notFoundError = new Error("Project not found");
    notFoundError.statusCode = 404;
    deploymentService.createDeployment.mockRejectedValue(notFoundError);

    const res = await request(app)
      .post("/deployment")
      .set("Authorization", "Bearer valid-token")
      .send(mockDeploymentData);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Project not found");
  });

  // Negative Test - User not allowed to deploy
  test("Should return 403 when user is not allowed to deploy project", async () => {
    const mockUser = { id: 2, email: "unauthorized@example.com" };
    const mockDeploymentData = { projectId: 5 };

    jwt.verify.mockReturnValue(mockUser);
    createDeploymentSchema.parse = jest.fn().mockReturnValue(mockDeploymentData);

    // Mock service throwing 403 error
    const forbiddenError = new Error("You are not allowed to deploy this project");
    forbiddenError.statusCode = 403;
    deploymentService.createDeployment.mockRejectedValue(forbiddenError);

    const res = await request(app)
      .post("/deployment")
      .set("Authorization", "Bearer valid-token")
      .send(mockDeploymentData);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("message", "You are not allowed to deploy this project");
  });

  // Negative Test - ECS task failure
  test("Should return 500 when ECS task fails to start", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    const mockDeploymentData = { projectId: 5 };

    jwt.verify.mockReturnValue(mockUser);
    createDeploymentSchema.parse = jest.fn().mockReturnValue(mockDeploymentData);

    // Mock service throwing ECS error
    const ecsError = new Error("Failed to start ECS deployment task: Network error");
    ecsError.statusCode = 500;
    deploymentService.createDeployment.mockRejectedValue(ecsError);

    const res = await request(app)
      .post("/deployment")
      .set("Authorization", "Bearer valid-token")
      .send(mockDeploymentData);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toContain("Failed to start ECS deployment task");
  });

  // Negative Test - Database connection error
  test("Should return 500 when database operation fails", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    const mockDeploymentData = { projectId: 5 };

    jwt.verify.mockReturnValue(mockUser);
    createDeploymentSchema.parse = jest.fn().mockReturnValue(mockDeploymentData);

    // Mock service throwing database error
    const dbError = new Error("Database connection failed");
    dbError.statusCode = 500;
    deploymentService.createDeployment.mockRejectedValue(dbError);

    const res = await request(app)
      .post("/deployment")
      .set("Authorization", "Bearer valid-token")
      .send(mockDeploymentData);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Database connection failed");
  });

  // Edge Case - Missing projectId in request body
  test("Should handle missing projectId in request body", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    jwt.verify.mockReturnValue(mockUser);

    const validationError = new Error("projectId is required");
    validationError.statusCode = 400;
    createDeploymentSchema.parse = jest.fn().mockImplementation(() => {
      throw validationError;
    });

    const res = await request(app)
      .post("/deployment")
      .set("Authorization", "Bearer valid-token")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});