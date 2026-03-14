import fs from "fs";
import path from "path";
import multer from "multer";

export const multer_local = ({ custom_types } = {}) => {
    const destinationDir = path.join("uploads", "General");

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                if (!fs.existsSync(destinationDir)) {
                    fs.mkdirSync(destinationDir, { recursive: true });
                }
            } catch {
                // if directory creation fails, let multer handle the error
            }
            cb(null, destinationDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + "_" + file.originalname);
        }
    });

    const fileFilter =
        Array.isArray(custom_types) && custom_types.length > 0
            ? (req, file, cb) => {
                  if (custom_types.includes(file.mimetype)) {
                      cb(null, true);
                  } else {
                      cb(new Error("Invalid file type"), false);
                  }
              }
            : undefined;

    const upload = multer({
        storage,
        ...(fileFilter && { fileFilter })
    });

    return upload;
};
