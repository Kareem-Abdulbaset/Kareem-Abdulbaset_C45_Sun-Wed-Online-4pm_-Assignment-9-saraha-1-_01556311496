export const successResponse = ({ res, status = 200, message = "success", data = {} }) => {
    return res.status(status).json({ message, ...data });
};
