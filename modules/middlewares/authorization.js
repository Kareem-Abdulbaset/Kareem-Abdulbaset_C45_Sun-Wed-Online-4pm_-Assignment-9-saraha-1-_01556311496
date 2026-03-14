export const authorization = (...accessRoles) => {
    return (req, res, next) => {
        if (!req.authUser) {
            return res.status(401).json({ message: "Unauthorized user" });
        }

        if (!accessRoles.includes(req.authUser.role)) {
            return res.status(403).json({ message: "Forbidden account" });
        }

        next();
    };
};
