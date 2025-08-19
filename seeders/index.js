import seedAdminData from "./admin.seeders.js";
import seedManagerData from "./manager.seeders.js";
import seedStoreData from "./store.seeders.js";
import seedUserData from "./customer.seeders.js";

async function allSeeders() {
    try {
        console.log("🌱 Starting data seeding process...");
        
        await seedAdminData();
        // Note: Delivery partners are managed dynamically through admin interface
        // await seedManagerData();
        // await seedStoreData();
        // await seedUserData();

        console.log("✅ All seeders completed successfully!");
        // Removed process.exit(0) to allow server to continue running
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        // Removed process.exit(1) to allow server to continue running even if seeding fails
        console.log("⚠️ Continuing server startup despite seeding errors...");
    }
}

export default allSeeders;