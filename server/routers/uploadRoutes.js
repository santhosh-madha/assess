const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary Storage Config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'echoloom_properties',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  },
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB Limit
    }
});

// The POST Route for single image upload (Cover Photo)
router.post('/', authenticateUser, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const filePath = req.file.path;
        res.status(200).json({ filePath });
    } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({ error: 'Server error during upload' });
    }
});

// The POST Route for multiple image upload (Gallery, max 8)
router.post('/multiple', authenticateUser, (req, res) => {
    upload.array('gallery', 8)(req, res, function (err) {
        if (err) {
            console.error("Multer Array Error:", err);
            return res.status(400).json({ error: `Multer Error: ${err.message}` });
        }

        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded in gallery' });
            }
            // Map over the uploaded files to extract their full cloud paths
            const filePaths = req.files.map(file => file.path);
            res.status(200).json({ filePaths });
        } catch (error) {
            console.error('Multiple File Upload Error:', error);
            res.status(500).json({ error: 'Server error during multiple upload' });
        }
    });
});

module.exports = router;
