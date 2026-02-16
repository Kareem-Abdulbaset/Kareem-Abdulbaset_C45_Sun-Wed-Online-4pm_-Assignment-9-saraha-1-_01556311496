import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOtpEmail = async (to, otp) => {
    const mailOptions = {
        from: `"Saraha App" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Saraha App - Email Verification OTP",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4A90D9; text-align: center;">Saraha App</h2>
                <h3 style="text-align: center;">Email Verification</h3>
                <p>Hello,</p>
                <p>Your OTP code for email verification is:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background-color: #f0f0f0; padding: 15px 30px; border-radius: 8px; color: #333;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #888;">This code will expire in <strong>10 minutes</strong>.</p>
                <p style="color: #888;">If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #aaa; font-size: 12px; text-align: center;">© Saraha App 2026</p>
            </div>
        `,
    };

    return await transporter.sendMail(mailOptions);
};

export const generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    return { otp, otpExpiry };
};
