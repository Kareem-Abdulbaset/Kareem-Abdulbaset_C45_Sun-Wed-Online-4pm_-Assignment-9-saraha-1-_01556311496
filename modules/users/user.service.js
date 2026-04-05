import bcrypt from "bcrypt";
import crypto from "crypto";
import { userModel } from "../../models/user.model.js";
import { providerTypes } from "../../common/enum/user.enum.js";
import { generateToken } from "../middlewares/token.js";
import { successResponse } from "../../common/utils/response.js";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email.js";

const hashPassword = (plainText) => bcrypt.hashSync(String(plainText), 10);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const clearOtpData = (user) => {
    user.otp = null;
    user.otpExpiry = null;
    user.otpType = null;
};

const clearResetPasswordData = (user) => {
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
};

const createUserToken = (user) =>
    generateToken({
        payload: { id: user._id, email: user.email, role: user.role }
    });

const sendOtpToUser = async ({ user, otpType, subject, title, text }) => {
    const otp = await generateOtp();

    user.otp = hashPassword(otp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpType = otpType;

    await user.save();

    const isSent = await sendEmail({
        to: user.email,
        subject,
        html: `<h1>${title}</h1><p>${text}: <b>${otp}</b></p>`
    });

    if (!isSent) {
        throw createError("Failed to send email", 500);
    }
};

const createResetPasswordLink = (req, user, token) => {
    const baseUrl =
        process.env.RESET_PASSWORD_URL ||
        `${req.protocol}://${req.get("host")}/users/reset-password`;

    return `${baseUrl}?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
};

const sendResetPasswordLink = async ({ req, user }) => {
    const token = crypto.randomBytes(32).toString("hex");
    const link = createResetPasswordLink(req, user, token);

    user.resetPasswordToken = hashPassword(token);
    user.resetPasswordExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    const isSent = await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<h1>Reset your password</h1><p><a href="${link}">Click here to reset your password</a></p><p>This link will expire in 10 minutes</p>`
    });

    if (!isSent) {
        throw createError("Failed to send email", 500);
    }
};

const validateOtpValue = async ({ user, otp, otpType }) => {
    if (!user.otp || !user.otpExpiry || user.otpType !== otpType) {
        throw createError("OTP not found", 400);
    }

    if (user.otpExpiry.getTime() < Date.now()) {
        clearOtpData(user);
        await user.save();
        throw createError("OTP expired", 400);
    }

    if (!bcrypt.compareSync(String(otp), user.otp)) {
        throw createError("Invalid OTP", 400);
    }
};

const findResetPasswordUser = async (email) => {
    const user = await userModel.findOne({
        email,
        confirmed: true,
        provider: providerTypes.system
    });

    if (!user) {
        throw createError("User not found", 404);
    }

    return user;
};

const validateResetPasswordToken = async ({ user, token }) => {
    if (!user.resetPasswordToken || !user.resetPasswordExpiresAt) {
        throw createError("Reset link not found", 400);
    }

    if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
        clearResetPasswordData(user);
        await user.save();
        throw createError("Reset link expired", 400);
    }

    if (!bcrypt.compareSync(String(token), user.resetPasswordToken)) {
        throw createError("Invalid reset link", 400);
    }
};

const resetUserPassword = async ({ user, token, password }) => {
    await validateResetPasswordToken({ user, token });

    user.password = hashPassword(password);
    user.failedLoginAttempts = 0;
    user.banUntil = null;
    clearResetPasswordData(user);

    await user.save();
};

const renderPage = ({ title, body }) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; padding: 20px;">
    ${body}
</body>
</html>`;
};

const renderMessagePage = ({ title, message }) => {
    return renderPage({
        title,
        body: `<h2>${title}</h2><p>${message}</p>`
    });
};

const renderResetPasswordForm = ({ email, token }) => {
    return renderPage({
        title: "Reset password",
        body: `<h2>Reset password</h2>
<form method="post" action="/users/reset-password">
    <input type="hidden" name="email" value="${email}" />
    <input type="hidden" name="token" value="${token}" />
    <div style="margin-bottom: 12px;">
        <label for="password">New password</label><br />
        <input id="password" name="password" type="password" minlength="6" required style="width: 100%; padding: 8px;" />
    </div>
    <div style="margin-bottom: 12px;">
        <label for="cPassword">Confirm password</label><br />
        <input id="cPassword" name="cPassword" type="password" minlength="6" required style="width: 100%; padding: 8px;" />
    </div>
    <button type="submit" style="padding: 8px 16px;">Reset password</button>
