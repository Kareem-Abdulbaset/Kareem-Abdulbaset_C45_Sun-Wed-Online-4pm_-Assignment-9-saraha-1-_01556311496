import { Router } from "express";
import * as US from "./user.services.js";
import { authentication } from "../../../middleware/authentication.js";

const userRouter = Router();

userRouter.post("/signup", US.signup);
userRouter.post("/verify-otp", US.verifyOtp);
userRouter.post("/resend-otp", US.resendOtp);
userRouter.post("/login", US.login);

userRouter.get("/profile", authentication, US.getProfile);

export default userRouter;
