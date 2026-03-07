import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "../utils/appError.js";

const uploadsFolder = path.join(process.cwd(), "uploads", "users");

const ensureUploadsFolderExists = () => {
    if (!fs.existsSync(uploadsFolder)) {
        fs.mkdirSync(uploadsFolder, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadsFolderExists();
        cb(null, uploadsFolder);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`;
        cb(null, fileName);
    },
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new AppError("Only image files are allowed.", 400), false);
    }
    cb(null, true);
};

export const uploadProfilePicture = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
}).single("profilePicture");
