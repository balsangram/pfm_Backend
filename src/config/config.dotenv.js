import dotenv from "dotenv";
dotenv.config();

export const {
    PORT,
    NODE_ENV,
    MONGODB_URI,
    MONGODB_DB_NAME,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_VALIDATION_TIME,
    REFRESH_TOKEN_VALIDATION_TIME,

} = process.env;
// console.log("🚀 ~ ACCESS_TOKEN_SECRET:", ACCESS_TOKEN_SECRET)
