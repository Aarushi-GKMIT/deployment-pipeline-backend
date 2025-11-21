const jestMock = require("jest-mock");

// MOCKS

// Mock express
const mockUse = jest.fn();
const mockListen = jest.fn((port, cb) => cb && cb());
jest.mock("express", () => {
  return jest.fn(() => ({
    use: mockUse,
    listen: mockListen,
  }));
});

// Mock http-proxy
const mockWeb = jest.fn();
const mockOn = jest.fn();
jest.mock("http-proxy", () => ({
  createProxy: jest.fn(() => ({
    web: mockWeb,
    on: mockOn,
  })),
}));


// Load module after mocks

jest.resetModules();
const { createApp, startServer, getSubdomain } = require("../index");

describe("S3 Reverse Proxy - Modular Tests", () => {
  let consoleSpy;

  beforeEach(() => {
    // Reset mocks
    mockUse.mockClear();
    mockListen.mockClear();
    mockWeb.mockClear();
    mockOn.mockClear();

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

 
  // Positive Test Cases

  test("getSubdomain should extract correct subdomain", () => {
    expect(getSubdomain("test.example.com")).toBe("test");
    expect(getSubdomain("abc.domain.co")).toBe("abc");
  });

  test("createApp should create express app and register middleware", () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(mockUse).toHaveBeenCalled();
    expect(mockOn).toHaveBeenCalledWith("proxyReq", expect.any(Function));
  });

  test("middleware should call proxy.web with correct target", () => {
    const app = createApp();
    const middleware = mockUse.mock.calls[0][0];

    const req = { hostname: "test.example.com", url: "/file.txt" };
    const res = {};
    middleware(req, res);

    expect(mockWeb).toHaveBeenCalledWith(req, res, expect.objectContaining({
      target: expect.stringContaining("test"),
      changeOrigin: true,
    }));
  });

  test("middleware should append index.html for root requests", () => {
    const app = createApp();
    const middleware = mockUse.mock.calls[0][0];
    const req = { hostname: "test.example.com", url: "/" };
    const res = {};
    const proxyReq = { path: "" };

    middleware(req, res);
    const proxyListener = mockOn.mock.calls.find(call => call[0] === "proxyReq")[1];
    proxyListener(proxyReq, req);

    expect(proxyReq.path).toContain("index.html");
  });

  test("startServer should call app.listen and log startup message", () => {
    startServer();
    expect(mockListen).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Reverse Proxy Running"));
  });


  // Negative Test Cases
 

  test("getSubdomain should return null for invalid hostnames", () => {
    expect(getSubdomain("localhost")).toBeNull();
    expect(getSubdomain("")).toBeNull();
    expect(getSubdomain(null)).toBeNull();
    expect(getSubdomain(undefined)).toBeNull();
  });

  test("middleware should return 400 for invalid subdomain", () => {
    const app = createApp();
    const middleware = mockUse.mock.calls[0][0];

    const req = { hostname: "localhost" }; // Invalid subdomain
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    middleware(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid hostname or subdomain");
  });

  test("middleware should return 500 if proxy.web throws error", () => {
    const app = createApp();
    const middleware = mockUse.mock.calls[0][0];

    mockWeb.mockImplementationOnce(() => { throw new Error("Proxy failed"); });

    const req = { hostname: "test.example.com", url: "/file.txt" };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    middleware(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Internal server error");
  });
});
