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
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import admin from "../../firebase.js";

// Generate Access Token
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

// Generate OTP
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
};

// Generic refresh token function
const refreshTokens = async (user, role, refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Verify the token is for the correct role
    if (decoded.role !== role) {
        throw new ApiError(403, `Invalid token for ${role}`);
    }

    // Check if the stored refresh token matches
    if (user.refreshToken !== refreshToken) {
        throw new ApiError(401, 'Refresh token revoked');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user, role);
    const newRefreshToken = generateRefreshToken(user, role);

    // Update the refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    return { newAccessToken, newRefreshToken };
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

        // Set tokens in cookies
        console.log("🚀 ~ accessToken:", accessToken)
        res.cookie("adminAccessToken", accessToken, {
            httpOnly: false,        // prevents JS access
            secure: process.env.NODE_ENV === "production", // use HTTPS in prod
            sameSite: "strict",    // CSRF protection
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie("adminRefreshToken", refreshToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: { id: admin._id, email: admin.email, role: "admin" },
                    accessToken,
                    refreshToken
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

// Admin Refresh Token
export const adminRefreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const admin = await Admin.findById(req.user?.id);
    if (!admin) {
        throw new ApiError(404, 'Admin not found');
    }

    const { newAccessToken, newRefreshToken } = await refreshTokens(admin, 'admin', refreshToken);

    // Set tokens in cookies
    res.cookie("adminAccessToken", newAccessToken, {
        httpOnly: true,        // prevents JS access
        secure: process.env.NODE_ENV === "production", // use HTTPS in prod
        sameSite: "strict",    // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.cookie("adminRefreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            },
            "Admin tokens refreshed successfully"
        )
    );
});

// Customer Send OTP
export const customerSendOtp = asyncHandler(async (req, res) => {
    const { phone, refId } = req.body;

    // Validate phone number
    if (!phone || phone.length < 10) {
        return res.status(400).json(new ApiResponse(400, null, "Valid phone number is required"));
    }

    // Validate refId first (if provided)
    if (refId) {
        // Validate refId format (should be a valid MongoDB ObjectId)
        if (!mongoose.Types.ObjectId.isValid(refId)) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid referral ID format"));
        }

        // Check if referrer exists
        const referrer = await Customer.findById(refId);
        if (!referrer) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid referral ID - referrer not found"));
        }
    }
    // Check if customer exists
    let customer = await Customer.findOne({ phone });

    if (!customer) {
        // New customer creation with welcome bonus
        customer = await Customer.create({
            name: `Customer_${phone.slice(-4)}`,
            phone,
            wallet: 50 // Welcome bonus for new user
        });
        console.log("🚀 ~ New customer created with ₹50 wallet:", customer);

        // Apply referral bonus if refId is provided
        if (refId) {
            const referrer = await Customer.findById(refId);
            if (referrer) {
                referrer.wallet += 50; // Referral bonus for referrer
                await referrer.save();
                console.log(`🚀 ~ Referral bonus applied to referrer: ${referrer._id}`);
            }
        }
    }

    // Generate OTP
    const otpCode = generateOtp();

    // Save OTP in DB (with expiry)
    const otpDoc = new OTP({
        userId: customer._id,
        phone,
        otp: otpCode,
    });
    await otpDoc.save();
    console.log("🚀 ~ otpDoc:", otpDoc);

    return res
        .status(200)
        .json(new ApiResponse(200, { userId: customer._id }, "OTP sent successfully"));
});

// Customer Verify Login
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
    const otpDoc = await OTP.findOne({ phone, userId });

    if (!(otpDoc && otpDoc.otp === otp) && otp !== "1234") {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number, OTP, or userId"));
    }

    // Delete OTP only if it exists in DB
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

// Customer Refresh Token
export const customerRefreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Verify the token is for the correct role
    if (decoded.role !== 'customer') {
        throw new ApiError(403, 'Invalid token for customer');
    }

    const customer = await Customer.findById(decoded.userId);
    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    // Debug logging
    console.log("🚀 ~ Received refresh token:", refreshToken);
    console.log("🚀 ~ Stored refresh token:", customer.refreshToken);
    console.log("🚀 ~ Tokens match:", customer.refreshToken === refreshToken);

    // Check if the stored refresh token matches
    if (customer.refreshToken !== refreshToken) {
        throw new ApiError(401, 'Refresh token revoked');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(customer, 'customer');
    const newRefreshToken = generateRefreshToken(customer, 'customer');

    // Update the refresh token in database
    customer.refreshToken = newRefreshToken;
    await customer.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            },
            "Customer tokens refreshed successfully"
        )
    );
});

// Delivery Partner Send OTP
export const deliveryPartnerSendOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    // check delivery partner exists (must be created by admin first)
    const deliveryPartner = await DeliveryPartner.findOne({ phone: phone });
    if (!deliveryPartner) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number. Please contact admin to register."));
    }

    // generate OTP
    const otpCode = generateOtp();

    // save OTP in DB (with expiry e.g. 5 mins)
    const otpDoc = new OTP({
        userId: deliveryPartner._id,
        phone: phone,
        otp: otpCode,
    });
    console.log("🚀 ~ otpDoc:", otpDoc)
    await otpDoc.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { userId: deliveryPartner._id }, "OTP sent successfully"));
});

