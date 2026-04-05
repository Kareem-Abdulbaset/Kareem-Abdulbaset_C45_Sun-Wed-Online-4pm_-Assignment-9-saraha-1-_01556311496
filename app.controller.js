import "dotenv/config";
import express from "express";
import path from "path";
import connectDB from "./DB/db.service.js";
import userRouter from "./modules/users/user.controller.js";
import { generateKeyPair } from "./security/encryption.js";

const app = express();
const port = process.env.PORT || 3000;

export default function bootstrap() {
    generateKeyPair();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

    app.get("/", (req, res) => {
        res.status(200).json({ message: "Saraha API is running" });
    });

    app.use("/users", userRouter);

    app.use("/{*path}", (req, res) => {
        res.status(404).json({ message: `Url ${req.originalUrl} not found` });
    });

    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(statusCode).json({
            message,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack })
        });
    });

    connectDB();

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
