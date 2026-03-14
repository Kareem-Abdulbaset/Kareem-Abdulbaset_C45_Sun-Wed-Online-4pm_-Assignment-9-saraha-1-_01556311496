import { Router } from "express";
import * as US from "./user.service.js";
import { authentication } from "../middlewares/authentication.js";
import { validation } from "../middlewares/validation.js";
import { multer_local } from "../middlewares/multer.js";
import { multer_enum_image } from "../../common/enum/multer.enum.js";
import {
    loginSchema,
    resendOtpSchema,
    signupSchema,
    verifyOtpSchema
} from "./user.validation.js";

const userRouter = Router();

userRouter.post(
    "/signup",
    multer_local({ custom_types: [...multer_enum_image] }).fields([
        { name: "attachment", maxCount: 1 },
        { name: "attachments", maxCount: 2 }
    ]),
    validation(signupSchema),
    US.signup
);

userRouter.post("/verify-otp", validation(verifyOtpSchema), US.verifyOtp);
userRouter.post("/resend-otp", validation(resendOtpSchema), US.resendOtp);
userRouter.post("/login", validation(loginSchema), US.login);

userRouter.get("/:id/profile", authentication, US.getProfile);

userRouter.patch(
    "/cover-pictures",
    authentication,
    multer_local({ custom_types: [...multer_enum_image] }).fields([{ name: "attachments", maxCount: 2 }]),
    US.uploadCoverPictures
);

userRouter.patch(
    "/profile-picture",
    authentication,
    multer_local({ custom_types: [...multer_enum_image] }).single("attachment"),
    US.uploadProfilePicture
);

userRouter.delete("/profile-picture", authentication, US.removeProfilePicture);

export default userRouter;
