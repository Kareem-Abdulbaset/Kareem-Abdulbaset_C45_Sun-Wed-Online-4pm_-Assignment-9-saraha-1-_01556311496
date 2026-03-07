import { userModel } from "../../models/user.model.js";
import * as dbRepo from "../../db.repo.js";
import asyncHandler from "express-async-handler";
import { AppError } from "../../../utils/appError.js";
import { sendOtpEmail, generateOtp } from "../../../utils/emailService.js";
import { encryptData, decryptData } from "../../../utils/encryption.js";
import { generateToken } from "../../../utils/token.js";
import {
    deleteLocalFile,
    isLocalUploadValue,
    resolveUploadPathFromValue,
} from "../../../utils/fileCleanup.js";
import {
    isCloudinaryConfigured,
    uploadToCloudinary,
    deleteFromCloudinary,
} from "../../../utils/cloudinary.js";

const sanitizeUser = (userDoc) => {
    const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete user.password;
    delete user.otp;
    delete user.otpExpiry;
    delete user.profilePicturePublicId;
    return user;
};

const cleanupOldProfilePicture = async (profilePicture, profilePicturePublicId) => {
    try {
        if (profilePicturePublicId) {
            await deleteFromCloudinary(profilePicturePublicId);
            return;
        }

        if (isLocalUploadValue(profilePicture)) {
            const oldFilePath = resolveUploadPathFromValue(profilePicture);
            await deleteLocalFile(oldFilePath);
        }
    } catch (error) {
    }
};

const signup = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, password, age, gender, phone } = req.body;
    const normalizedEmail = email.toLowerCase();

    const userExists = await dbRepo.findOne(userModel, { email: normalizedEmail });
    if (userExists) {
        return next(new AppError("User already exists", 409));
    }

    const { otp, otpExpiry } = generateOtp();

    let encryptedPhone;
    if (phone) {
        encryptedPhone = encryptData(phone);
    }

    const newUser = await dbRepo.createOne(userModel, {
        firstName,
        lastName,
        email: normalizedEmail,
        password,
        age,
        gender,
        phone: encryptedPhone,
        otp,
        otpExpiry,
        confirmed: false,
        provider: "system",
        role: "user",
    });

    await sendOtpEmail(normalizedEmail, otp);

    res.status(201).json({
        message: "User created successfully. Please check your email for OTP verification.",
        user: sanitizeUser(newUser),
    });
});

const verifyOtp = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await dbRepo.findOne(userModel, { email: normalizedEmail });
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    if (user.confirmed) {
        return next(new AppError("Email is already verified", 400));
    }

    if (!user.otp || !user.otpExpiry) {
        return next(new AppError("No OTP found. Please request a new one.", 400));
    }

    if (new Date() > user.otpExpiry) {
        return next(new AppError("OTP has expired. Please request a new one.", 400));
    }

    if (user.otp !== String(otp)) {
        return next(new AppError("Invalid OTP", 400));
    }

    user.confirmed = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
});

const resendOtp = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await dbRepo.findOne(userModel, { email: normalizedEmail });
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    if (user.confirmed) {
        return next(new AppError("Email is already verified", 400));
    }

    const { otp, otpExpiry } = generateOtp();

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOtpEmail(normalizedEmail, otp);

    res.status(200).json({ message: "OTP resent successfully. Please check your email." });
});

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await dbRepo.findOne(userModel, { email: normalizedEmail, provider: "system" });
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    if (!user.confirmed) {
        return next(new AppError("Please verify your email first", 403));
    }

    if (password !== user.password) {
        return next(new AppError("Invalid password", 401));
    }

    const safeUser = sanitizeUser(user);

    if (user.phone) {
        safeUser.decryptedPhone = decryptData(user.phone);
    }

    const token = generateToken({ id: user._id, role: user.role });

    res.status(200).json({
        message: "User logged in successfully",
        token,
        user: safeUser,
    });
});

const gmailLogin = asyncHandler(async (req, res, next) => {
    const { email, firstName, lastName, profilePicture } = req.body;
    const normalizedEmail = email.toLowerCase();

    const gmailRegex = /^[^\s@]+@gmail\.com$/i;
    if (!gmailRegex.test(normalizedEmail)) {
        return next(new AppError("Only Gmail accounts are allowed in this route.", 400));
    }

    let user = await dbRepo.findOne(userModel, { email: normalizedEmail });

    if (user && user.provider !== "google") {
        return next(new AppError("This email is registered with normal login. Please use /login.", 409));
    }

    if (!user) {
        user = await dbRepo.createOne(userModel, {
            firstName,
            lastName,
            email: normalizedEmail,
            provider: "google",
            confirmed: true,
            role: "user",
            profilePicture,
        });
    } else {
        user.firstName = firstName;
        user.lastName = lastName;
        if (profilePicture) {
            user.profilePicture = profilePicture;
        }
        user.confirmed = true;
        await user.save();
    }

    const token = generateToken({ id: user._id, role: user.role });

    res.status(200).json({
        message: "Gmail login successful",
        token,
        user: sanitizeUser(user),
    });
});

const updateProfilePicture = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError("profilePicture file is required.", 400));
    }

    const localUploadedPath = req.file.path;
    const oldProfilePicture = req.user.profilePicture;
    const oldProfilePicturePublicId = req.user.profilePicturePublicId;
    let uploadedCloudinaryFile = null;

    try {
        if (isCloudinaryConfigured()) {
            uploadedCloudinaryFile = await uploadToCloudinary(localUploadedPath);
            req.user.profilePicture = uploadedCloudinaryFile.secure_url;
            req.user.profilePicturePublicId = uploadedCloudinaryFile.public_id;
            await deleteLocalFile(localUploadedPath);
        } else {
            req.user.profilePicture = `/uploads/users/${req.file.filename}`;
            req.user.profilePicturePublicId = undefined;
        }

        await req.user.save();
    } catch (error) {
        try {
            await deleteLocalFile(localUploadedPath);
        } catch (cleanupError) {
        }

        if (uploadedCloudinaryFile?.public_id) {
            try {
                await deleteFromCloudinary(uploadedCloudinaryFile.public_id);
            } catch (cleanupError) {
            }
        }

        return next(error);
    }

    await cleanupOldProfilePicture(oldProfilePicture, oldProfilePicturePublicId);

    res.status(200).json({
        message: "Profile picture updated successfully",
        user: sanitizeUser(req.user),
    });
});

const getProfile = asyncHandler(async (req, res, next) => {
    const user = sanitizeUser(req.user);

    if (req.user.phone) {
        user.decryptedPhone = decryptData(req.user.phone);
    }

    res.status(200).json({
        message: "Profile fetched successfully",
        user,
    });
});

export { signup, login, verifyOtp, resendOtp, gmailLogin, updateProfilePicture, getProfile };
