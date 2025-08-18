import chalk from "chalk";
import managerModel from "../src/models/manager/manager.model.js";
import Store from "../src/models/store/store.model.js";
import { asyncHandler } from "../src/utils/asyncHandler.js";

const seedManagerData = asyncHandler(async () => {
    try {
        const isManagerExist = await managerModel.findOne({ phone: "1234567890" });

        if (isManagerExist) {
            // console.log(chalk.blue("✅ Manager already exists."));
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


        // Step 2: Create manager linked to store
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
        console.log(chalk.green("✅ Manager data seeded successfully:"), manager);
    } catch (error) {
        console.log(chalk.red("❌ Error seeding manager data:", error));
    }
});

export default seedManagerData;
