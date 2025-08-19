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

// Example route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

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