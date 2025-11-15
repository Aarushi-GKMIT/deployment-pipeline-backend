require('dotenv').config();
const express = require("express");
const httpProxy = require("http-proxy");

const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.AWS_S3_BASE_URL || "http://localhost:4566"; 


function getSubdomain(hostname) {
    if (!hostname || typeof hostname !== "string") return null;

    const parts = hostname.split(".");
    if (parts.length < 2) return null; 

    return parts[0];
}


 // Create Express app with reverse proxy
 
function createApp() {
    const app = express();
    const proxy = httpProxy.createProxy();

    // Middleware for proxying requests to S3
    app.use((req, res) => {
        try {
            const subdomain = getSubdomain(req.hostname);

            if (!subdomain) {
                res.status(400).send("Invalid hostname or subdomain");
                return;
            }

            const target = `${BASE_PATH}/${subdomain}`;
            proxy.web(req, res, { target, changeOrigin: true });
        } catch (err) {
            console.error("Proxy error:", err);
            res.status(500).send("Internal server error");
        }
    });


    proxy.on("proxyReq", (proxyReq, req) => {
        if (req.url === "/") {
            proxyReq.path += "index.html";
        }
    });

    return app;
}


// Start the server
 
function startServer() {
    const app = createApp();
    app.listen(PORT, () => {
        console.log(`Reverse Proxy Running on port ${PORT}`);
    });
}

// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}

// Export functions for testing
module.exports = { createApp, startServer, getSubdomain };
