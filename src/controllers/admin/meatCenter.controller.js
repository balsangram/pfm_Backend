import { asyncHandler } from "../../utils/asyncHandler.js";
import { meatCenterSchemaAdd } from "../../validations/admin.validation.js";
import Manager from "../../models/manager/manager.model.js";
// meatCenter = manager 
const getMeatCenters = asyncHandler(async (req, res) => {

});

const createMeatCenter = asyncHandler(async (req, res) => {
    // Validate the request body first
    const { error } = meatCenterSchemaAdd(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { firstName, lastName, email, phone, storeName, storeLocation, lat, long, Products } = req.body;

    // Logic to create meat center in DB
    const meatCenter = await Manager.create({
        firstName,
        lastName,
        email,
        phone,
        storeName,
        storeLocation,
        lat,
        long,
        Products
    });
    

    res.status(201).json({ message: 'Meat center created successfully', meatCenter });
});


const updateMeatCenter = asyncHandler(async (req, res) => {
    // Logic for updating a meat center
});

const deleteMeatCenter = asyncHandler(async (req, res) => {
    // Logic for deleting a meat center
});

export const MeatCenterController = {
    getMeatCenters,
    createMeatCenter,
    updateMeatCenter,
    deleteMeatCenter
};
