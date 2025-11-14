const express = require("express");
const httpProxy = require("http-proxy");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

const BASE_PATH = process.env.AWS_S3_BASE_URL;
const proxy = httpProxy.createProxy();

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split(".")[0];

    const resolvesTo = `${BASE_PATH}/${subdomain}`;

    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
    const url = req.url;
    if (url === "/") proxyReq.path += "index.html";
});

module.exports = app;

module.exports = app;

// Start server only if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`));
}