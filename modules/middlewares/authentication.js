import { userModel } from "../../models/user.model.js";
import { ACCESS_SECRET_KEY, verifyToken } from "./token.js";

export const authentication = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized user" });
        }

        const token = authorization.split(" ")[1];
        const decoded = verifyToken({ token, secret_key: ACCESS_SECRET_KEY });

        if (!decoded?.id) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Unauthorized user" });
        }

        req.authUser = user;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};
