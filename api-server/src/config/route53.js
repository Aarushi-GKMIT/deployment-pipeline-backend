const { Route53Client } = require("@aws-sdk/client-route-53");

const routeClient = new Route53Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }, 
});

module.exports = routeClient