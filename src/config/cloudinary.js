const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

// Upload image
const uploadImage = async (file, folder = 'qamshorah-store') => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: folder,
            resource_type: 'auto',
        });
        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

// Delete image
const deleteImage = async (public_id) => {
    try {
        const result = await cloudinary.uploader.destroy(public_id);
        return {
            success: true,
            result: result,
        };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

// Upload multiple images
const uploadMultipleImages = async (files, folder = 'qamshorah-store') => {
    try {
        const uploadPromises = files.map(file => uploadImage(file, folder));
        const results = await Promise.all(uploadPromises);
        return {
            success: true,
            results: results,
        };
    } catch (error) {
        console.error('Cloudinary multiple upload error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage,
    uploadMultipleImages,
};