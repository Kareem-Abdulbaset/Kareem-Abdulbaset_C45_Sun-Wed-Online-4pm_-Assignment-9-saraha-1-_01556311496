import { AppError } from "../utils/appError.js";
import { verifyToken } from "../utils/token.js";
import { userModel } from "../DB/models/user.model.js";

export const authentication = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(new AppError("Please login first. No token provided.", 401));
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return next(new AppError("Token is missing.", 401));
        }

        const decoded = verifyToken(token);

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return next(new AppError("User not found. Please signup again.", 401));
        }

        req.user = user;

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(new AppError("Token has expired. Please login again.", 401));
        }
        if (error.name === "JsonWebTokenError") {
            return next(new AppError("Invalid token. Please login again.", 401));
        }
        return next(new AppError("Authentication failed.", 401));
    }
};
