import Notification from "../../models/notification/notification.model.js";
import moment from "moment-timezone";
import admin from "../../../firebase.js"; // Firebase Admin SDK

const IST_TIMEZONE = "Asia/Kolkata";

export const sendCustomerNotification = async (req, res) => {
    const { title, body, deviceToken, link, NotificationTime, userId } = req.body;

    if (!title || !body || !deviceToken) {
        return res.status(400).json({
            message: "Title, body, and deviceToken are required"
        });
    }

    try {
        const notificationTime = NotificationTime
            ? new Date(NotificationTime)
            : moment().tz(IST_TIMEZONE).toDate();

        const notification = new Notification({
            title,
            body,
            link: link ?? "",
            userId: userId ?? null,
            deviceToken,
            NotificationTime: notificationTime,
            sent: false
        });
        await notification.save();

        const message = {
            notification: { title, body },
            token: deviceToken, // 👈 Send to that specific user device
            data: link ? { link } : {}
        };

        // Send immediately if no scheduling
        if (!NotificationTime) {
            const response = await admin.messaging().send(message);

            await Notification.findByIdAndUpdate(notification._id, { sent: true });

            return res.status(200).json({
                message: "Notification sent to user",
                notification,
                firebaseResponse: response,
                sentAtIST: moment().tz(IST_TIMEZONE).format("YYYY-MM-DD HH:mm")
            });
        }

        // Future schedule
        if (moment(notificationTime).tz(IST_TIMEZONE).isBefore(moment())) {
            return res.status(200).json({
                message: "Notification saved but not sent (scheduled time in the past)",
                notification
            });
        }

        await scheduleJob(notificationTime, async () => {
            try {
                const response = await admin.messaging().send(message);
                await Notification.findByIdAndUpdate(notification._id, { sent: true });
                console.log("Scheduled user notification sent:", response);
            } catch (err) {
                console.error("Error sending scheduled user notification:", err.message);
            }
        });

        return res.status(200).json({
            message: "Notification scheduled for user successfully",
            notification
        });
    } catch (error) {
        console.error("Error sending user notification:", error);
        return res.status(500).json({
            message: "Failed to send user notification",
            error: error.message
        });
    }
};

export const SendNotificationController = {
    sendCustomerNotification
};