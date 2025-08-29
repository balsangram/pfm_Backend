import Notification from "../../models/notification/notification.model.js";
import Customer from "../../models/customer/customer.model.js";
import moment from "moment-timezone";
import admin from "../../../firebase.js";

const IST_TIMEZONE = "Asia/Kolkata";

// export const sendCustomerNotification = async (req, res) => {
//     const { title, body, link } = req.body;

//     // Validate required fields
//     if (!title || !body) {
//         return res.status(400).json({ message: "Title and body are required" });
//     }

//     try {
//         // Find customers with device tokens
//         const customers = await Customer.find({ fcToken: { $exists: true, $ne: [] } });
//         if (!customers.length) {
//             return res.status(200).json({ message: "No customers with device tokens found" });
//         }

//         // Collect all tokens
//         const allTokens = customers.flatMap((c) => c.fcToken);

//         // Save notification in DB
//         const notification = new Notification({
//             title,
//             body,
//             link: link ?? "",
//             fcToken: allTokens,
//             NotificationTime: moment().tz(IST_TIMEZONE).toDate(),
//             sent: false,
//         });
//         await notification.save();

//         // Prepare Firebase multicast message
//         const message = {
//             notification: { title, body },
//             tokens: allTokens,
//             android: { priority: "high" },
//             apns: {
//                 payload: { aps: { sound: "default", "content-available": 1 } },
//             },
//             webpush: {
//                 notification: { title, body, icon: "icon.png" },
//                 fcm_options: { link: link || "https://yourwebsite.com" },
//             },
//             data: link ? { link } : {},
//         };

//         // Send notification
//         const response = await admin.messaging().sendMulticast(message);

//         // Update notification status
//         const sentStatus = response.successCount > 0;
//         await Notification.findByIdAndUpdate(notification._id, { sent: sentStatus });

//         return res.status(200).json({
//             message: "Notification sent to all customers",
//             totalCustomers: customers.length,
//             totalTokens: allTokens.length,
//             notification,
//             firebaseResponse: response,
//             sentAtIST: moment().tz(IST_TIMEZONE).format("YYYY-MM-DD HH:mm"),
//         });
//     } catch (error) {
//         console.error("Error sending notifications:", error.message);
//         return res.status(500).json({
//             message: "Failed to send notifications",
//             error: error.message,
//         });
//     }
// };

export const sendCustomerNotification = async (req, res) => {
    const { title, body, link } = req.body;

    // Validate required fields
    if (!title || !body) {
        return res.status(400).json({ message: "Title and body are required" });
    }

    try {
        // Find customers with device tokens
        const customers = await Customer.find({ fcToken: { $exists: true, $ne: [] } });

        // Collect all tokens (may be empty)
        const allTokens = customers.flatMap((c) => c.fcToken);

        // Save notification in DB
        const notification = new Notification({
            title,
            body,
            link: link ?? "",
            fcToken: allTokens,
            NotificationTime: moment().tz(IST_TIMEZONE).toDate(),
            sent: false,
        });
        await notification.save();

        let response = null;
        let sentStatus = false;

        if (allTokens.length > 0) {
            // Prepare Firebase multicast message
            const message = {
                notification: { title, body },
                tokens: allTokens,
                android: { priority: "high" },
                apns: {
                    payload: { aps: { sound: "default", "content-available": 1 } },
                },
                webpush: {
                    notification: { title, body, icon: "icon.png" },
                    fcm_options: { link: link || "https://yourwebsite.com" },
                },
                data: link ? { link } : {},
            };

            // Send notification
            response = await admin.messaging().sendMulticast(message);

            // Update notification status
            sentStatus = response.successCount > 0;
            await Notification.findByIdAndUpdate(notification._id, { sent: sentStatus });
        }

        return res.status(200).json({
            message: "Notification processed successfully",
            totalCustomers: customers.length,
            totalTokens: allTokens.length,
            notification,
            firebaseResponse: response || "No tokens found, notification stored only",
            sentAtIST: moment().tz(IST_TIMEZONE).format("YYYY-MM-DD HH:mm"),
        });
    } catch (error) {
        console.error("Error sending notifications:", error.message);
        return res.status(500).json({
            message: "Failed to send notifications",
            error: error.message,
        });
    }
};


// export const saveAndSubscribeToken = async (req, res) => {
//     const { token, customerId } = req.body;

//     // Validate input
//     if (!token || typeof token !== "string") {
//         return res.status(400).json({ message: "Valid device token is required" });
//     }
//     if (!customerId) {
//         return res.status(400).json({ message: "Customer ID is required" });
//     }

//     try {
//         // Subscribe token to 'all' topic
//         const response = await admin.messaging().subscribeToTopic(token, "all");
//         if (response.failureCount > 0) {
//             const errorInfo = response.errors?.[0]?.error || "Unknown error while subscribing";
//             return res.status(400).json({
//                 message: "Failed to subscribe token to topic 'all'",
//                 error: errorInfo,
//             });
//         }

//         // Save token to customer's fcToken array (avoid duplicates)
//         const customer = await Customer.findById(customerId);
//         if (!customer) {
//             return res.status(404).json({ message: "Customer not found" });
//         }

//         if (!customer.fcToken.includes(token)) {
//             customer.fcToken.push(token);
//             await customer.save();
//         }

//         return res.status(200).json({
//             message: "Token saved and subscribed to topic 'all' successfully",
//             firebaseResponse: response,
//             customerId,
//             totalTokens: customer.fcToken.length,
//         });
//     } catch (error) {
//         console.error("Error in saveAndSubscribeToken:", error.message);
//         return res.status(500).json({
//             message: "Failed to process token",
//             error: error.message,
//         });
//     }
// };