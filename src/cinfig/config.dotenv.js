import dotenv from "dotenv";
dotenv.config();

export const {
    PORT,
    NODE_ENV,
    MONGODB_URI,
    MONGODB_DB_NAME,

} = process.env;
