const axios = require("axios");

const checkRepoAccess = async (gitUrl, token) => {
    const repoPath = gitUrl.split("github.com/")[1].replace(".git", "");

    const res = await axios.get(`https://api.github.com/repos/${repoPath}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return res.status === 200;
};

module.exports = { checkRepoAccess };
