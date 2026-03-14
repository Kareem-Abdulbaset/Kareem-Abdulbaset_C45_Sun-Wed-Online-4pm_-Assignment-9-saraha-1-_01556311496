export const validation = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema(req.body);

        if (error) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.details.map((item) => item.message)
            });
        }

        req.body = value;
        next();
    };
};
