import chalk from "chalk";
import deliveryPartnerModel from "../src/models/deliveryPartner/deliveryPartner.model.js";
import { asyncHandler } from "../src/utils/asyncHandler.js";

const seedDeliveryPartnerData = asyncHandler(async () => {
    try {
        const isDeliveryPartnerExists = await deliveryPartnerModel.findOne({ phone: "6370404471" });

        if (isDeliveryPartnerExists) {
            // console.log(chalk.blue("Delivery partner already exists."));
            return;
        }

        console.log("Seeding delivery partner data...");
        // Add your seeding logic here
        const deliveryPartnerData = {
            name: "sangam",
            phone: "6370404471"
        }

        const deliveryPartner = await deliveryPartnerModel.create(deliveryPartnerData);
        console.log(chalk.green("Delivery partner data seeded successfully:"),
            // deliveryPartner
        );
    } catch (error) {
        console.log(chalk.red("Error seeding delivery partner data:"), error)
    }
})

export default seedDeliveryPartnerData;
