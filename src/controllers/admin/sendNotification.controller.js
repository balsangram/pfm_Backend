import mongoose from "mongoose";
import Notification from "../../models/notification/notification.model.js";
import Customer from "../../models/customer/customer.model.js";
import moment from "moment-timezone";
import admin from "../../../firebase.js";

const IST_TIMEZONE = "Asia/Kolkata";

// ✅ Send Notification to All Subscribed Devices
export const sendCustomerNotification = async (req, res) => {
    const { title, body, link, img } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: "Title and body are required" });
    }

    try {
        // ✅ Build notification payload
        const message = {
            notification: {
                title,
                body,
                image: img || undefined,
            },
            topic: "all", // 👈 Instead of tokens[]
            android: { priority: "high" },
            apns: { payload: { aps: { sound: "default" } } },
            webpush: {
                notification: {
                    title,
                    body,
                    icon: img || "icon.png",
                },
                fcm_options: { link: link || "https://yourwebsite.com" },
            },
            data: link ? { link } : {},
        };

        // ✅ Send notification
        const response = await admin.messaging().send(message);

        // ✅ Optionally save to DB
        await Notification.create({
            title,
            body,
            link: link ?? "",
            img: img ?? "",
            NotificationTime: moment().tz(IST_TIMEZONE).toDate(),
            sent: true,
        });

        return res.status(200).json({
            message: "Notification sent successfully to topic 'all'",
            firebaseResponse: response,
            sentAtIST: moment().tz(IST_TIMEZONE).format("YYYY-MM-DD HH:mm"),
        });
    } catch (error) {
        console.error("🔥 Error sending notifications:", error);
        return res.status(500).json({ message: "Failed to send notifications", error: error.message });
    }
};

