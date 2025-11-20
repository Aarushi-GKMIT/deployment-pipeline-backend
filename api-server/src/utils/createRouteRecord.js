const { ChangeResourceRecordSetsCommand } = require("@aws-sdk/client-route-53");
const routeClient = require("../config/route53");

async function createRouteRecord(projectId) {
  try {
    const hostedZoneId = process.env.ROUTE53_HOSTED_ZONE_ID; // Route 53 hosted zone ID
    const domainName = process.env.ROUTE53_DOMAIN_NAME
    const TTL=process.env.ROUTE53_TTL
    const S3ProxyIP=process.env.S3_PROXY_PUBLIC_IP

    const params = {
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
            Changes: [
            {
                Action: "UPSERT", // can also be create or Delete
                ResourceRecordSet: {
                    Name: `${projectId}.${domainName}`, // subdomain
                    Type: "A", // record type
                    TTL: TTL, // Time to live
                    ResourceRecords: [
                    { Value: S3ProxyIP } // server IP
                    ],
                },
            }],
        },
    };
    const command = new ChangeResourceRecordSetsCommand(params);
    const response = await routeClient.send(command);
  } catch (err) {
    console.log(err);
  }
}

module.exports = createRouteRecord;
