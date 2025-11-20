const projectService = require("../services/project.service");
const createProjectSchema = require("../validators/project/createProject.validator");

const createProject = async (req, res, next) => {
    try {
        const parsedBody = createProjectSchema.parse(req.body);
        const data = { ...parsedBody, userId: req.user.id };

        const project = await projectService.createProject(data); // { projectId: }

        res.status(201).json({ message: "Project created successfully", project });
    } catch (err) {
        next(err);
    }
};

module.exports = { createProject };
