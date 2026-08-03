const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Check ENV Variables
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("❌ Cloudinary environment variables missing");
}
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary via stream
 * @param {Buffer} fileBuffer - The file buffer from multer memoryStorage
 * @param {string} folder - Folder name in Cloudinary
 * @param {string} resourceType - 'image' or 'raw' (for PDFs/Docs)
 * @returns {Promise<Object>} - The full Cloudinary result object
 */
const uploadToCloudinary = (fileBuffer, folder = 'events', resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error('No file buffer provided for upload'));
    }

    const uploadOptions = {
      folder: folder,
      resource_type: resourceType,
    };

    // Add smart transformations only for images
    if (resourceType === 'image' || resourceType === 'auto') {
      uploadOptions.transformation = [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ [Cloudinary Upload Error]:', error.message);
          return reject(new Error('Failed to upload file to Cloudinary'));
        }
        resolve(result);
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Extract public_id from Cloudinary URL
 */
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Remove version and extension
    const remainingParts = parts.slice(uploadIndex + 2);
    const publicIdWithExt = remainingParts.join('/');
    const publicId = publicIdWithExt.split('.')[0];

    return publicId;
  } catch (error) {
    return null;
  }
};

/**
 * Delete a file from Cloudinary
 */
const deleteFromCloudinary = async (url) => {
  const publicId = extractPublicId(url);
  if (!publicId) return;

  try {
    const resourceType = url.includes('/raw/') ? 'raw' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`🗑️ Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('❌ [Cloudinary Delete Error]:', error.message);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId
};
