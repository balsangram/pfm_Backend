import chalk from "chalk";
import managerModel from "../src/models/manager/manager.model.js";

async function seedManagerData() {
    try {
        const isManagerExist = await managerModel.findOne({ phone: "1234567890" });

        if (isManagerExist) {
            console.log(chalk.blue("Manager already exists."));
            return;
        }

        console.log("Seeding manager data...");
        // Add your seeding logic here
        const managerData = {
            firstName: "Aditya",
            lastName: "Tripathy",
            email: "aditya@example.com",
            phone: "1234567890",
            location: "456 Business Street, Bengaluru, Karnataka, India",
            storeName: "Priya Fresh Meat RR Nagar",
            storeLocation: "789 Commercial Avenue,R R Nagar, Bengaluru, Karnataka, India"
        }

        const manager = await managerModel.create(managerData);
        console.log(chalk.green("Manager data seeded successfully:"),
            // manager
        );
    } catch (error) {
        console.log(chalk.red("Error seeding manager data:", error));
    }
}

export default seedManagerData;