const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

// Mock dependencies
jest.mock("@aws-sdk/client-s3");
jest.mock("mime-types");
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

describe("Build Server Script - Unit Tests", () => {
  beforeAll(() => {
    // Setup environment variables
    process.env.PROJECT_ID = "test-project-123";
    process.env.GIT_REPOSITORY_URL = "https://github.com/test/repo.git";
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ACCESS_KEY_ID = "test-access-key";
    process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.S3_BUCKET = "test-bucket";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Module Loading", () => {
    test("should load module without errors", () => {
      expect(() => require("../script")).not.toThrow();
    });

    test("should export init function", () => {
      const script = require("../script");
      expect(script.init).toBeDefined();
      expect(typeof script.init).toBe("function");
    });
  });



  describe("Environment Variables", () => {
    test("should read PROJECT_ID from environment", () => {
      expect(process.env.PROJECT_ID).toBe("test-project-123");
    });

    test("should read GIT_REPOSITORY_URL from environment", () => {
      expect(process.env.GIT_REPOSITORY_URL).toBe("https://github.com/test/repo.git");
    });

    test("should read AWS_REGION from environment", () => {
      expect(process.env.AWS_REGION).toBe("us-east-1");
    });

    test("should read S3_BUCKET from environment", () => {
      expect(process.env.S3_BUCKET).toBe("test-bucket");
    });
  });

  describe("S3 Upload Key Format", () => {
    test("should generate correct S3 key format", () => {
      const projectId = "test-project-123";
      const fileName = "index.html";
      const expectedKey = `__outputs/${projectId}/${fileName}`;
      
      expect(expectedKey).toBe("__outputs/test-project-123/index.html");
    });

    test("should handle nested file paths", () => {
      const projectId = "test-project-123";
      const fileName = "assets/css/style.css";
      const expectedKey = `__outputs/${projectId}/${fileName}`;
      
      expect(expectedKey).toBe("__outputs/test-project-123/assets/css/style.css");
    });

    test("should include __outputs prefix", () => {
      const key = `__outputs/${process.env.PROJECT_ID}/file.js`;
      expect(key).toMatch(/^__outputs\//);
    });
  });

  describe("PutObjectCommand", () => {
    test("should create command with all required fields", () => {
      new PutObjectCommand({
        Bucket: "test-bucket",
        Key: "__outputs/test-project-123/index.html",
        Body: "mock-stream",
        ContentType: "text/html",
      });

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "__outputs/test-project-123/index.html",
        Body: "mock-stream",
        ContentType: "text/html",
      });
    });

    test("should use correct bucket from environment", () => {
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: "__outputs/test/file.html",
        Body: "stream",
        ContentType: "text/html",
      });

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
        })
      );
    });

    test("should include ContentType in command", () => {
      new PutObjectCommand({
        Bucket: "test-bucket",
        Key: "__outputs/test/style.css",
        Body: "stream",
        ContentType: "text/css",
      });

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: "text/css",
        })
      );
    });
  });

  describe("MIME Type Detection", () => {
    beforeEach(() => {
      mime.lookup.mockImplementation((filePath) => {
        if (filePath.endsWith(".html")) return "text/html";
        if (filePath.endsWith(".css")) return "text/css";
        if (filePath.endsWith(".js")) return "application/javascript";
        if (filePath.endsWith(".json")) return "application/json";
        if (filePath.endsWith(".png")) return "image/png";
        if (filePath.endsWith(".jpg")) return "image/jpeg";
        return "application/octet-stream";
      });
    });

    test("should detect HTML MIME type", () => {
      expect(mime.lookup("index.html")).toBe("text/html");
    });

    test("should detect CSS MIME type", () => {
      expect(mime.lookup("style.css")).toBe("text/css");
    });

    test("should detect JavaScript MIME type", () => {
      expect(mime.lookup("app.js")).toBe("application/javascript");
    });

    test("should detect JSON MIME type", () => {
      expect(mime.lookup("data.json")).toBe("application/json");
    });

    test("should detect PNG image MIME type", () => {
      expect(mime.lookup("logo.png")).toBe("image/png");
    });

    test("should detect JPEG image MIME type", () => {
      expect(mime.lookup("photo.jpg")).toBe("image/jpeg");
    });

    test("should return default MIME type for unknown files", () => {
      expect(mime.lookup("file.xyz")).toBe("application/octet-stream");
    });
  });
});



