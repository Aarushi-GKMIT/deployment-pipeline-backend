# Deployment Pipeline Platform Backend

##  Setup

### Clone the repository

```bash
git clone https://github.com/Aarushi-GKMIT/deployment-pipeline-platform-backend.git
cd deployment-pipeline-platform-backend
```

### Install Dependencies

```bash
cd api-server && npm install
cd ../s3-proxy-server && npm install
cd ../build-server && npm install
cd ..
```

### Install Jest (for testing)

```bash
npm install --save-dev jest
```

### How to Run Each Service

**Run API Server**
```bash
cd api-server
node index.js
```

**Run Build Server**
```bash
cd build-server
# AWS build, tag and push commands
```

**Run S3 Proxy Server**
```bash
cd s3-proxy-server
node index.js
```

### Running Tests

```bash
npm test
```
