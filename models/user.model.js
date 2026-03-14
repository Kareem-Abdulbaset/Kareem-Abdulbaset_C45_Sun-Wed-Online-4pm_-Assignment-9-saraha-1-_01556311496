import mongoose from "mongoose";
import { genderTypes, providerTypes, roleTypes } from "../common/enum/user.enum.js";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            minLength: 3,
            maxLength: 30,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            minLength: 3,
            maxLength: 30,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
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
            enum: Object.values(genderTypes),
            default: genderTypes.male
        },
        role: {
            type: String,
            enum: Object.values(roleTypes),
            default: roleTypes.user
        },
        profilePicture: String,
        coverPictures: [String],
        gallery: [String],
        profileVisitCount: {
            type: Number,
            default: 0
        },
        phone: String,
        confirmed: {
            type: Boolean,
            default: false
        },
        otp: String,
        otpExpiry: Date,
        provider: {
            type: String,
            enum: Object.values(providerTypes),
            default: providerTypes.system
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("fullName").set(function (value) {
    const [firstName, lastName] = value.split(" ");
    this.set({ firstName, lastName });
});

export const userModel = mongoose.models.User || mongoose.model("User", userSchema);
