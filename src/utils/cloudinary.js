import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
dotenv.config();
// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload buffer directly
export const uploadBufferToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {}, // No folder, direct upload
            (error, result) => {
                if (error) {
                    reject(error);
                }
                else resolve(result); // result contains url, public_id, etc.
            }
        );
        // Convert buffer to stream and pipe to Cloudinary
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

export default cloudinary;