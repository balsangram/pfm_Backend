import { ACCESS_TOKEN_SECRET } from "../../config/config.dotenv.js";
import Admin from "../../models/admin/admin.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cloudinary from "../../utils/cloudinary.js"; // make sure you set this up


const adminProfile = asyncHandler(async (req, res, next) => {
    try {
        // 1️⃣ Get token from Authorization header (Bearer <token>)
        let token = null;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) throw new ApiError(401, "Not authorized, token missing");

        // 2️⃣ Decode JWT to get userId
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

        // 3️⃣ Extract actual MongoDB ObjectId
        const adminId = decoded.userId;

        // 4️⃣ Fetch admin by ID
        const admin = await Admin.findById(adminId).select("-password");
        if (!admin) throw new ApiError(404, "Admin not found");

        return res
            .status(200)
            .json(new ApiResponse(200, admin, "Admin profile fetched successfully"));
    } catch (error) {
        next(error);
    }
});


// const adminUpdateProfile = asyncHandler(async (req, res) => {
//     const { firstName, lastName, phone, email } = req.body;

//     // Get admin ID from JWT token
//     const token = req.cookies?.accessToken;
//     if (!token) throw new ApiError(401, "Not authorized, token missing");

//     const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
//     const adminId = decoded.userId;

//     // Update admin profile
//     const updatedAdmin = await Admin.findByIdAndUpdate(
//         adminId,
//         { firstName, lastName, phone, email }, // ✅ use correct fields
//         { new: true, runValidators: true }
//     ).select("-password");

//     if (!updatedAdmin) {
//         throw new ApiError(404, "Admin not found");
//     }

//     return res.status(200).json(
//         new ApiResponse(200, updatedAdmin, "Profile updated successfully")
//     );
// });

const adminUpdateProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, email } = req.body;

    // Get admin ID from JWT token
    const token = req.cookies?.accessToken;
    if (!token) throw new ApiError(401, "Not authorized, token missing");

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const adminId = decoded.userId;

    let updateData = { firstName, lastName, phone, email };

    // ✅ Handle image upload if provided
    if (req.files && req.files.length > 0) {
        const file = req.files[0]; // taking first file
        const uploadedImg = await cloudinary.uploader.upload(file.path, {
            folder: "admin_profiles", // optional folder in cloudinary
        });
        updateData.img = uploadedImg.secure_url; // store URL in DB
    }

    // Update admin profile
    const updatedAdmin = await Admin.findByIdAndUpdate(
        adminId,
        updateData,
        { new: true, runValidators: true }
    ).select("-password");

    if (!updatedAdmin) {
        throw new ApiError(404, "Admin not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedAdmin, "Profile updated successfully")
    );
});


const adminDeleteAccount = asyncHandler(async (req, res) => {
    // 1️⃣ Get JWT from cookies
    const token = req.cookies?.accessToken;
    if (!token) throw new ApiError(401, "Not authorized, token missing");

    // 2️⃣ Decode token to get adminId
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const adminId = decoded.userId;
    console.log("🚀 ~ adminId:", adminId)

    // 3️⃣ Delete admin account
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
        throw new ApiError(404, "Admin not found");
    }

    // 4️⃣ Clear the access token cookie
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    // 5️⃣ Return response
    return res.status(200).json(
        new ApiResponse(200, null, "Admin account deleted successfully")
    );
});

const adminChangePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get admin ID from JWT token
    const token = req.cookies?.accessToken;
    if (!token) throw new ApiError(401, "Not authorized, token missing");

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    // console.log("🚀 ~ decoded:", decoded)
    const adminId = decoded.userId;
    // console.log("🚀 ~ adminId:", adminId)

    // Find admin by ID
    const admin = await Admin.findById(adminId);
    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
        throw new ApiError(400, "Current password is incorrect");
    }

    // Update password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Password changed successfully")
    );
});

const adminLogout = asyncHandler(async (req, res) => {
    // Logic for admin logout
});



export const AdminProfileController = {
    adminProfile,
    adminUpdateProfile,
    adminDeleteAccount,
    adminChangePassword,
    adminLogout,
};