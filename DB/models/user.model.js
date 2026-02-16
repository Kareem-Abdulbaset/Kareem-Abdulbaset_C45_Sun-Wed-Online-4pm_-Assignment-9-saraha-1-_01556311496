import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 5,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 5,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
        trim: true
    },
    age: Number,
    gender: {
        type: String,
        required: true,
        enum: ["male", "female"],
        default: "male"
    },
    profilePicture: String,
    phone: String,
    confirmed: {
        type: Boolean,
        default: false,
    },
    otp: String,
    otpExpiry: Date,
    provider: {
        type: String,
        enum: ["system", "google"],
        default: "system"
    }
}, {
    timestamps: true,
    staticquery: true,
    toJSON: { virtuals: true }
});


userSchema.virtual("fullName").get(function () {
    return `${this.firstName}  ${this.lastName}`;
});

userSchema.virtual("fullName").set(function (value) {
    const [firstName, lastName] = value.split(" ");
    this.set({ firstName, lastName });
});

export const userModel = mongoose.models.User || mongoose.model("User", userSchema);
