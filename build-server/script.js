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
const GIT_REPO = process.env.GIT_REPOSITORY_URL;

async function init() {
    console.log("Starting Build Server...");

    const outputPath = path.join(__dirname, "output");

    // 1. Clone the project inside /output
    console.log("Cloning repository...");
    await new Promise((resolve, reject) => {
        exec(`git clone ${GIT_REPO} ${outputPath}`, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });

    console.log("Repository cloned.");

    // 2. Install dependencies and build inside the output folder
    console.log("Installing dependencies and building...");
    const p = exec(`cd ${outputPath} && npm install && npm run build`);

    p.stdout.on("data", (data) => console.log(data.toString()));
    p.stderr?.on("data", (data) => console.error("Error:", data.toString()));

    p.on("close", async () => {
        console.log("Build Complete");

        const distFolderPath = path.join(outputPath, "dist");
        const files = fs.readdirSync(distFolderPath, { recursive: true });

        // 3. Upload files to S3
        for (const file of files) {
            const filePath = path.join(distFolderPath, file);
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log("Uploading:", filePath);

            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath),
            });

            await s3Client.send(command);
        }

        console.log("All files uploaded successfully.");
        process.exit(0);
    });
}

init();

