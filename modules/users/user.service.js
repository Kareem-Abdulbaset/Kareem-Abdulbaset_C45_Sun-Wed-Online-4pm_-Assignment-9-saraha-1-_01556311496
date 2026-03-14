import fs from "fs";
import path from "path";
import { userModel } from "../../models/user.model.js";
import { roleTypes } from "../../common/enum/user.enum.js";
import { decryptData, encryptData } from "../../security/encryption.js";
import { generateToken } from "../middlewares/token.js";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const otpExpiryDate = () => new Date(Date.now() + 10 * 60 * 1000);

export const signup = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, age, gender, phone } = req.body;

        const profilePicture = req.files?.attachment?.[0]?.path;
        const coverPictures = Array.isArray(req.files?.attachments)
            ? req.files.attachments.map((file) => file.path)
            : [];

        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return res.status(409).json({ message: "User already exists" });
        }

        const otp = generateOtp();
        const otpExpiry = otpExpiryDate();

        const newUser = await userModel.create({
            firstName,
            lastName,
            email,
            password,
            age,
            gender,
            phone: phone ? encryptData(phone) : undefined,
            profilePicture,
            coverPictures,
            otp,
            otpExpiry,
            confirmed: false
        });

        res.status(201).json({
            message: "User created successfully. Verify OTP first.",
            user: {
                _id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email
            },
            otp
        });
    } catch (error) {
        next(error);
    }
};

export const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.confirmed) {
            return res.status(400).json({ message: "Email already verified" });
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ message: "No OTP found, resend OTP" });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: "OTP expired, resend OTP" });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.confirmed = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        next(error);
    }
};

export const resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.confirmed) {
            return res.status(400).json({ message: "Email already verified" });
        }

        user.otp = generateOtp();
        user.otpExpiry = otpExpiryDate();
        await user.save();

        res.status(200).json({
            message: "OTP resent successfully",
            otp: user.otp
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const userExists = await userModel.findOne({ email, provider: "system" });
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!userExists.confirmed) {
            return res.status(403).json({ message: "Verify your email first" });
        }

        if (password !== userExists.password) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = generateToken({
            payload: { id: userExists._id, email: userExists.email, role: userExists.role }
        });

        const userResponse = userExists.toObject();
        if (userResponse.phone) {
            userResponse.decryptedPhone = decryptData(userResponse.phone);
        }

        res.status(200).json({
            message: "User logged in successfully",
            token,
            user: userResponse
        });
    } catch (error) {
        next(error);
    }
};

export const uploadCoverPictures = async (req, res, next) => {
    try {
        const user = req.authUser;
        const existingCount = user.coverPictures?.length ?? 0;
        const newFiles = req.files?.attachments ?? [];
        const newCount = newFiles.length;
        const total = existingCount + newCount;

        if (total !== 2) {
            return res.status(400).json({
                message: "Cover pictures must be 2 in total. You have " + existingCount + " and uploaded " + newCount
            });
        }

        const newPaths = newFiles.map((f) => f.path);
        user.coverPictures = [...(user.coverPictures || []), ...newPaths];
        await user.save();

        res.status(200).json({
            message: "Cover pictures updated",
            coverPictures: user.coverPictures
        });
    } catch (error) {
        next(error);
    }
};

export const uploadProfilePicture = async (req, res, next) => {
    try {
        const user = req.authUser;
        const newPath = req.file?.path;

        if (!newPath) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        if (user.profilePicture) {
            if (!user.gallery) {
                user.gallery = [];
            }
            user.gallery.push(user.profilePicture);
        }

        user.profilePicture = newPath;
        await user.save();

        res.status(200).json({
            message: "Profile picture updated",
            profilePicture: user.profilePicture
        });
    } catch (error) {
        next(error);
    }
};

export const removeProfilePicture = async (req, res, next) => {
    try {
        const user = req.authUser;
        const oldPath = user.profilePicture;

        if (!oldPath) {
            return res.status(400).json({ message: "No profile picture to remove" });
        }

        const fullPath = path.join(process.cwd(), oldPath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        user.profilePicture = undefined;
        await user.save();

        res.status(200).json({ message: "Profile picture removed" });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        const profileId = req.params.id;
        const visitor = req.authUser;

        const user = await userModel.findById(profileId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.profileVisitCount = (user.profileVisitCount ?? 0) + 1;
        await user.save();

        const profile = user.toObject();
        if (profile.phone) {
            profile.decryptedPhone = decryptData(profile.phone);
        }
        if (visitor.role !== roleTypes.admin) {
            delete profile.profileVisitCount;
        }

        res.status(200).json({ profile });
    } catch (error) {
        next(error);
    }
};
