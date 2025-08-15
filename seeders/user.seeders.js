import chalk from "chalk";
import userModel from "../src/models/user/user.model.js";

async function seedUserData() {
    try {
        const isUserExist = await userModel.findOne({ phone: "6370404471" });

        if (isUserExist) {
            console.log(chalk.blue("User already exists."));
            return;
        }

        const userData = new userModel({
            name: "sangram",
            phone: "6370404471",
        });

        const user = await userModel.create(userData);
        console.log(chalk.green("User seeded successfully."),
            // user
        );
    } catch (error) {
        console.log(chalk.red("Error seeding user data:"), error);
    }
}

export default seedUserData;