import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Contact from '../../models/contactUs.model.js';
import mongoose from 'mongoose';

const getAllContacts = asyncHandler(async (req, res) => {
    const contacts = await Contact.find();
    return res.status(200).json(new ApiResponse(200, contacts, "All contacts fetched successfully"));
})

const addContact = asyncHandler(async (req, res) => {
    const { phone, type } = req.body;

    if (!phone || !type) {
        throw new ApiError(400, "Phone and type are required");
    }

    // Validate type against enum
    if (!['DeliveryPartner', 'Customer'].includes(type)) {
        throw new ApiError(400, "Invalid type. Must be 'DeliveryPartner' or 'Customer'");
    }

    const contact = await Contact.create({ phone, type });
    return res.status(201).json(new ApiResponse(201, contact, "Contact added successfully"));
})

const updateContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { phone, type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid contact ID");
    }

    const contact = await Contact.findById(id);
    if (!contact) {
        throw new ApiError(404, "Contact not found");
    }

    if (phone) contact.phone = phone;
    if (type) {
        if (!['DeliveryPartner', 'Customer'].includes(type)) {
            throw new ApiError(400, "Invalid type. Must be 'DeliveryPartner' or 'Customer'");
        }
        contact.type = type;
    }

    await contact.save();
    return res.status(200).json(new ApiResponse(200, contact, "Contact updated successfully"));
})

const deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid contact ID");
    }

    const contact = await Contact.findById(id);
    if (!contact) {
        throw new ApiError(404, "Contact not found");
    }

    await contact.deleteOne();
    return res.status(200).json(new ApiResponse(200, null, "Contact deleted successfully"));
})

export const contactUsController = {
    getAllContacts,
    addContact,
    updateContact,
    deleteContact
};