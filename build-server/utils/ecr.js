require("dotenv").config();
const { execSync } = require("child_process");

const region = process.env.AWS_REGION;
const account = process.env.AWS_ACCOUNT_ID;
const repo = process.env.ECR_REPO_NAME;

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

if (process.argv[2] === "login") {
  run(`aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${account}.dkr.ecr.${region}.amazonaws.com`);
}

if (process.argv[2] === "build") {
  run(`docker build -t ${repo} .`);
}

if (process.argv[2] === "tag") {
  run(`docker tag ${repo}:latest ${account}.dkr.ecr.${region}.amazonaws.com/${repo}:latest`);
}

if (process.argv[2] === "push") {
  run(`docker push ${account}.dkr.ecr.${region}.amazonaws.com/${repo}:latest`);
}