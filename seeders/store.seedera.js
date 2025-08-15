import chalk from "chalk";
import storeModel from "../src/models/store/store.model.js";

async function seedStoreData() {
    try {

        const isStoreExist = await storeModel.findOne({ phone: "6370404471" });

        if (isStoreExist) {
            console.log(chalk.blue("Store already exists."));
            return;
        }

        console.log("Seeding store data...");
        // Add your seeding logic here
        const storeData = {
            name: "Priya Fresh Meat RR Nagar",
            location: "789 Commercial Avenue,R R Nagar, Bengaluru, Karnataka, India",
            phone: "6370404471"
        }

        const store = await storeModel.create(storeData);
        console.log(chalk.green("Store data seeded successfully:"),
            // store
        );
    } catch (error) {
        console.log(chalk.red("Error seeding store data:", error));
    }
}

export default seedStoreData;
