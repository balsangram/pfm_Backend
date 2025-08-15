import chalk from "chalk";
import adminModel from "../src/models/admin/admin.model.js";

async function seedAdminData() {
    try {
        const isAdminExists = await adminModel.findOne({ email: "admin@pfm.com" });

        if (isAdminExists) {
            console.log(chalk.blue("Admin user already exists."));
            return;
        }

        console.log("Seeding admin data...");
        // Add your seeding logic here
        const adminData = {
            firstName: "Admin",
            lastName: "User",
            phone: "1234567890",
            email: "admin@pfm.com",
            password: "1234"
        }

        const admin = await adminModel.create(adminData);
        console.log(chalk.green("Admin data seeded successfully:"),
            // admin
        );
    } catch (error) {
        console.log(chalk.red("Error seeding admin data:", error));
    }
}

export default seedAdminData;