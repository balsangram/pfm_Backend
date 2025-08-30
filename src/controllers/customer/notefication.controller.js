import Customer from "../../models/customer/customer.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// Fetch all notifications linked to a customer
export const displayUserNoteficatio = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Find customer and populate notifications
    const customer = await Customer.findById(userId).populate("notifications");
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    // Sort notifications by createdAt descending (latest first)
    const notifications = customer.notifications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { total: notifications.length, notifications },
            "All notifications fetched successfully"
        )
    );
});

export const noteficationControl = {
    displayUserNoteficatio
};
