
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
require('dotenv').config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const PROJECT_ID = process.env.PROJECT_ID;


async function init() {
    console.log("Executing script.js");
    const outDirPath = path.join(__dirname, "output");

    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    p.stdout.on("data", function (data) {
        console.log(data.toString());
    });

    p.stdout.on("error", function (data) {
        console.log("Error", data.toString());
    });

    p.on("close", async function () {
        console.log("Build Complete");
        const distFolderPath = path.join(__dirname, "output", "dist");
        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true });

        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file);
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log("uploading", filePath);

            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath), // dynamically it will give content type of the file using its filepath
            });

            await s3Client.send(command); // from this command the data files will start getting pushed in S3 Bucket
            console.log("uploaded", filePath);
        }
        console.log("Done...");
        process.exit(0);
    });
}

module.exports = { init };
