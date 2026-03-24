import nodemailer from "nodemailer";

const EMAIL = process.env.EMAIL_USER;
const PASSWORD = process.env.EMAIL_PASS;

export const sendEmail = async (
    { to, subject, html, attachments }
) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL,
            pass: PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: `"3b8ny😎" <${EMAIL}>`,
        to,
        subject: subject || "Hello ✔",
        html: html || "<b>Hello world?</b>",
        attachments: attachments || []
    });

    console.log("Message sent:", info.messageId);

    return info.accepted.length > 0 ? true : false;
}

export const generateOtp = async () => {
    return Math.floor(Math.random() * 900000 + 100000);
}
