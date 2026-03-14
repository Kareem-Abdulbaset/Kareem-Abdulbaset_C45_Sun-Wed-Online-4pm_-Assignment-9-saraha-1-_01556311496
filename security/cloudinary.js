let cloudinaryInstance = null;

export const isCloudinaryConfigured = () => {
    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

const getCloudinary = async () => {
    if (cloudinaryInstance) {
        return cloudinaryInstance;
    }

    const { v2: cloudinary } = await import("cloudinary");

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    cloudinaryInstance = cloudinary;
    return cloudinaryInstance;
};

export const uploadToCloudinary = async (filePath, folder = "saraha/users") => {
    const cloudinary = await getCloudinary();
    return await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: "image",
    });
};

export const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    const cloudinary = await getCloudinary();
    await cloudinary.uploader.destroy(publicId);
};
