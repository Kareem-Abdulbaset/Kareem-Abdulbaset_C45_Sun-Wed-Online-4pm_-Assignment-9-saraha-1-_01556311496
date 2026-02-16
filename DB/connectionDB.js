import mongoose from "mongoose";

export default async function connectDB() {
    await mongoose.connect("mongodb://127.0.0.1:27017/SarahaApp")
        .then(() => {
            console.log("Connected to MongoDB ........ 👍");
        }).catch((err) => {
            console.log("Error connecting to MongoDB ........ 😒", err);
        });
}