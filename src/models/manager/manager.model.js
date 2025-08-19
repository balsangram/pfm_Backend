import mongoose from "mongoose";

const managerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // location: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //     minlength: 5,
    //     maxlength: 200
    // },
    // userLocation: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //     minlength: 5,
    //     maxlength: 200
    // },
    storeName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    storeLocation: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 300
    },
    // address: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //     minlength: 10,
    //     maxlength: 300
    // },
    lat: {
        type: Number,
        required: true
    },
    long: {
        type: Number,
        required: true
    },
    // store: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Store",
    //     required: true
    // },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
managerSchema.index({ email: 1 });
managerSchema.index({ phone: 1 });
managerSchema.index({ store: 1 });

export default mongoose.model("Manager", managerSchema);