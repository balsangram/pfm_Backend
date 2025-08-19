import mongoose from "mongoose"

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String
    },
    lat: {
        type: Number,
        required: true
    },
    long: {
        type: Number,
        required: true
    },
    products: {
        chicken: { type: Boolean, default: false },
        mutton: { type: Boolean, default: false },
        pork: { type: Boolean, default: false },
        fish: { type: Boolean, default: false },
        meat: { type: Boolean, default: false }
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Manager"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

// Indexes for better query performance
storeSchema.index({ name: 1 });
storeSchema.index({ location: 1 });
storeSchema.index({ manager: 1 });
storeSchema.index({ isActive: 1 });
storeSchema.index({ lat: 1, long: 1 });
// Ensure phone is unique only when present and not null
storeSchema.index(
    { phone: 1 },
    { unique: 1, partialFilterExpression: { phone: { $exists: true, $ne: null } } }
);

export default mongoose.model("Store", storeSchema)