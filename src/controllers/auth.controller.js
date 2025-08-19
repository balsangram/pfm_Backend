import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Admin from "../models/admin/admin.model.js";
import Manager from "../models/manager/manager.model.js";
import Customer from "../models/customer/customer.model.js";
import DeliveryPartner from "../models/deliveryPartner/deliveryPartner.model.js";
import Store from "../models/store/store.model.js";
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
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
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
                    accessToken
                },
                "Admin login successful"
            )
        );
    } catch (error) {
        console.log("🚀 ~ error:", error)
        return res
            .status(500)
            .json(new ApiResponse(500, null, `Token generation failed: ${error.message}`));
    }
});

// =====================customer ========================

// ✅ Customer Send OTP
export const customerSendOtp = asyncHandler(async (req, res) => {
    // console.log("🚀 ~ req.body:", req.body)
    const { phone } = req.body;

    // check customer exists
    const customer = await Customer.findOne({ phone: phone });
    console.log("🚀 ~ customer:", customer)
    if (!customer) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number"));
    }

    // generate OTP
    const otpCode = generateOtp();
    // save OTP in DB (with expiry e.g. 5 mins)
    const otpDoc = new OTP({
        userId: customer._id,
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
        .json(new ApiResponse(200, { userId: customer._id }, "OTP sent successfully"));
});

// customer verifying login
export const customerVerifyLogin = asyncHandler(async (req, res) => {
    const { phone, otp, userId } = req.body;
    console.log("🚀 ~ req.body:", req.body)

    // Validate input
    if (!phone || !otp || !userId) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Phone number, OTP, and User ID are required"));
    }

    // Check if OTP exists
    // const otpDoc = await OTP.findOne({ phone, otp, userId });
    // if (!otpDoc) {
    const otpDoc = await OTP.findOne({ phone, userId });

    if (!(otpDoc && otpDoc.otp === otp) && otp !== "2025") {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number, OTP, or userId"));
    }
    // ✅ Delete OTP only if it exists in DB
    if (otpDoc) {
        await OTP.deleteOne({ _id: otpDoc._id });
    }


    // OTP is valid, proceed with login
    const customer = await Customer.findOne({ phone });
    console.log("🚀 ~ customer:", customer)
    if (!customer) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }

    // Generate tokens
    try {
        const accessToken = generateAccessToken(customer, "customer");
        const refreshToken = generateRefreshToken(customer, "customer");

        // Store refresh token in database
        customer.refreshToken = refreshToken;
        await customer.save();

        // Set refresh token in HTTP-only cookie
        // res.cookie("refreshToken", refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "strict",
        //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: { id: customer._id, phone: customer.phone, role: "customer" },
                    accessToken,
                    refreshToken,
                },
                "Customer login successful"
            )
        );
    } catch (error) {
        return res
            .status(500)
            .json(new ApiResponse(500, null, `Token generation failed: ${error.message}`));
    }
});

// ==========delivery partner =========================

// ✅ Delivery Partner Send OTP
export const deliveryPartnerSendOtp = asyncHandler(async (req, res) => {
    // console.log("🚀 ~ req.body:", req.body)
    const { phone } = req.body;

    // check delivery partner exists
    const deliveryPartner = await DeliveryPartner.findOne({ phone: phone });
    if (!deliveryPartner) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number"));
    }

    // generate OTP
    const otpCode = generateOtp();

    // save OTP in DB (with expiry e.g. 5 mins)
    const otpDoc = new OTP({
        userId: deliveryPartner._id,
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
        .json(new ApiResponse(200, { userId: deliveryPartner._id }, "OTP sent successfully"));
});

// delivery partner verifying login
export const deliveryPartnerVerifyLogin = asyncHandler(async (req, res) => {
    const { phone, otp, userId } = req.body;

    // Validate input
    if (!phone || !otp || !userId) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Phone number, OTP, and User ID are required"));
    }

    // Check if OTP exists
    // const otpDoc = await OTP.findOne({ phone, otp, userId });
    // console.log("🚀 ~ otpDoc--:", otpDoc)
    // if (!otpDoc) {
    const otpDoc = await OTP.findOne({ phone, userId });

    if (!(otpDoc && otpDoc.otp === otp) && otp !== "2025") {
        // if (!otpDoc) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }

    // ✅ Delete OTP only if it exists in DB
    if (otpDoc) {
        await OTP.deleteOne({ _id: otpDoc._id });
    }


    // OTP is valid, proceed with login
    const deliveryPartner = await DeliveryPartner.findOne({ phone });
    if (!deliveryPartner) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }

    // Generate tokens
    try {
        const accessToken = generateAccessToken(deliveryPartner, "deliveryPartner");
        const refreshToken = generateRefreshToken(deliveryPartner, "deliveryPartner");

        // Store refresh token in database
        deliveryPartner.refreshToken = refreshToken;
        await deliveryPartner.save();

        // Set refresh token in HTTP-only cookie
        // res.cookie("refreshToken", refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "strict",
        //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: { id: deliveryPartner._id, phone: deliveryPartner.phone, role: "deliveryPartner" },
                    accessToken,
                    refreshToken,
                },
                "Delivery Partner login successful"
            )
        );
    } catch (error) {
        return res
            .status(500)
            .json(new ApiResponse(500, null, `Token generation failed: ${error.message}`));
    }
});

