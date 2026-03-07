import { AppError } from "../utils/appError.js";

export const authorization = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError("Please login first.", 401));
        }

        if (!allowedRoles.length) {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError("You are not allowed to access this route.", 403));
        }

        next();
    };
};
