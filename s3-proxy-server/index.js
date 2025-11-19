const express = require("express");
const httpProxy = require("http-proxy");
const path = require("path");
require("dotenv").config();

const app = express();
const proxy = httpProxy.createProxy();

const BASE_PATH = process.env.AWS_S3_BASE_URL;
const PORT = process.env.PORT;

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split(".")[0];

    if (req.url !== "/") req.url = "/";

    const resolvesTo = `${BASE_PATH}/${subdomain}`;

    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
    if (req.url === "/") proxyReq.path += "index.html";
});

proxy.on("proxyRes", (proxyRes, req, res) => {
    if (proxyRes.statusCode === 403) {
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end(
            require("fs").readFileSync(path.join(__dirname, "public", "custom-index.html"), "utf-8")
        );
    }
});


module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Reverse Proxy Running on ${PORT}`));
}







