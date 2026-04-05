import { Router } from "express";
import * as US from "./user.service.js";
import { validation } from "../middlewares/validation.js";
import { authentication } from "../middlewares/authentication.js";
import {
    forgetPasswordSchema,
    loginConfirmationSchema,
    loginSchema,
    otpOnlySchema,
    resendOtpSchema,
    resetPasswordSchema,
    signupSchema,
    updatePasswordSchema,
    verifyOtpSchema
} from "./user.validation.js";

const userRouter = Router();

userRouter.post("/signup", validation(signupSchema), US.signUp);
userRouter.post("/verify-otp", validation(verifyOtpSchema), US.verifyOtp);
userRouter.post("/resend-otp", validation(resendOtpSchema), US.resendOTP);
userRouter.post("/login", validation(loginSchema), US.signIn);
userRouter.post("/login-confirmation", validation(loginConfirmationSchema), US.confirmLogin);
userRouter.post("/forget-password", validation(forgetPasswordSchema), US.forgetPassword);
userRouter.get("/reset-password", US.showResetPasswordPage);
userRouter.post("/reset-password", US.resetPasswordFromForm);
userRouter.patch("/reset-password", validation(resetPasswordSchema), US.resetPassword);
userRouter.patch("/update-password", authentication, validation(updatePasswordSchema), US.updatePassword);
userRouter.post("/enable-two-step", authentication, US.enableTwoStepVerification);
userRouter.post("/verify-enable-two-step", authentication, validation(otpOnlySchema), US.verifyEnableTwoStepVerification);
userRouter.post("/signup-gmail", US.signUpWithGmail);

export default userRouter;
