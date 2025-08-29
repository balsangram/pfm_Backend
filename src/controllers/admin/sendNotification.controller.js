import mongoose from "mongoose";
import Notification from "../../models/notification/notification.model.js";
import Customer from "../../models/customer/customer.model.js";
import moment from "moment-timezone";
import admin from "../../../firebase.js";

const IST_TIMEZONE = "Asia/Kolkata";

// ✅ Send notification
export const sendCustomerNotification = async (req, res) => {
    const { title, body, link, img } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: "Title and body are required" });
    }

    try {
        // ✅ Get customer tokens
        const customers = await Customer.find({ fcToken: { $exists: true, $ne: [] } });
        const allTokens = customers.flatMap((c) => c.fcToken);

        // ✅ Save notification in DB
        const notification = await Notification.create({
            title,
            body,
            link: link ?? "",
            img: img ?? "",
            fcToken: allTokens,
            NotificationTime: moment().tz(IST_TIMEZONE).toDate(),
            sent: false,
        });

        let response = null;
        let sentStatus = false;

        if (allTokens.length > 0) {
            // ✅ Build notification payload (with image support)
            const message = {
                notification: {
                    title,
                    body,
                    image: img || undefined, // 👈 image field added
                },
                tokens: allTokens,
                android: { priority: "high" },
                apns: { payload: { aps: { sound: "default" } } },
                webpush: {
                    notification: {
                        title,
                        body,
                        icon: img || "icon.png", // 👈 web icon fallback
                    },
                    fcm_options: { link: link || "https://yourwebsite.com" },
                },
                data: link ? { link } : {},
            };

            // ✅ Send notification
            response = await admin.messaging().sendMulticast(message);

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
