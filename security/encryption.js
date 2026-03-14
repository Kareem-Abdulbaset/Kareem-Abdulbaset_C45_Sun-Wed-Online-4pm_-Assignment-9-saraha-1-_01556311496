import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEYS_DIR = path.join(__dirname, "../../keys");
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, "public.pem");
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, "private.pem");

export const generateKeyPair = () => {
    if (!fs.existsSync(KEYS_DIR)) {
        fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    if (fs.existsSync(PUBLIC_KEY_PATH) && fs.existsSync(PRIVATE_KEY_PATH)) {
        return {
            publicKey: fs.readFileSync(PUBLIC_KEY_PATH, "utf-8"),
            privateKey: fs.readFileSync(PRIVATE_KEY_PATH, "utf-8")
        };
    }

    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });

    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);

    return { publicKey, privateKey };
};

export const encryptData = (data) => {
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, "utf-8");
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        Buffer.from(data, "utf-8")
    );
    return encrypted.toString("base64");
};

export const decryptData = (encryptedData) => {
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf-8");
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        Buffer.from(encryptedData, "base64")
    );
    return decrypted.toString("utf-8");
};