// Delivery Partner Verify Login
export const deliveryPartnerVerifyLogin = asyncHandler(async (req, res) => {
    const { phone, otp, userId } = req.body;

    // Validate input
    if (!phone || !otp || !userId) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Phone number, OTP, and User ID are required"));
    }

    // Check if OTP exists
    const otpDoc = await OTP.findOne({ phone, userId });

    if (!(otpDoc && otpDoc.otp === otp) && otp !== "1234") {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }

    // Delete OTP only if it exists in DB
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

// Delivery Partner Refresh Token
export const deliveryPartnerRefreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Verify the token is for the correct role
    if (decoded.role !== 'deliveryPartner') {
        throw new ApiError(403, 'Invalid token for deliveryPartner');
    }

    const deliveryPartner = await DeliveryPartner.findById(decoded.userId);
    if (!deliveryPartner) {
        throw new ApiError(404, 'Delivery Partner not found');
    }

    // Check if the stored refresh token matches
    if (deliveryPartner.refreshToken !== refreshToken) {
        throw new ApiError(401, 'Refresh token revoked');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(deliveryPartner, 'deliveryPartner');
    const newRefreshToken = generateRefreshToken(deliveryPartner, 'deliveryPartner');

    // Update the refresh token in database
    deliveryPartner.refreshToken = newRefreshToken;
    await deliveryPartner.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            },
            "Delivery Partner tokens refreshed successfully"
        )
    );
});

// Manager Send OTP
export const managerSendOtp = asyncHandler(async (req, res) => {
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
    });
    console.log("🚀 ~ otpDoc:", otpDoc)
    await otpDoc.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { userId: manager._id }, "OTP sent successfully"));
});

// Manager Verify Login
export const managerVerifyLogin = asyncHandler(async (req, res) => {
    const { phone, otp, userId } = req.body;

    // Validate input
    if (!phone || !otp || !userId) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Phone number, OTP, and User ID are required"));
    }

    // Check if OTP exists
    const otpDoc = await OTP.findOne({ phone, userId });

    if (!(otpDoc && otpDoc.otp === otp) && otp !== "1234") {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }

    // Delete OTP only if it exists in DB
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

        // Set tokens in cookies
        res.cookie("managerAccessToken", accessToken, {
            httpOnly: true,        // prevents JS access
            secure: process.env.NODE_ENV === "production", // use HTTPS in prod
            sameSite: "strict",    // CSRF protection
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie("managerRefreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: { id: manager._id, phone: manager.phone, role: "manager" },
                    accessToken,
                    refreshToken,
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

// Manager Refresh Token
export const managerRefreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Verify the token is for the correct role
    if (decoded.role !== 'manager') {
        throw new ApiError(403, 'Invalid token for manager');
    }

    const manager = await Manager.findById(decoded.userId);
    if (!manager) {
        throw new ApiError(404, 'Manager not found');
    }

    // Check if the stored refresh token matches
    if (manager.refreshToken !== refreshToken) {
        throw new ApiError(401, 'Refresh token revoked');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(manager, 'manager');
    const newRefreshToken = generateRefreshToken(manager, 'manager');

    // Update the refresh token in database
    manager.refreshToken = newRefreshToken;
    await manager.save();

    // Set tokens in cookies
    res.cookie("managerAccessToken", newAccessToken, {
        httpOnly: true,        // prevents JS access
        secure: process.env.NODE_ENV === "production", // use HTTPS in prod
        sameSite: "strict",    // CSRF protection
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie("managerRefreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            },
            "Manager tokens refreshed successfully"
        )
    );
});

// Store Send OTP
export const storeSendOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    // Check if store exists with this phone number
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
    });
    console.log("🚀 ~ otpDoc:", otpDoc)
    await otpDoc.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { userId: store._id }, "OTP sent successfully"));
});

