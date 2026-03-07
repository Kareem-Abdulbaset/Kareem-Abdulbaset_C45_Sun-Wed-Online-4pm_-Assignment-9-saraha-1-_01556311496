import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./DB/connectionDB.js";
import userRouter from "./DB/Modules/user/user.controller.js";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { AppError } from "./utils/appError.js";
import { generateKeyPair } from "./utils/encryption.js";

const app = express();
let port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function bootstrap() {

    generateKeyPair();

    app.use(express.json());
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    app.get("/", (req, res) => {
        res.send("Hello World!");
    });

    app.use("/users", userRouter);

    connectDB();

    app.use("/{*path}", (req, res, next) => {
        next(new AppError(`Url ${req.originalUrl} not found`, 404));
    });

    app.use(globalErrorHandler);

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
