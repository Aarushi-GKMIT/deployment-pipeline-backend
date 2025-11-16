const deploymentService = require("../services/deployment.service");
const createDeploymentSchema = require("../validators/deployment/createDeployment.validator");

const createDeployment = async (req, res, next) => {
    try {
        const parsedBody = createDeploymentSchema.parse(req.body);
        const data = { ...parsedBody, userId: req.user.id };

        const result = await deploymentService.createDeployment(data);

        res.status(201).json({
            message: "Deployment created successfully",
            ...result,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { createDeployment };