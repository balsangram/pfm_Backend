import Notification from "../../models/notification/notification.model.js";
import Customer from "../../models/customer/customer.model.js";
import moment from "moment-timezone";
import admin from "../../../firebase.js";

const IST_TIMEZONE = "Asia/Kolkata";

export const sendCustomerNotification = async (req, res) => {
    const { title, body, link } = req.body;

    if (!title || !body) {
        return res.status(400).json({
            message: "Title and body are required"
        });
    }

    try {
        // 1️⃣ Find all customers with at least one fcToken
        const customers = await Customer.find({ fcToken: { $exists: true, $ne: [] } });

        if (customers.length === 0) {
            return res.status(200).json({
                message: "No customers with device tokens found"
            });
        }

        // 2️⃣ Collect all tokens into a single array
        const allTokens = customers.flatMap(c => c.fcToken);

        // 3️⃣ Save notification in DB for reference
        const notification = new Notification({
            title,
            body,
            link: link ?? "",
            fcToken: allTokens,
            NotificationTime: moment().tz(IST_TIMEZONE).toDate(),
            sent: false
        });
        await notification.save();

        // 4️⃣ Prepare Firebase multicast message
        const message = {
            notification: { title, body },
            tokens: allTokens,
            data: link ? { link } : {}
        };

        // 5️⃣ Send notification to all devices
        const response = await admin.messaging().sendMulticast(message);

        // 6️⃣ Update notification as sent if at least one succeeded
        const sentStatus = response.successCount > 0;
        await Notification.findByIdAndUpdate(notification._id, { sent: sentStatus });

        return res.status(200).json({
            message: "Notification sent to all customers",
            totalCustomers: customers.length,
            totalTokens: allTokens.length,
            notification,
            firebaseResponse: response,
            sentAtIST: moment().tz(IST_TIMEZONE).format("YYYY-MM-DD HH:mm")
        });

    } catch (error) {
        console.error("Error sending notifications:", error);
        return res.status(500).json({
            message: "Failed to send notifications",
            error: error.message
        });
    }
};



export const saveAndSubscribeToken = async (req, res) => {
  const { token, customerId } = req.body;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Valid device token is required." });
  }

  try {
    // Subscribe token to 'all' topic
    const response = await admin.messaging().subscribeToTopic(token, "all");

    if (!response || response.failureCount > 0) {
      const errorInfo = response.errors?.[0]?.error || "Unknown error while subscribing.";
      return res.status(400).json({
        message: "Failed to subscribe token to topic 'all'.",
        error: errorInfo,
      });
    }

    console.log("Token subscribed to 'all' topic:", response);

    // Save token to customer's fcToken array (avoid duplicates)
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    if (!customer.fcToken.includes(token)) {
      customer.fcToken.push(token);
      await customer.save();
      console.log("Token added to customer's fcToken array");
    } else {
      console.log("Token already exists for this customer");
    }

    res.status(200).json({
      message: "Token saved and subscribed to topic 'all' successfully.",
      firebaseResponse: response,
      customerId,
      totalTokens: customer.fcToken.length,
    });
  } catch (error) {
    console.error("Error in saveAndSubscribeToken:", error);
    res.status(500).json({
      message: "Internal server error occurred while processing token.",
      error: error.message || "Unexpected error",
    });
  }
};
