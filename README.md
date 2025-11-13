# Deployment Pipeline Platform Backend

## Folder Structure

```
<<<<<<< Updated upstream
deployment-pipeline-platform-backend/
├── api-server/            
│   ├── src/                
│   ├── .env                 
│   ├── package.json
│   └── ...
│
├── s3-proxy-server/       
│   ├── index.js
│   ├── utils/
│   ├── .env
│   ├── package.json
│   └── ...
│
├── build-server/           
│   ├── Dockerfile
│   ├── index.js
│   ├── .env
│   ├── package.json
│   └── ...
│
├── test/                    
│   └── sample.test.js      
│
├── package.json             
└── README.md
=======
Directory structure:
└── deployment-pipeline-platform-backend/
    ├── README.md
    ├── api-server/
    │   ├── controllers/
    │   │   └── authController.js
    │   ├── index.js
    │   ├── middleware/
    │   │   └── auth.middleware.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── prisma/
    │   │   ├── migrations/

    │   │   ├── models/
    │   │   │   ├── deployment.prisma
    │   │   │   ├── project.prisma
    │   │   │   └── user.prisma
    │   │   ├── schema.prisma
    │   │   └── seeders/

    │   ├── routes/
    │   │   ├── deploy.js
    │   │   ├── login.js
    │   │   ├── project.js
    │   │   └── signup.js
    │   ├── services/
    │   │   └── authService.js
    │   ├── test/
    │   │   └── sample.test.js
    │   ├── utils/
    │   │   └── authUtil.js
    │   └── views/
    │       └── login.js
    ├── build-server/
    │   ├── Dockerfile
    │   ├── script.js
    │   └── test/

    └── s3-proxy-server/
        ├── index.js
        └── test/
>>>>>>> Stashed changes
```

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