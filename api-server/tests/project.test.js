const request = require("supertest");
const express = require("express");

// Mock middlewares - corrected paths
jest.mock("../src/middlewares/auth.middleware", () =>
  jest.fn((req, res, next) => {
    req.user = { id: 1, role: "ADMIN" };
    next();
  })
);

jest.mock("../src/middlewares/isAdmin.middleware", () =>
  jest.fn((req, res, next) => next())
);

// Mock service - corrected path
jest.mock("../src/services/project.service", () => ({
  createProject: jest.fn(),
}));

const projectService = require("../src/services/project.service");
const projectRoutes = require("../src/routes/project.routes");

describe("Project Route - Create Project", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/project", projectRoutes);
    jest.clearAllMocks();
  });

  // Positive Test
  test("Should create project successfully (ADMIN user)", async () => {
    projectService.createProject.mockResolvedValue({ projectId: 10 });

    const res = await request(app)
      .post("/project")
      .send({
        name: "My Project",
        gitUrl: "https://github.com/sample/repo",
        adminGithubToken: "valid-token",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("project");
    expect(res.body.project.projectId).toBe(10);
  });

  // Negative Test — Missing token / auth
  test("Should return 401 when user not authenticated", async () => {
    const authMiddleware = require("../src/middlewares/auth.middleware");
    authMiddleware.mockImplementationOnce((req, res, next) =>
      res.status(401).json({ message: "Not authenticated" })
    );

    const res = await request(app)
      .post("/project")
      .send({
        name: "Project Fail",
        gitUrl: "https://github.com/sample/repo",
        adminGithubToken: "abc",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Not authenticated");
  });

  // Negative Test — Not Admin
  test("Should return 403 when user is not admin", async () => {
    const adminMiddleware = require("../src/middlewares/isAdmin.middleware");
    adminMiddleware.mockImplementationOnce((req, res, next) =>
      res.status(403).json({ message: "Access denied — admin only" })
    );

    const res = await request(app)
      .post("/project")
      .send({
        name: "Proj",
        gitUrl: "https://github.com/sample/repo",
        adminGithubToken: "abc",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Access denied — admin only");
  });
});
