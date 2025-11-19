const request = require("supertest");
const express = require("express");
const path = require("path");
const fs = require("fs");

// MOCK http-proxy 
jest.mock("http-proxy", () => {
    const mockProxy = {
        web: jest.fn((req, res, opts) => {
            if (mockProxy._trigger403) {
                // Simulate proxy returning 403
                mockProxy.onCallbacks["proxyRes"]({ statusCode: 403 }, req, res);
            } else {
                res.status(200).send("Proxied Content");
            }
        }),
        onCallbacks: {},
        on: jest.fn(function (event, handler) {
            mockProxy.onCallbacks[event] = handler;
        }),
        _trigger403: false
    };
    return { createProxy: () => mockProxy };
});

// Load index.js mocks
let app;
let proxy;

beforeEach(() => {
    jest.resetModules();

    process.env.AWS_S3_BASE_URL = "http://mock-s3.local";
    process.env.PORT = 9999;

    proxy = require("http-proxy").createProxy();
    app = express();

    // mount our middleware
    const proxyMiddleware = require("../index.js");
    app.use(proxyMiddleware);
});

describe("Reverse Proxy Server Tests", () => {

    test("✔ Should rewrite any path to `/`", async () => {
        const res = await request(app)
            .get("/random-route")
            .set("Host", "proj.example.com");

        expect(res.text).toBe("Proxied Content");
        expect(proxy.web).toHaveBeenCalled();
    });

    test("✔ Should forward request to S3 bucket using subdomain", async () => {
        await request(app)
            .get("/")
            .set("Host", "project123.example.com");

        const lastCall = proxy.web.mock.calls[0];
        const opts = lastCall[2];

        expect(opts.target).toBe("http://mock-s3.local/project123");
    });

    test("✔ Should append index.html when url='/'", async () => {
        await request(app)
            .get("/")
            .set("Host", "demo.example.com");

        const onCall = proxy.on.mock.calls.find(([event]) => event === "proxyReq");
        expect(onCall).toBeTruthy();
    });

    test("Should serve custom-index.html when S3 returns 403", async () => {
        // enable 403 simulation
        proxy._trigger403 = true;

        const htmlPath = path.join(__dirname, "..", "public", "custom-index.html");
        const expectedHtml = fs.readFileSync(htmlPath, "utf-8");

        const res = await request(app)
            .get("/")
            .set("Host", "proj.example.com");

        expect(res.status).toBe(200);
        expect(res.text.trim()).toBe(expectedHtml.trim());
    });

    test("Should fail if no subdomain is provided", async () => {
        const res = await request(app)
            .get("/")
            .set("Host", "localhost"); // no subdomain

        expect(proxy.web).toHaveBeenCalled();
        expect(res.text).toBe("Proxied Content");
    });

    test("Should not break when invalid hostname format is used", async () => {
        const res = await request(app)
            .get("/")
            .set("Host", "invalidhost");

        expect(proxy.web).toHaveBeenCalled();
        expect(res.text).toBe("Proxied Content");
    });
});
