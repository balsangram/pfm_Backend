import express from "express";
import cors from "cors";
import adminRoutes from "./src/routes/admin.routes.js";
import managerRoutes from "./src/routes/manager.routes.js";
import storeRoutes from "./src/routes/store.routes.js";
import deliveryPartnerRoutes from "./src/routes/deliveryPartner.routes.js";
import customerRoutes from "./src/routes/customer.routes.js";
import cookieParser from 'cookie-parser'
import { saveAndSubscribeToken } from "./src/controllers/auth.controller.js";

const app = express();

// CORS configuration for frontend
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'https://pfm.kods.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    allowedHeaders: ["*"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser())

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Request body type:', typeof req.body);
    console.log('🔍 Request body keys:', req.body ? Object.keys(req.body) : 'No body');
    next();
});

// Example route
app.get('/', (req, res) => {
    res.send('Server is running! 28-08-2025');
});

app.get('/api/example', (req, res) => {
    res.json({ message: 'Example route' });
});

// notefication 
app.use("/deviceToken", saveAndSubscribeToken);


// Routes
app.use("/admin", adminRoutes);
app.use("/customer", customerRoutes);
app.use("/manager", managerRoutes);
app.use("/store", storeRoutes);
app.use("/deliveryPartner", deliveryPartnerRoutes);

export { app }