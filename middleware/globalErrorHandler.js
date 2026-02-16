const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return {
        message: `Duplicate value '${value}' for field '${field}'. Please use another value.`,
        statusCode: 409,
    };
};

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    return {
        message: `Validation Error: ${errors.join(". ")}`,
        statusCode: 400,
    };
};

const handleCastError = (err) => {
    return {
        message: `Invalid value '${err.value}' for field '${err.path}'.`,
        statusCode: 400,
    };
};

export const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    const stack = err.stack;

    if (err.code === 11000) {
        const handled = handleDuplicateKeyError(err);
        statusCode = handled.statusCode;
        message = handled.message;
    }

    if (err.name === "ValidationError") {
        const handled = handleValidationError(err);
        statusCode = handled.statusCode;
        message = handled.message;
    }

    if (err.name === "CastError") {
        const handled = handleCastError(err);
        statusCode = handled.statusCode;
        message = handled.message;
    }

    res.status(statusCode).json({
        status: statusCode >= 500 ? "error" : "fail",
        message,
        ...(process.env.NODE_ENV === "development" && { stack }),
    });
};
