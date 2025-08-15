import { connectDB } from "../src/cinfig/db.js";
import seedAdminData from "./admin.seeders.js";
import seedDeliveryPartnerData from "./deliveryPartner.seeders.js";
import seedManagerData from "./manager.seeders.js";
import seedStoreData from "./store.seedera.js";

async function allSeeders() {
    try {
        console.log("Seeding data...");
        await seedAdminData();
        await seedDeliveryPartnerData();
        await seedManagerData();
        await seedStoreData();

    } catch (error) {
        console.log("Error seeding data:", error);
        process.exit(1); // exit process if seeding fails
    }
}
export default allSeeders;