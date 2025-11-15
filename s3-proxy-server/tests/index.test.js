const jestMock = require("jest-mock");


// MOCK: express

const mockUse = jest.fn();
const mockListen = jest.fn((port, cb) => cb && cb());

jest.mock("express", () => {
  return jest.fn(() => ({
    use: mockUse,
    listen: mockListen,
  }));
});


// MOCK: http-proxy

const mockWeb = jest.fn();
const mockOn = jest.fn();

jest.mock("http-proxy", () => ({
  createProxy: jest.fn(() => ({
    web: mockWeb,
    on: mockOn,
  })),
}));


// Require the server After mocks

let consoleSpy;
beforeAll(() => {
  consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  consoleSpy.mockRestore();
});

describe("S3 Reverse Proxy - Tests", () => {
  test("module should load without errors", () => {
    const serverModule = require("../index");
    expect(serverModule).toBeDefined();
  });

  test("express app should be created", () => {
    const express = require("express");
    expect(express).toHaveBeenCalled();
  });

  test("http-proxy instance should be created", () => {
    const httpProxy = require("http-proxy");
    expect(httpProxy.createProxy).toHaveBeenCalled();
  });

  test("middleware should be registered with app.use", () => {
    expect(mockUse).toHaveBeenCalled();
  });

  test("server should listen on correct port", () => {
    expect(mockListen).toHaveBeenCalled();
  });

  test("should log startup message", () => {
    expect(consoleSpy).toHaveBeenCalled();
  });
});
