import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Custom storage for Cloudinary
const cloudinaryStorage = multer.memoryStorage();

const upload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 27 * 1024 * 1024 }, // 27MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware to upload to Cloudinary after multer processes the file
const uploadToCloudinary = async (req, res, next) => {
  if (!req.files && !req.file) return next();
  
  try {
    const files = req.files || [req.file];
    
    for (const file of files) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'mobi-world',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        uploadStream.end(file.buffer);
      });
      
      // Add Cloudinary info to file object
      file.path = result.url;
      file.public_id = result.public_id;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export { upload, uploadToCloudinary };
