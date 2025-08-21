import mongoose from "mongoose";

const contactUsSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['DeliveryPartner', 'Customer'], // only these values allowed
        required: true
    }
}, {
    timestamps: true // adds createdAt and updatedAt automatically
});

// Optional: index for faster lookup
contactUsSchema.index({ phone: 1 });

export default mongoose.model("ContactUs", contactUsSchema);