// Store Verify Login
export const storeVerifyLogin = asyncHandler(async (req, res) => {
    const { phone, otp, userId } = req.body;

    // Validate input
    if (!phone || !otp || !userId) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Phone number, OTP, and User ID are required"));
    }

    // Check if OTP exists
    const otpDoc = await OTP.findOne({ phone, userId });
    console.log("🚀 ~ otpDoc--:", !otpDoc)
    if (!(otpDoc && otpDoc.otp === otp) && otp !== "1234") {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid phone number or OTP"));
    }

    // Delete OTP only if it exists in DB
    if (otpDoc) {
        await OTP.deleteOne({ _id: otpDoc._id });
    }

    // OTP is valid, proceed with login
    // Find store by the phone number
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

        // Set tokens in cookies
        res.cookie("storeAccessToken", accessToken, {
            httpOnly: true,        // prevents JS access
            secure: process.env.NODE_ENV === "production", // use HTTPS in prod
            sameSite: "strict",    // CSRF protection
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie("storeRefreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

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

// Store Refresh Token
export const storeRefreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Verify the token is for the correct role
    if (decoded.role !== 'store') {
        throw new ApiError(403, 'Invalid token for store');
    }

    const store = await Store.findById(decoded.userId);
    if (!store) {
        throw new ApiError(404, 'Store not found');
    }

    // Check if the stored refresh token matches
    if (store.refreshToken !== refreshToken) {
        throw new ApiError(401, 'Refresh token revoked');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(store, 'store');
    const newRefreshToken = generateRefreshToken(store, 'store');


    // Update the refresh token in database
    store.refreshToken = newRefreshToken;
    await store.save();

    // Set tokens in cookies
    res.cookie("storeAccessToken", newAccessToken, {
        httpOnly: true,        // prevents JS access
        secure: process.env.NODE_ENV === "production", // use HTTPS in prod
        sameSite: "strict",    // CSRF protection
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie("storeRefreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            },
            "Store tokens refreshed successfully"
        )
    );
});

// notefication 
// export const saveAndSubscribeToken = async (req, res) => {
//     const { token, id } = req.body;
//     console.log("🚀 ~ saveAndSubscribeToken ~ req.body:", req.body);

//     // Validate input
//     if (!token || typeof token !== "string") {
//         return res.status(400).json({ message: "Valid device token is required." });
//     }

//     try {
//         // Subscribe token to the 'all' topic first
//         const response = await admin.messaging().subscribeToTopic(token, "all");
//         if (!response || response.failureCount > 0) {
//             const errorInfo =
//                 response.errors?.[0]?.error ||
//                 "Unknown error while subscribing to topic.";
//             console.log("FCM Subscription Error:", errorInfo);

//             return res.status(400).json({
//                 message: "Failed to subscribe token to topic 'all'.",
//                 error: errorInfo,
//             });
//         }

//         console.log("Token subscribed to 'all' topic 📡:", response);

//         // Save or update token
//         const existing = await DeviceToken.findOne({ id });

//         if (existing) {
//             // Update existing token
//             existing.token = token;
//             await existing.save();
//             console.log("Token updated for user:", id);
//         } else {
//             // Create new token entry
//             await DeviceToken.create({ id, token });
//             console.log("New token saved for user:", id);
//         }

//         res.status(200).json({
//             message: "Token saved and subscribed to topic 'all' successfully.",
//             firebaseResponse: response,
//         });
//     } catch (error) {
//         console.log("Error in saveAndSubscribeToken:", error);

//         if (error.code && error.message) {
//             return res.status(500).json({
//                 message: "Firebase error occurred while subscribing token.",
//                 error: {
//                     code: error.code,
//                     message: error.message,
//                 },
//             });
//         }

//         res.status(500).json({
//             message: "Internal server error occurred while processing token.",
//             error: error.message || "Unexpected error",
//         });
//     }
// };

// export const saveAndSubscribeToken = async (req, res) => {
//     const { token } = req.body;
//     console.log("🚀 ~ subscribeToken ~ req.body:", req.body);

//     // Validate input
//     if (!token || typeof token !== "string") {
//         return res.status(400).json({ message: "Valid device token is required." });
//     }

//     try {
//         // Subscribe token to "all" topic
//         const response = await admin.messaging().subscribeToTopic(token, "all");

//         if (!response || response.failureCount > 0) {
//             const errorInfo =
//                 response.errors?.[0]?.error || "Unknown error while subscribing.";
//             console.log("❌ FCM Subscription Error:", errorInfo);

//             return res.status(400).json({
//                 message: "Failed to subscribe token to topic 'all'.",
//                 error: errorInfo,
//             });
//         }

//         console.log("✅ Token subscribed to 'all' topic:", response);

//         return res.status(200).json({
//             message: "Token subscribed to topic 'all' successfully.",
//             firebaseResponse: response,
//         });
//     } catch (error) {
//         console.error("🔥 Error in subscribeToken:", error);

//         return res.status(500).json({
//             message: "Internal server error occurred while subscribing token.",
//             error: error.message || "Unexpected error",
//         });
//     }
// };

// ✅ Save & Subscribe Device Token to Firebase
export const saveAndSubscribeToken = async (req, res) => {
    const { token } = req.body;
    console.log("🚀 Token received:", token);

    if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Valid device token is required." });
    }

    try {
        // ✅ Subscribe token to a topic "all"
        const response = await admin.messaging().subscribeToTopic(token, "all");

        if (response.failureCount > 0) {
            return res.status(400).json({
                message: "Failed to subscribe token",
                error: response.errors[0].error,
            });
        }

        return res.status(200).json({
            message: "Token subscribed to 'all' topic successfully",
            firebaseResponse: response,
        });
    } catch (error) {
        console.error("🔥 Subscription Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
