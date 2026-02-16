
import { userModel } from "../../Models/user.model.js";
import * as dbRepo from "../../db.repo.js";
import asyncHandler from "express-async-handler";
import { AppError } from "../../../utils/appError.js";
import { sendOtpEmail, generateOtp } from "../../../utils/emailService.js";
import { encryptData, decryptData } from "../../../utils/encryption.js";

const signup = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, password, age, gender, phone } = req.body;

    const userExists = await dbRepo.findOne(userModel, { email });
    if (userExists) {
        return next(new AppError("User already exists", 409));
    }

    const { otp, otpExpiry } = generateOtp();

    let encryptedPhone = undefined;
    if (phone) {
        encryptedPhone = encryptData(phone);
    }

    const newUser = await dbRepo.createOne(userModel, {
        firstName,
        lastName,
        email,
        password,
        age,
        gender,
        phone: encryptedPhone,
        otp,
        otpExpiry,
        confirmed: false,
    });

    await sendOtpEmail(email, otp);

    res.status(201).json({
        message: "User created successfully. Please check your email for OTP verification.",
        user: {
            _id: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
        },
    });
});

const verifyOtp = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    const user = await dbRepo.findOne(userModel, { email });
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

    if (user.otp !== otp) {
        return next(new AppError("Invalid OTP", 400));
    }

    user.confirmed = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully ✅" });
});

const resendOtp = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await dbRepo.findOne(userModel, { email });
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

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP resent successfully. Please check your email." });
});

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const userExists = await dbRepo.findOne(userModel, { email, provider: "system" });
    if (!userExists) {
        return next(new AppError("User not found", 404));
    }

    if (!userExists.confirmed) {
        return next(new AppError("Please verify your email first", 403));
    }

    if (password !== userExists.password) {
        return next(new AppError("Invalid password", 401));
    }

    if (userExists.phone) {
        const decryptedPhone = decryptData(userExists.phone);
        userExists._doc.decryptedPhone = decryptedPhone;
    }

    res.status(200).json({ message: "User logged in successfully", userExists });
});


export { signup, login, verifyOtp, resendOtp };
