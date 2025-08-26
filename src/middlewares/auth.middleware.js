// src/middlewares/auth.middleware.js

import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// Example: If you want to do a single "User" collection with a "role" field
// Or you can do separate models and fetch them individually (shown below).
import Admin from "../models/admin/admin.model.js";
import DeliveryPartner from "../models/deliveryPartner/deliveryPartner.model.js";
import Manager from "../models/manager/manager.model.js";
import Store from "../models/store/store.model.js";
import Customer from "../models/customer/customer.model.js";
import { ACCESS_TOKEN_SECRET } from "../config/config.dotenv.js";

/**
 * verifyJWT
 *  - Checks for a JWT token in Authorization headers.
 *  - Decodes token, finds user in DB (admin/driver/customer).
 *  - Attach user to req.user.
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
    // Check token in headers: "Authorization: Bearer <token>"
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        throw new ApiError(401, "Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "No token provided");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }

    const { userId, role } = decoded; // We assume we stored userId + role in token
    console.log('🔍 verifyJWT: Token decoded:', { userId, role });

    // Find user in the relevant model
    let user;
    if (role === "admin") {
        user = await Admin.findById(userId);
    } else if (role === "deliveryPartner") {
        user = await DeliveryPartner.findById(userId);
    } else if (role === "manager") {
        user = await Manager.findById(userId);
    } else if (role === "store") {
        user = await Store.findById(userId);
    } else if (role === "customer") {
        user = await Customer.findById(userId);
    }

    if (!user) {
        throw new ApiError(401, "User not found or inactive");
    }

    // Attach user + role to request
    req.user = user;
    req.userRole = role;
    
    console.log('🔍 verifyJWT: User attached to request:', {
        userId: user._id,
        userRole: req.userRole,
        role: role
    });

    return next();
});

/**
 * verifyRole
 *  - A middleware factory to check if the user has one of the allowed roles
 *  - E.g. verifyRole("admin") => only admin can access route
 */
export const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('🔍 verifyRole: Checking role permissions:', {
            allowedRoles,
            userRole: req.userRole,
            hasUser: !!req.user,
            userKeys: req.user ? Object.keys(req.user) : 'No user'
        });
        
        if (!req.user || !allowedRoles.includes(req.userRole)) {
            console.log('❌ verifyRole: Access denied - insufficient permissions');
            throw new ApiError(403, "Forbidden: Insufficient permissions");
        }
        
        console.log('✅ verifyRole: Access granted for role:', req.userRole);
        next();
    };
};
