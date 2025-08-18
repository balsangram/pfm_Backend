import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Admin from "../models/admin/admin.model.js";
import Manager from "../models/manager/manager.model.js";
import {
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_VALIDATION_TIME,
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_VALIDATION_TIME,
} from "../config/config.dotenv.js";
import OTP from "../models/otp.model.js";


// Generate Access Token
// console.log("🚀 ~  ACCESS_TOKEN_SECRET: ---", ACCESS_TOKEN_SECRET);

const generateAccessToken = (user, role) => {
    if (!ACCESS_TOKEN_SECRET) {
        throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }
    return jwt.sign(
        {
            userId: user._id,
            role: role,
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_VALIDATION_TIME || "1d" }
    );
};

// Generate Refresh Token
const generateRefreshToken = (user, role) => {
    if (!REFRESH_TOKEN_SECRET) {
        throw new Error("REFRESH_TOKEN_SECRET is not defined");
    }
    return jwt.sign(
        {
            userId: user._id,
            role: role,
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_VALIDATION_TIME || "7d" }
    );
};

// random no generate OTP
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
};

// Admin Login Controller
export const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Email and password are required"));
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid email or password"));
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid email or password"));
    }

    // Generate tokens
    try {
        const accessToken = generateAccessToken(admin, "admin");
        const refreshToken = generateRefreshToken(admin, "admin");

        // Store refresh token in database
        admin.refreshToken = refreshToken;
        await admin.save();

        // Set refresh token in HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: { id: admin._id, email: admin.email, role: "admin" },
                    accessToken,
                },
                "Admin login successful"
            )
        );
    } catch (error) {
        return res
            .status(500)
            .json(new ApiResponse(500, null, `Token generation failed: ${error.message}`));
    }
});

// ✅ Manager Send OTP
export const managerSendOtp = asyncHandler(async (req, res) => {
    // console.log("🚀 ~ req.body:", req.body)
    const { phone } = req.body;

    // check manager exists
    const manager = await Manager.findOne({ phone: phone });
    if (!manager) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number"));
    }

    // generate OTP
    const otpCode = generateOtp();

    // save OTP in DB (with expiry e.g. 5 mins)
    const otpDoc = new OTP({
        phone: phone,
        otp: otpCode,
        // createdAt: new Date(),
        // expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
    });
    console.log("🚀 ~ otpDoc:", otpDoc)
    await otpDoc.save();

    // send OTP via SMS (here just log, you can integrate Twilio / AWS SNS / Fast2SMS)
    // console.log(`🚀 ~ OTP sent to ${phone}: ${otpCode}`);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "OTP sent successfully"));
});

// manager verifying login
export const managerVerifyLogin = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;

    // Validate input
    if (!phone || !otp) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Phone number and OTP are required"));
    }

    // Check if OTP exists
    const otpDoc = await OTP.findOne({ phone, otp });
    if (!otpDoc) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }
    console.log("hello");

    // OTP is valid, proceed with login
    const manager = await Manager.findOne({ phone });
    console.log("🚀 ~ manager:", manager)
    if (!manager) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }

    // Generate tokens
    try {
        const accessToken = generateAccessToken(manager, "manager");
        const refreshToken = generateRefreshToken(manager, "manager");

        // Store refresh token in database
        manager.refreshToken = refreshToken;
        await manager.save();

        // Set refresh token in HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: { id: manager._id, phone: manager.phone, role: "manager" },
                    accessToken,
                },
                "Manager login successful"
            )
        );
    } catch (error) {
        return res
            .status(500)
            .json(new ApiResponse(500, null, `Token generation failed: ${error.message}`));
    }
});