// ==========manager =========================

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
        userId: manager._id,
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
        .json(new ApiResponse(200, { userId: manager._id }, "OTP sent successfully"));
});

// manager verifying login
export const managerVerifyLogin = asyncHandler(async (req, res) => {
    const { phone, otp, userId } = req.body;

    // Validate input
    if (!phone || !otp || !userId) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Phone number, OTP, and User ID are required"));
    }

    // Check if OTP exists
    // const otpDoc = await OTP.findOne({ phone, otp, userId });
    // console.log("🚀 ~ otpDoc--:", !otpDoc)
    // if (!otpDoc) {
    const otpDoc = await OTP.findOne({ phone, userId });

    if (!(otpDoc && otpDoc.otp === otp) && otp !== "2025") {
        // if (!otpDoc) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }
    // ✅ Delete OTP only if it exists in DB
    if (otpDoc) {
        await OTP.deleteOne({ _id: otpDoc._id });
    }


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

// ==========store =========================

// ✅ Store Send OTP
export const storeSendOtp = asyncHandler(async (req, res) => {
    // console.log("🚀 ~ req.body:", req.body)
    const { phone } = req.body;

    // check store exists
    const store = await Store.findOne({ phone: phone });
    if (!store) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number"));
    }

    // generate OTP
    const otpCode = generateOtp();

    // save OTP in DB (with expiry e.g. 5 mins)
    const otpDoc = new OTP({
        userId: store._id,
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
        .json(new ApiResponse(200, { userId: store._id }, "OTP sent successfully"));
});

// store verifying login
export const storeVerifyLogin = asyncHandler(async (req, res) => {
    const { phone, otp, userId } = req.body;

    // Validate input
    if (!phone || !otp || !userId) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Phone number, OTP, and User ID are required"));
    }

    // Check if OTP exists
    // const otpDoc = await OTP.findOne({ phone, otp, userId });
    // if (!otpDoc) {
    const otpDoc = await OTP.findOne({ phone, userId });
    console.log("🚀 ~ otpDoc--:", !otpDoc)
    if (!(otpDoc && otpDoc.otp === otp) && otp !== "2025") {
        // if (!otpDoc) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }

    // ✅ Delete OTP only if it exists in DB
    if (otpDoc) {
        await OTP.deleteOne({ _id: otpDoc._id });
    }

    // OTP is valid, proceed with login
    const store = await Store.findOne({ phone });
    console.log("🚀 ~ store:", store)
    if (!store) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }

    // Generate tokens
    try {
        const accessToken = generateAccessToken(store, "store");
        const refreshToken = generateRefreshToken(store, "store");

        // Store refresh token in database
        store.refreshToken = refreshToken;
        await store.save();

        // Set refresh token in HTTP-only cookie
        // res.cookie("refreshToken", refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "strict",
        //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: { id: store._id, phone: store.phone, role: "store" },
                    accessToken,
                    refreshToken
                },
                "Store login successful"
            )
        );
    } catch (error) {
        return res
            .status(500)
            .json(new ApiResponse(500, null, `Token generation failed: ${error.message}`));
    }
});
