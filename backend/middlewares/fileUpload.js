import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = './uploads/resumes';
const photoDir = './uploads/photos';

[uploadDir, photoDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'profilePhoto') {
            cb(null, photoDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const prefix = file.fieldname === 'profilePhoto' ? 'photo-' : 'resume-';
        cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    try {
        if (!file) {
            cb(new Error('No file uploaded'), false);
            return;
        }

        if (file.fieldname === 'profilePhoto') {
            if (!file.mimetype.startsWith('image/')) {
                cb(new Error('Only image files are allowed for profile photo'), false);
                return;
            }
        } else if (file.fieldname === 'file') {
            if (file.mimetype !== 'application/pdf') {
                cb(new Error('Only PDF files are allowed for resume'), false);
                return;
            }
        }

        cb(null, true);
    } catch (error) {
        cb(new Error('File validation failed: ' + error.message), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only allow 1 file
    }
});

export const handleFileUpload = (req, res, next) => {
    upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'profilePhoto', maxCount: 1 }
    ])(req, res, async (err) => {
        try {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        message: 'File size too large. Maximum size is 5MB',
                        success: false
                    });
                }
                return res.status(400).json({
                    message: `File upload error: ${err.message}`,
                    success: false
                });
            } else if (err) {
                return res.status(400).json({
                    message: err.message || 'File upload failed',
                    success: false
                });
            }

            // Process resume file
            if (req.files?.file?.[0]) {
                const file = req.files.file[0];
                req.fileData = {
                    originalname: file.originalname,
                    filename: file.filename,
                    path: file.path,
                    mimetype: file.mimetype
                };
            }

            // Process profile photo
            if (req.files?.profilePhoto?.[0]) {
                const photo = req.files.profilePhoto[0];
                req.photoData = {
                    originalname: photo.originalname,
                    filename: photo.filename,
                    path: photo.path,
                    mimetype: photo.mimetype
                };
            }

            next();
        } catch (error) {
            console.error('File upload middleware error:', error);
            return res.status(500).json({
                message: 'File processing failed',
                success: false
            });
        }
    });
};

export const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Successfully deleted file:', filePath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

export default handleFileUpload; 