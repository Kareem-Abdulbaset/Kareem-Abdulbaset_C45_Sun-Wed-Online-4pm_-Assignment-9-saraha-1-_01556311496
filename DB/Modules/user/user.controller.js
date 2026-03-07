import { Router } from "express";
import * as US from "./user.services.js";
import { authentication } from "../../../middleware/authentication.js";
import { authorization } from "../../../middleware/authorization.js";
import { uploadProfilePicture } from "../../../middleware/upload.js";
import {
    validateSignup,
    validateVerifyOtp,
    validateResendOtp,
    validateLogin,
    validateGmailLogin
} from "../../../middleware/validation.js";

const userRouter = Router();

userRouter.post("/signup", validateSignup, US.signup);
userRouter.post("/verify-otp", validateVerifyOtp, US.verifyOtp);
userRouter.post("/resend-otp", validateResendOtp, US.resendOtp);
userRouter.post("/login", validateLogin, US.login);
userRouter.post("/gmail-login", validateGmailLogin, US.gmailLogin);

userRouter.get("/profile", authentication, authorization("user", "admin"), US.getProfile);
userRouter.patch(
    "/profile-picture",
    authentication,
    authorization("user", "admin"),
    uploadProfilePicture,
    US.updateProfilePicture
);

export default userRouter;
