import seedAdminData from "./admin.seeders.js";
import seedDeliveryPartnerData from "./deliveryPartner.seeders.js";
import seedManagerData from "./manager.seeders.js";
import seedStoreData from "./store.seeders.js";
import seedUserData from "./user.seeders.js";

async function allSeeders() {
    try {
        console.log("Seeding data...");
        await seedAdminData();
        await seedDeliveryPartnerData();
        await seedManagerData();
        await seedStoreData();
        await seedUserData();

    } catch (error) {
        console.log("Error seeding data:", error);
        process.exit(1); // exit process if seeding fails
    }
}
export default allSeeders;