import express from "express";
import cors from "cors";
import adminRoutes from "./src/routes/admin.routes.js";
import managerRoutes from "./src/routes/manager.routes.js";
import storeRoutes from "./src/routes/store.routes.js";
import deliveryPartnerRoutes from "./src/routes/deliveryPartner.routes.js";
import customerRoutes from "./src/routes/customer.routes.js";
import cookieParser from 'cookie-parser'

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser())

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Example route
app.get('/', (req, res) => {
    res.send('Server is running! 22-08-2025 3.36pm');
});

// import axios from "axios";

// const callDemoApi = async () => {
//   try {
//     const response = await axios.get(`https://pfm-backend-1gdg.onrender.com`);
//     console.log("🚀 API Response:", response.data);
//   } catch (error) {
//     console.error("❌ API Error:", error.message);
//   } finally {
//     // Schedule next call after 2 minutes
//     setTimeout(callDemoApi, 120000);
//   }
// };

// // 👉 Start the loop
// callDemoApi();


app.get('/api/example', (req, res) => {
    res.json({ message: 'Example route' });
});


// Routes
app.use("/admin", adminRoutes);
app.use("/customer", customerRoutes);
app.use("/manager", managerRoutes);
app.use("/store", storeRoutes);
app.use("/deliveryPartner", deliveryPartnerRoutes);

export { app }