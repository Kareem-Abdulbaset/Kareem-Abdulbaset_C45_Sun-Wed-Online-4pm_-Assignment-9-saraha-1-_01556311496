import fs from "fs/promises";
import path from "path";

export const deleteLocalFile = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
};

export const isLocalUploadValue = (value) => {
    return typeof value === "string" && value.startsWith("/uploads/");
};

export const resolveUploadPathFromValue = (value) => {
    if (!isLocalUploadValue(value)) return null;
    const normalized = value.replace(/^\/+/, "").replace(/\//g, path.sep);
    return path.join(process.cwd(), normalized);
};
