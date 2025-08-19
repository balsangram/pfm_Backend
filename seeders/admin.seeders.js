import chalk from "chalk";
import bcrypt from "bcrypt"; // Added bcrypt for password hashing
import adminModel from "../src/models/admin/admin.model.js";
import { asyncHandler } from "../src/utils/asyncHandler.js";

const seedAdminData = asyncHandler(async () => {
    try {
        // Check if admin already exists
        const isAdminExists = await adminModel.findOne({ email: "admin@pfm.com" });

        if (isAdminExists) {
            // console.log(chalk.blue("Admin user already exists."));
            return;
        }

        console.log(chalk.yellow("Seeding admin data..."));

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash("1234", 10); // Use a secure password in production
        // console.log("🚀 ~ hashedPassword:", hashedPassword)

        // Admin data with hashed password
        const adminData = {
            firstName: "Admin",
            lastName: "User",
            phone: "1234567890",
            email: "admin@pfm.com",
            password: hashedPassword,
        };

        // Create admin user
        const admin = await adminModel.create(adminData);

        console.log(
            chalk.green("Admin data seeded successfully:"),
            chalk.cyan(`Email: ${admin.email}, ID: ${admin._id}`)
        );
    } catch (error) {
        console.error(
            chalk.red("Error seeding admin data:"),
            chalk.red(error.message)
        );
        throw error; // Re-throw to let asyncHandler handle the error
    }
});

export default seedAdminData;