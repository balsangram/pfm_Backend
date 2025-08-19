import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    refreshToken: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['verified', 'pending'],
        default: 'pending'
    },
    // Document verification status
    documentStatus: {
        idProof: {
            type: String,
            enum: ['verified', 'pending', 'rejected'],
            default: 'pending'
        },
        addressProof: {
            type: String,
            enum: ['verified', 'pending', 'rejected'],
            default: 'pending'
        },
        vehicleDocuments: {
            type: String,
            enum: ['verified', 'pending', 'rejected'],
            default: 'pending'
        },
        drivingLicense: {
            type: String,
            enum: ['verified', 'pending', 'rejected'],
            default: 'pending'
        },
        insuranceDocuments: {
            type: String,
            enum: ['verified', 'pending', 'rejected'],
            default: 'pending'
        }
    },
    // Document verification notes
    verificationNotes: {
        idProof: String,
        addressProof: String,
        vehicleDocuments: String,
        drivingLicense: String,
        insuranceDocuments: String
    },
    // Overall document verification status
    overallDocumentStatus: {
        type: String,
        enum: ['verified', 'pending', 'rejected'],
        default: 'pending'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    assignedOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    totalDeliveries: {
        type: Number,
        default: 0
    },
    totalAccepted: {
        type: Number,
        default: 0
    },
    totalRejected: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
deliveryPartnerSchema.index({ phone: 1 });
deliveryPartnerSchema.index({ status: 1 });
deliveryPartnerSchema.index({ isActive: 1 });
deliveryPartnerSchema.index({ overallDocumentStatus: 1 });

// Pre-save middleware to update overall document status
deliveryPartnerSchema.pre('save', function(next) {
    const docStatus = this.documentStatus;
    const allStatuses = Object.values(docStatus);
    
    if (allStatuses.every(status => status === 'verified')) {
        this.overallDocumentStatus = 'verified';
    } else if (allStatuses.some(status => status === 'rejected')) {
        this.overallDocumentStatus = 'rejected';
    } else {
        this.overallDocumentStatus = 'pending';
    }
    
    next();
});

export default mongoose.model("DeliveryPartner", deliveryPartnerSchema);