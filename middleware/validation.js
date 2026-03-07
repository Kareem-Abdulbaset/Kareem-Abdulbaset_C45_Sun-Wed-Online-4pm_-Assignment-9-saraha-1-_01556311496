import { AppError } from "../utils/appError.js";

const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isGmail = (email) => {
    const gmailRegex = /^[^\s@]+@gmail\.com$/i;
    return gmailRegex.test(email);
};

const isGenderValid = (gender) => {
    return ["male", "female"].includes(gender);
};

const isPasswordValid = (password) => {
    return typeof password === "string" && password.trim().length >= 6;
};

const validateRequiredString = (value, fieldName, next, minLength = 1) => {
    if (typeof value !== "string" || value.trim().length < minLength) {
        next(new AppError(`${fieldName} is required and must be at least ${minLength} characters.`, 400));
        return false;
    }
    return true;
};

export const validateSignup = (req, res, next) => {
    const { firstName, lastName, email, password, gender, age, phone } = req.body;

    if (!validateRequiredString(firstName, "firstName", next, 3)) return;
    if (!validateRequiredString(lastName, "lastName", next, 3)) return;

    if (!email || !isEmailValid(email)) {
        return next(new AppError("Valid email is required.", 400));
    }

    if (!isPasswordValid(password)) {
        return next(new AppError("Password must be at least 6 characters.", 400));
    }

    if (!gender || !isGenderValid(gender)) {
        return next(new AppError("Gender must be either male or female.", 400));
    }

    if (age !== undefined && (typeof age !== "number" || age < 0)) {
        return next(new AppError("Age must be a positive number.", 400));
    }

    if (phone !== undefined && typeof phone !== "string") {
        return next(new AppError("Phone must be a string.", 400));
    }

    next();
};

export const validateVerifyOtp = (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !isEmailValid(email)) {
        return next(new AppError("Valid email is required.", 400));
    }

    if (!otp || !/^\d{6}$/.test(String(otp))) {
        return next(new AppError("OTP must be 6 digits.", 400));
    }

    next();
};

export const validateResendOtp = (req, res, next) => {
    const { email } = req.body;

    if (!email || !isEmailValid(email)) {
        return next(new AppError("Valid email is required.", 400));
    }

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !isEmailValid(email)) {
        return next(new AppError("Valid email is required.", 400));
    }

    if (!isPasswordValid(password)) {
        return next(new AppError("Password must be at least 6 characters.", 400));
    }

    next();
};

export const validateGmailLogin = (req, res, next) => {
    const { email, firstName, lastName, profilePicture } = req.body;

    if (!email || !isEmailValid(email)) {
        return next(new AppError("Valid email is required.", 400));
    }

    if (!isGmail(email)) {
        return next(new AppError("Only Gmail accounts are allowed in this route.", 400));
    }

    if (!validateRequiredString(firstName, "firstName", next, 3)) return;
    if (!validateRequiredString(lastName, "lastName", next, 3)) return;

    if (profilePicture !== undefined && typeof profilePicture !== "string") {
        return next(new AppError("profilePicture must be a string URL.", 400));
    }

    next();
};
