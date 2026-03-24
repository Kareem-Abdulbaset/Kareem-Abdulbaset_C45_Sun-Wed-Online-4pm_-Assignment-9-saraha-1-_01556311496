const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?\d{10,15}$/;
const otpRegex = /^\d{6}$/;

const toError = (messages) => ({
    details: messages.map((message) => ({ message }))
});

const trimString = (value) => (typeof value === "string" ? value.trim() : value);

export const signupSchema = (data = {}) => {
    const value = {
        firstName: trimString(data.firstName),
        lastName: trimString(data.lastName),
        email: trimString(data.email)?.toLowerCase(),
        password: trimString(data.password),
        cPassword: trimString(data.cPassword),
        age: data.age,
        gender: trimString(data.gender),
        phone: trimString(data.phone)
    };

    const errors = [];

    if (!value.firstName || value.firstName.length < 3) errors.push("firstName must be at least 3 chars");
    if (!value.lastName || value.lastName.length < 3) errors.push("lastName must be at least 3 chars");
    if (!value.email || !emailRegex.test(value.email)) errors.push("email must be valid");
    if (!value.password || value.password.length < 6) errors.push("password must be at least 6 chars");
    if (value.cPassword !== value.password) errors.push("cPassword must match password");
    if (!["male", "female"].includes(value.gender)) errors.push("gender must be male or female");
    if (!value.phone || !phoneRegex.test(value.phone)) errors.push("phone must be valid");

    if (value.age !== undefined) {
        const parsedAge = Number(value.age);

        if (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 100) {
            errors.push("age must be an integer between 13 and 100");
        } else {
            value.age = parsedAge;
        }
    }

    return {
        error: errors.length ? toError(errors) : null,
        value
    };
};

export const verifyOtpSchema = (data = {}) => {
    const value = {
        email: trimString(data.email)?.toLowerCase(),
        otp: trimString(data.otp)
    };

    const errors = [];

    if (!value.email || !emailRegex.test(value.email)) errors.push("email must be valid");
    if (!value.otp || !otpRegex.test(value.otp)) errors.push("otp must be 6 digits");

    return {
        error: errors.length ? toError(errors) : null,
        value
    };
};

export const resendOtpSchema = (data = {}) => {
    const value = {
        email: trimString(data.email)?.toLowerCase()
    };

    const errors = [];

    if (!value.email || !emailRegex.test(value.email)) errors.push("email must be valid");

    return {
        error: errors.length ? toError(errors) : null,
        value
    };
};

export const loginSchema = (data = {}) => {
    const value = {
        email: trimString(data.email)?.toLowerCase(),
        password: trimString(data.password)
    };

    const errors = [];

    if (!value.email || !emailRegex.test(value.email)) errors.push("email must be valid");
    if (!value.password || value.password.length < 6) errors.push("password must be at least 6 chars");

    return {
        error: errors.length ? toError(errors) : null,
        value
    };
};

export const forgetPasswordSchema = (data = {}) => {
    const value = {
        email: trimString(data.email)?.toLowerCase()
    };

    const errors = [];

    if (!value.email || !emailRegex.test(value.email)) errors.push("email must be valid");

    return {
        error: errors.length ? toError(errors) : null,
        value
    };
};

export const resetPasswordSchema = (data = {}) => {
    const value = {
        email: trimString(data.email)?.toLowerCase(),
        otp: trimString(data.otp),
        password: trimString(data.password),
        cPassword: trimString(data.cPassword)
    };

    const errors = [];

    if (!value.email || !emailRegex.test(value.email)) errors.push("email must be valid");
    if (!value.otp || !otpRegex.test(value.otp)) errors.push("otp must be 6 digits");
    if (!value.password || value.password.length < 6) errors.push("password must be at least 6 chars");
    if (value.cPassword !== value.password) errors.push("cPassword must match password");

    return {
        error: errors.length ? toError(errors) : null,
        value
    };
};

export const updatePasswordSchema = (data = {}) => {
    const value = {
        oldPassword: trimString(data.oldPassword),
        newPassword: trimString(data.newPassword),
        cPassword: trimString(data.cPassword)
    };

    const errors = [];

    if (!value.oldPassword || value.oldPassword.length < 6) errors.push("oldPassword must be at least 6 chars");
    if (!value.newPassword || value.newPassword.length < 6) errors.push("newPassword must be at least 6 chars");
    if (value.cPassword !== value.newPassword) errors.push("cPassword must match newPassword");

    return {
        error: errors.length ? toError(errors) : null,
        value
    };
};

export const otpOnlySchema = (data = {}) => {
    const value = {
        otp: trimString(data.otp)
    };

    const errors = [];

    if (!value.otp || !otpRegex.test(value.otp)) errors.push("otp must be 6 digits");

    return {
        error: errors.length ? toError(errors) : null,
        value
    };
};

export const loginConfirmationSchema = verifyOtpSchema;

export const refreshTokenSchema = (data = {}) => {
    const value = {
        authorization: trimString(data.authorization)
    };

    const errors = [];

    if (!value.authorization) errors.push("authorization token is required");

    return {
        error: errors.length ? toError(errors) : null,
        value
    };
};
