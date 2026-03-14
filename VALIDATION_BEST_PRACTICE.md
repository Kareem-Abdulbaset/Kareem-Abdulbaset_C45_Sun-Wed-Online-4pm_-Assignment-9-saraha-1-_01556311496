 Best Validation Setup (Joi + Express)

هذا أفضل شكل للـ validation في مشروعك الحالي: validation في `schema` منفصل + `middleware` عام + استخدامه في الراوت قبل الـ service.

## 1) Install

```bash
npm i joi
```

## 2) Create User Schemas

ملف جديد: `DB/Modules/user/user.validation.js`

```js
import Joi from "joi";

const egyptPhoneRegex = /^01[0125]\d{8}$/;
const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,64}$/;

export const signUpSchema = Joi.object({
    firstName: Joi.string().trim().min(3).max(20).required(),
    lastName: Joi.string().trim().min(3).max(20).required(),
    email: Joi.string()
        .trim()
        .lowercase()
        .email({ tlds: { allow: false } })
        .required(),
    password: Joi.string().pattern(strongPasswordRegex).required().messages({
        "string.pattern.base":
            "Password must be 8-64 chars and include uppercase, lowercase, number, and special char.",
    }),
    cPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "cPassword must match password.",
    }),
    age: Joi.number().integer().min(13).max(80).optional(),
    gender: Joi.string().valid("male", "female").required(),
    phone: Joi.string().pattern(egyptPhoneRegex).optional(),
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email({ tlds: { allow: false } })
        .required(),
    password: Joi.string().required(),
});

export const verifyOtpSchema = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email({ tlds: { allow: false } })
        .required(),
    otp: Joi.string().pattern(/^\d{6}$/).required(),
});

export const resendOtpSchema = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email({ tlds: { allow: false } })
        .required(),
});
```

## 3) Create Generic Validation Middleware

ملف جديد: `middleware/validation.middleware.js`

```js
export const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        return res.status(400).json({
            status: "fail",
            message: "Validation error",
            errors: error.details.map((d) => ({
                field: d.path.join("."),
                message: d.message,
            })),
        });
    }

    req.body = value;
    next();
};
```

## 4) Use Validation in Routes

تعديل: `DB/Modules/user/user.controller.js`

```js
import { Router } from "express";
import * as US from "./user.services.js";
import { validate } from "../../../middleware/validation.middleware.js";
import {
    signUpSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
} from "./user.validation.js";

const userRouter = Router();

userRouter.post("/signup", validate(signUpSchema), US.signup);
userRouter.post("/verify-otp", validate(verifyOtpSchema), US.verifyOtp);
userRouter.post("/resend-otp", validate(resendOtpSchema), US.resendOtp);
userRouter.post("/login", validate(loginSchema), US.login);

export default userRouter;
```

## 5) Small Service Cleanup

داخل `DB/Modules/user/user.services.js`:

- استقبل القيم بعد ما الـ middleware ينضفها.
- لا تحفظ `cPassword` في الـ DB.
- افحص `email exists` بعد الـ validation (كما تفعل الآن).

مثال:

```js
const signup = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, password, age, gender, phone } = req.body;
    // ... existing logic
});
```

## 6) Important Note About Your Model

في `DB/models/user.model.js` لديك:

- `firstName.maxLength = 5`
- `lastName.maxLength = 5`

هذا ضيق جدًا مقارنة بمعظم الأسماء. إذا كنت ستجعل Joi `max(20)` فالأفضل توحيدها أيضًا في الـ mongoose schema حتى لا يمر Joi ثم يفشل الحفظ في DB.

## 7) Why This Is Better

- كل validation في مكان واحد وواضح.
- نفس middleware لكل endpoints.
- رسائل error مرتبة للفرونت.
- أي حقول زيادة تتشال تلقائيًا (`stripUnknown`).
- الكود في services يفضل business logic فقط.
