import chalk from "chalk";
import customerModel from "../src/models/customer/customer.model.js";
import { asyncHandler } from "../src/utils/asyncHandler.js";

const seedCustomerData = asyncHandler(async () => {
    try {
        const isCustomerExist = await customerModel.findOne({ phone: "6370404471" });

        if (isCustomerExist) {
            // console.log(chalk.blue("Customer already exists."));
            return;
        }

        const customerData = new customerModel({
            name: "sangram",
            phone: "6370404471",
        });

        const customer = await customerModel.create(customerData);
        console.log(chalk.green("Customer seeded successfully."),
            // customer
        );
    } catch (error) {
        console.log(chalk.red("Error seeding user data:"), error);
    }
})

export default seedCustomerData;