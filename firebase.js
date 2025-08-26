import admin from "firebase-admin";
import { serviceAccount } from "./pfmbackend-6754a-firebase-adminsdk-fbsvc-b8e6b8fbfb.js";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;
