import chalk from "chalk";
import managerModel from "../src/models/manager/manager.model.js";
import Store from "../src/models/store/store.model.js";
import { asyncHandler } from "../src/utils/asyncHandler.js";

const seedManagerData = asyncHandler(async () => {
    try {
        const isManagerExist = await managerModel.findOne({ phone: "1234567890" });
        const isSecondManagerExist = await managerModel.findOne({ phone: "9876543210" });

        if (isManagerExist && isSecondManagerExist) {
            // console.log(chalk.blue("✅ Managers already exist."));
            return;
        }

        console.log(chalk.yellow("Seeding manager and store data..."));

        // Step 1: Create or find store
        let store = await Store.findOne({ name: "Priya Fresh Meat RR Nagar" });
        if (!store) {
            store = await Store.create({
                name: "Priya Fresh Meat RR Nagar",
                location: "789 Commercial Avenue, R R Nagar, Bengaluru, Karnataka, India"
            });
            console.log(chalk.green("✅ Store created successfully."));
        }

        // Step 2: Create first manager linked to store (if doesn't exist)
        if (!isManagerExist) {
            const managerData = {
                firstName: "Aditya",
                lastName: "Tripathy",
                email: "aditya@example.com",
                password: "hashedPassword",
                phone: "1234567890",
                location: "456 Business Street, Bengaluru, Karnataka, India",
                store: store._id
            };

            const manager = await managerModel.create(managerData);
            console.log(chalk.green("✅ First manager data seeded successfully:"), manager);
        }

        // Step 3: Create second manager with phone "9876543210" (if doesn't exist)
        if (!isSecondManagerExist) {
            const secondManagerData = {
                firstName: "Priya",
                lastName: "Manager",
                email: "priya@example.com",
                password: "hashedPassword",
                phone: "9876543210",
                location: "123 Main Street, Bengaluru, Karnataka, India",
                store: store._id
            };

            const secondManager = await managerModel.create(secondManagerData);
            console.log(chalk.green("✅ Second manager data seeded successfully:"), secondManager);
        }
    } catch (error) {
        console.log(chalk.red("❌ Error seeding manager data:", error));
    }
});

export default seedManagerData;
