import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 120, // OTP expires in 2 min
    },
});

// Pre-save middleware
otpSchema.pre("save", async function (next) {
    try {
        // Remove existing OTP for the same userId before saving a new one
        await mongoose.model("OTP").deleteMany({ userId: this.userId });
        next();
    } catch (err) {
        next(err);
    }
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
