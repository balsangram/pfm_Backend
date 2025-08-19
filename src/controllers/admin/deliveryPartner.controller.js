import { asyncHandler } from "../../utils/asyncHandler.js";


const getDeliveryPartners = asyncHandler(async (req, res) => {

});

const createDeliveryPartner = asyncHandler(async (req, res) => {
    // Logic for creating a new delivery partner
});

const updateDeliveryPartner = asyncHandler(async (req, res) => {
    // Logic for updating a delivery partner
});

const deleteDeliveryPartner = asyncHandler(async (req, res) => {
    // Logic for deleting a delivery partner
});

export const DeliveryPartnerController = {
    getDeliveryPartners,
    createDeliveryPartner,
    updateDeliveryPartner,
    deleteDeliveryPartner
};