</form>`
    });
};

const getResetPasswordData = (data = {}) => {
    return {
        email: String(data.email || "").trim().toLowerCase(),
        token: String(data.token || "").trim(),
        password: String(data.password || "").trim(),
        cPassword: String(data.cPassword || "").trim()
    };
};

const validateResetPasswordData = ({ email, token, password, cPassword }) => {
    if (!email || !emailRegex.test(email)) {
        return "email must be valid";
    }

    if (!token) {
        return "token is required";
    }

    if (!password || password.length < 6) {
        return "password must be at least 6 chars";
    }

    if (password !== cPassword) {
        return "cPassword must match password";
    }

    return null;
};

const clearBanIfExpired = async (user) => {
    if (user.banUntil && user.banUntil.getTime() <= Date.now()) {
        user.banUntil = null;
        user.failedLoginAttempts = 0;
        await user.save();
    }
};

const checkBan = (user) => {
    if (user.banUntil && user.banUntil.getTime() > Date.now()) {
        throw createError("Account is temporarily banned for 5 minutes", 400);
    }
};

const failLogin = async (user) => {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= 5) {
        user.failedLoginAttempts = 0;
        user.banUntil = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();
        throw createError("Account is temporarily banned for 5 minutes", 400);
    }

    await user.save();
    throw createError("Invalid password", 400);
};

const resetLoginData = async (user) => {
    user.failedLoginAttempts = 0;
    user.banUntil = null;
    await user.save();
};

export const signUp = async (req, res) => {
    const { firstName, lastName, email, password, age, gender, phone } = req.body;

    const userExists = await userModel.findOne({ email });

    if (userExists) {
        throw createError("User already exists", 409);
    }

    const newUser = await userModel.create({
        firstName,
        lastName,
        email,
        password: hashPassword(password),
        age,
        gender,
        phone,
        emailConfirmationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await sendOtpToUser({
        user: newUser,
        otpType: "confirmEmail",
        subject: "Confirm your email",
        title: "Confirm your email",
        text: "Your confirmation code is"
    });

    successResponse({
        res,
        status: 201,
        message: "success signup",
        data: {
            user: {
                id: newUser._id,
                email: newUser.email
            }
        }
    });
};

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email, provider: providerTypes.system });

    if (!user) {
        throw createError("User not found", 404);
    }

    if (user.confirmed) {
        throw createError("Email already confirmed", 400);
    }

    await validateOtpValue({ user, otp, otpType: "confirmEmail" });

    user.confirmed = true;
    user.emailConfirmationExpiresAt = null;
    clearOtpData(user);

    await user.save();

    successResponse({ res, message: "email confirmed successfully" });
};

export const resendOTP = async (req, res) => {
    const { email } = req.body;

    const user = await userModel.findOne({ email, provider: providerTypes.system });

    if (!user) {
        throw createError("User not found", 404);
    }

    if (user.confirmed) {
        throw createError("Email already confirmed", 400);
    }

    await sendOtpToUser({
        user,
        otpType: "confirmEmail",
        subject: "Confirm your email",
        title: "Confirm your email",
        text: "Your confirmation code is"
    });

    successResponse({ res, message: "OTP resent successfully" });
};

export const signIn = async (req, res) => {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email, provider: providerTypes.system });

    if (!user) {
        throw createError("User not found", 404);
    }

    if (!user.confirmed) {
        throw createError("Verify your email first", 400);
    }

    await clearBanIfExpired(user);
    checkBan(user);

    if (!bcrypt.compareSync(password, user.password)) {
        await failLogin(user);
    }

    if (user.twoStepVerification) {
        user.failedLoginAttempts = 0;
        user.banUntil = null;

        await sendOtpToUser({
            user,
            otpType: "login",
            subject: "Login verification",
            title: "Login verification",
            text: "Your login code is"
        });

        return successResponse({
            res,
            message: "OTP sent to your email"
        });
    }

    await resetLoginData(user);

    const token = createUserToken(user);

    successResponse({ res, data: { token } });
};

export const confirmLogin = async (req, res) => {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email, provider: providerTypes.system });

    if (!user) {
        throw createError("User not found", 404);
    }

    if (!user.twoStepVerification) {
        throw createError("2 step verification is not enabled", 400);
    }

    await validateOtpValue({ user, otp, otpType: "login" });

    clearOtpData(user);
    await user.save();

    const token = createUserToken(user);

    successResponse({ res, data: { token } });
};

export const enableTwoStepVerification = async (req, res) => {
    const user = req.user;

    if (!user) {
        throw createError("Unauthorized user", 401);
    }

    if (user.provider !== providerTypes.system) {
        throw createError("This endpoint is for system users only", 400);
    }

    if (user.twoStepVerification) {
        throw createError("2 step verification is already enabled", 400);
    }

    await sendOtpToUser({
        user,
        otpType: "enableTwoStep",
        subject: "Enable 2 step verification",
        title: "Enable 2 step verification",
        text: "Your code is"
    });

    successResponse({ res, message: "OTP sent to your email" });
};

export const verifyEnableTwoStepVerification = async (req, res) => {
    const user = req.user;
    const { otp } = req.body;

    if (!user) {
        throw createError("Unauthorized user", 401);
    }

    if (user.twoStepVerification) {
        throw createError("2 step verification is already enabled", 400);
    }

    await validateOtpValue({ user, otp, otpType: "enableTwoStep" });

    user.twoStepVerification = true;
    clearOtpData(user);

    await user.save();

    successResponse({ res, message: "2 step verification enabled successfully" });
};

export const forgetPassword = async (req, res) => {
    const { email } = req.body;

    const user = await findResetPasswordUser(email);

    await sendResetPasswordLink({ req, user });

    successResponse({ res, message: "Reset link sent successfully" });
};

export const showResetPasswordPage = async (req, res) => {
    const email = String(req.query.email || "").trim().toLowerCase();
    const token = String(req.query.token || "").trim();

    if (!email || !emailRegex.test(email) || !token) {
        return res
            .status(400)
            .send(renderMessagePage({ title: "Invalid link", message: "Reset link is invalid" }));
    }

    try {
        const user = await findResetPasswordUser(email);
        await validateResetPasswordToken({ user, token });

        return res.status(200).send(renderResetPasswordForm({ email, token }));
    } catch (error) {
        return res
            .status(error.statusCode || 400)
            .send(renderMessagePage({ title: "Reset password", message: error.message }));
    }
};

export const resetPassword = async (req, res) => {
    const { email, token, password } = req.body;

    const user = await findResetPasswordUser(email);

    await resetUserPassword({ user, token, password });

    successResponse({ res, message: "Password reset successfully" });
};

export const resetPasswordFromForm = async (req, res) => {
    const data = getResetPasswordData(req.body);
    const validationMessage = validateResetPasswordData(data);

    if (validationMessage) {
        return res
            .status(400)
            .send(renderMessagePage({ title: "Reset password", message: validationMessage }));
    }

    try {
        const user = await findResetPasswordUser(data.email);

        await resetUserPassword({
            user,
            token: data.token,
            password: data.password
        });

        return res
            .status(200)
            .send(
                renderMessagePage({
                    title: "Password reset successfully",
                    message: "Password reset successfully"
                })
            );
    } catch (error) {
        return res
            .status(error.statusCode || 400)
            .send(renderMessagePage({ title: "Reset password", message: error.message }));
    }
};

export const updatePassword = async (req, res) => {
    const user = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!user) {
        throw createError("Unauthorized user", 401);
    }

    if (!bcrypt.compareSync(oldPassword, user.password)) {
        throw createError("Old password is incorrect", 400);
    }

    user.password = hashPassword(newPassword);

    await user.save();

    successResponse({ res, message: "Password updated successfully" });
};

export const signUpWithGmail = async (req, res) => {
    const { idToken } = req.body;

    let OAuth2Client;

    try {
        const googleAuth = await import("google-auth-library");
        OAuth2Client = googleAuth.OAuth2Client;
    } catch (error) {
        throw createError("google login is not available now", 500);
    }

    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
        idToken,
        audience:
            "367829966840-ip9nn34hpd5n5vbuobvlo8l2v4ihrhgli.apps.googleusercontent.com"
    });

    const payload = ticket.getPayload();

    const {
        email_verified,
        email,
        given_name: firstName,
        family_name: lastName,
        picture
    } = payload;

    if (!email_verified) {
        throw createError("email not verified", 400);
    }

    let user = await userModel.findOne({ email });

    if (user) {
        if (user.provider !== providerTypes.google) {
            throw createError("user already exists with different provider", 400);
        }
    } else {
        user = await userModel.create({
            firstName,
            lastName,
            email,
            password: hashPassword("google_default_password"),
            provider: providerTypes.google,
            confirmed: true,
            profilePicture: { secure_url: picture }
        });
    }

    const token = createUserToken(user);

    successResponse({ res, data: { token } });
};
