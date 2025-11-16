const errorHandler = (err, _, res, __) => {

    res.status(err.statusCode || 500).json({
        error: err.message || "Internal Server Error",
    });
};

module.exports = errorHandler;