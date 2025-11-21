const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

// Mock all dependencies
jest.mock("child_process");
jest.mock("fs");
jest.mock("@aws-sdk/client-s3");
jest.mock("mime-types");
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

describe("Build Server Script - Integration Tests", () => {
  let mockS3Send;
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

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
    // Mock S3Client
    mockS3Send = jest.fn().mockResolvedValue({});
    S3Client.mockImplementation(() => ({
      send: mockS3Send,
    }));

    // Mock console
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    // Mock process.exit to prevent test termination
    processExitSpy = jest.spyOn(process, "exit").mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe("Git Clone Operation", () => {
    test("should handle git clone failure", (done) => {
      const cloneError = new Error("Git clone failed");
      
      exec.mockImplementation((cmd, callback) => {
        process.nextTick(() => callback(cloneError));
        return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
      });

      const { init } = require("../script");
      
      init().catch((err) => {
        expect(err).toBe(cloneError);
        expect(consoleLogSpy).toHaveBeenCalledWith("Starting Build Server...");
        expect(consoleLogSpy).toHaveBeenCalledWith("Cloning repository...");
        done();
      });
    });

    test("should use correct git repository URL", (done) => {
      exec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain(process.env.GIT_REPOSITORY_URL);
        process.nextTick(() => callback(null));
        return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
      });

      const { init } = require("../script");
      init().catch(() => {});

      setTimeout(() => {
        expect(exec).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe("Build Operation", () => {
    test("should run npm install and build", (done) => {
      let buildProcessCreated = false;

      exec.mockImplementation((cmd, callback) => {
        if (callback) {
          // Git clone
          process.nextTick(() => callback(null));
          return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
        } else {
          // Build process
          buildProcessCreated = true;
          return {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn((event, cb) => {
              if (event === "close") {
                process.nextTick(() => cb(0));
              }
            }),
          };
        }
      });

      fs.readdirSync.mockReturnValue([]);

      const { init } = require("../script");
      init().catch(() => {});

      setTimeout(() => {
        expect(buildProcessCreated).toBe(true);
        expect(consoleLogSpy).toHaveBeenCalledWith("Installing dependencies and building...");
        done();
      }, 150);
    });

    test("should log build stdout output", (done) => {
      const buildOutput = "npm install successful";

      exec.mockImplementation((cmd, callback) => {
        if (callback) {
          process.nextTick(() => callback(null));
          return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
        } else {
          return {
            stdout: {
              on: jest.fn((event, cb) => {
                if (event === "data") {
                  process.nextTick(() => cb(buildOutput));
                }
              }),
            },
            stderr: { on: jest.fn() },
            on: jest.fn((event, cb) => {
              if (event === "close") {
                process.nextTick(() => cb(0));
              }
            }),
          };
        }
      });

      fs.readdirSync.mockReturnValue([]);

      const { init } = require("../script");
      init().catch(() => {});

      setTimeout(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(buildOutput);
        done();
      }, 150);
    });

    test("should log build stderr errors", (done) => {
      const errorOutput = "Build warning";

      exec.mockImplementation((cmd, callback) => {
        if (callback) {
          process.nextTick(() => callback(null));
          return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
        } else {
          return {
            stdout: { on: jest.fn() },
            stderr: {
              on: jest.fn((event, cb) => {
                if (event === "data") {
                  process.nextTick(() => cb(errorOutput));
                }
              }),
            },
            on: jest.fn((event, cb) => {
              if (event === "close") {
                process.nextTick(() => cb(0));
              }
            }),
          };
        }
      });

      fs.readdirSync.mockReturnValue([]);

      const { init } = require("../script");
      init().catch(() => {});

      setTimeout(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", errorOutput);
        done();
      }, 150);
    });

    test("should complete build successfully", (done) => {
      exec.mockImplementation((cmd, callback) => {
        if (callback) {
          process.nextTick(() => callback(null));
          return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
        } else {
          return {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn((event, cb) => {
              if (event === "close") {
                process.nextTick(() => cb(0));
              }
            }),
          };
        }
      });

      fs.readdirSync.mockReturnValue([]);

      const { init } = require("../script");
      init().catch(() => {});

      setTimeout(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith("Build Complete");
        done();
      }, 150);
    });
  });

  describe("S3 Upload Operation", () => {
    test("should use correct S3 bucket and key format", (done) => {
      exec.mockImplementation((cmd, callback) => {
        if (callback) {
          process.nextTick(() => callback(null));
          return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
        } else {
          return {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn((event, cb) => {
              if (event === "close") {
                process.nextTick(() => cb(0));
              }
            }),
          };
        }
      });

      fs.readdirSync.mockReturnValue(["index.html"]);
      fs.lstatSync.mockReturnValue({ isDirectory: () => false });
      fs.createReadStream.mockReturnValue("mock-stream");
      mime.lookup.mockReturnValue("text/html");

      const { init } = require("../script");
      init().catch(() => {});

      setTimeout(() => {
        expect(PutObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: "__outputs/test-project-123/index.html",
          Body: "mock-stream",
          ContentType: "text/html",
        });
        done();
      }, 200);
    });

    test("should set correct ContentType for uploaded files", (done) => {
      exec.mockImplementation((cmd, callback) => {
        if (callback) {
          process.nextTick(() => callback(null));
          return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
        } else {
          return {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn((event, cb) => {
              if (event === "close") {
                process.nextTick(() => cb(0));
              }
            }),
          };
        }
      });

      fs.readdirSync.mockReturnValue(["style.css"]);
      fs.lstatSync.mockReturnValue({ isDirectory: () => false });
      fs.createReadStream.mockReturnValue("mock-stream");
      mime.lookup.mockImplementation((file) => {
        if (file.endsWith(".css")) return "text/css";
        return "application/octet-stream";
      });

      const { init } = require("../script");
      init().catch(() => {});

      setTimeout(() => {
        expect(PutObjectCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            ContentType: "text/css",
          })
        );
        done();
      }, 200);
    });

    test("should exit with code 0 after successful upload", (done) => {
      exec.mockImplementation((cmd, callback) => {
        if (callback) {
          process.nextTick(() => callback(null));
          return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
        } else {
          return {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn((event, cb) => {
              if (event === "close") {
                process.nextTick(() => cb(0));
              }
            }),
          };
        }
      });

      fs.readdirSync.mockReturnValue(["index.html"]);
      fs.lstatSync.mockReturnValue({ isDirectory: () => false });
      fs.createReadStream.mockReturnValue("mock-stream");
      mime.lookup.mockReturnValue("text/html");

      const { init } = require("../script");
      init().catch(() => {});

      setTimeout(() => {
        expect(processExitSpy).toHaveBeenCalledWith(0);
        done();
      }, 200);
    });
  });
});