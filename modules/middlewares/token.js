import jwt from "jsonwebtoken";

export const ACCESS_SECRET_KEY =
    process.env.ACCESS_SECRET_KEY || process.env.JWT_SECRET || "saraha-access-secret";
export const REFRESH_SECRET_KEY =
    process.env.REFRESH_SECRET_KEY || "saraha-refresh-secret";

export const generateToken = ({
    payload = {},
    signature,
    secret_key,
    options = { expiresIn: "1d" }
} = {}) => {
    return jwt.sign(payload, signature || secret_key || ACCESS_SECRET_KEY, options);
};

export const verifyToken = ({
    token = "",
    signature,
    secret_key
} = {}) => {
    return jwt.verify(token, signature || secret_key || ACCESS_SECRET_KEY);
};
