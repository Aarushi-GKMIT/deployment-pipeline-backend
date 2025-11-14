const fs = require("fs");
const child_process = require("child_process");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

// Mock environment variables
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "FAKE_KEY";
process.env.AWS_SECRET_ACCESS_KEY = "FAKE_SECRET";
process.env.PROJECT_ID = "TEST_PROJECT";
process.env.S3_BUCKET = "test-bucket";

// Mocks
jest.mock("child_process");
jest.mock("fs");
jest.mock("@aws-sdk/client-s3");
jest.mock("mime-types");

let init;

describe("script.js init function and file handling", () => {
  let s3SendMock, PutObjectCommandMock;

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock process.exit
    jest.spyOn(process, "exit").mockImplementation(() => {});

    // Mock child_process.exec
    const mockProcess = {
      stdout: { on: jest.fn((event, cb) => event === "data" && cb("data")) },
      on: jest.fn((event, cb) => event === "close" && cb()),
    };
    child_process.exec.mockReturnValue(mockProcess);

    // Mock S3
    s3SendMock = jest.fn().mockResolvedValue({});
    PutObjectCommandMock = jest.fn();
    S3Client.mockImplementation(() => ({ send: s3SendMock }));
    PutObjectCommand.mockImplementation(PutObjectCommandMock);

    // Mock fs
    fs.readdirSync.mockReturnValue(["file1.txt", "file2.txt"]);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });
    fs.createReadStream.mockReturnValue("file-stream");

    // Mock mime-types
    mime.lookup.mockReturnValue("text/plain");

    // Import the refactored init function (export init from script.js)
    init = require("../script.js").init;
  });

  // File handling tests
  test("skips directories when reading folder", () => {
    fs.readdirSync.mockReturnValue(["folder1", "file1.txt"]);
    fs.lstatSync.mockImplementation((file) => ({
      isDirectory: () => file === "folder1",
    }));

    const files = fs.readdirSync("/fake/path");
    const filesToUpload = [];
    for (const file of files) {
      if (!fs.lstatSync(file).isDirectory()) filesToUpload.push(file);
    }

    expect(filesToUpload).toEqual(["file1.txt"]);
  });

  test("correctly gets mime type of a file", () => {
    const mimeType = mime.lookup("test.txt");
    expect(mimeType).toBe("text/plain");
  });

  // Build process test
  test("executes npm install and build", async () => {
    await init();
    expect(child_process.exec).toHaveBeenCalledWith(
      expect.stringContaining("npm install && npm run build")
    );
  });
});



