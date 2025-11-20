require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const projectRoutes = require("./routes/project.routes");
const deploymentRoutes = require("./routes/deployment.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/deployment", deploymentRoutes);

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running at Port ${PORT}`));

module.exports = app;