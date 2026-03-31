import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { parseResume, validateResumeFile } from "../utils/resumeParser.js";
import fs from 'fs';
import path from 'path';
import { deleteFile } from "../middlewares/fileUpload.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;

        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };

        const file = req.file;
        const fileUri = getDataUri(file);
        const cloudResponse = await uploadToCloudinary(fileUri.content);

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: 'User already exist with this email.',
                success: false,
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                profilePhoto: {
                    url: cloudResponse.url,
                    publicId: cloudResponse.publicId
                }
            }
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
    }
}

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        let user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        };
        // check role is correct or not
        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false
            })
        };

        const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpsOnly: true, sameSite: 'strict' }).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        const fileData = req.fileData;

        console.log('Starting profile update with:', {
            hasFile: !!fileData,
            fileDetails: fileData ? {
                originalname: fileData.originalname,
                filename: fileData.filename,
                path: fileData.path
            } : null,
            updateFields: { fullname, email, phoneNumber, bio, hasSkills: !!skills }
        });

        // Validate user exists
        const userId = req.id;
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }

        // Initialize profile if it doesn't exist
        if (!user.profile) {
            user.profile = {};
        }

        // Update basic profile information
        if (fullname) user.fullname = fullname;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (bio) user.profile.bio = bio;

        // Reset skills arrays before updating
        user.profile.skills = [];
        if (user.profile.parsedResume) {
            user.profile.parsedResume.skills = [];
        }

        // Handle user-provided skills
        if (skills) {
            user.profile.skills = skills.split(",").map(skill => skill.trim());
            console.log('Updated user-provided skills:', user.profile.skills);
        }

        // Handle profile photo upload
        if (req.photoData) {
            console.log('Processing profile photo upload...');
            // Delete old photo if it was a local file
            if (user.profile.profilePhoto?.publicId && user.profile.profilePhoto.publicId.startsWith('photo-')) {
                // This is a bit tricky since we don't have the full path here easily if it's stored differently
                // But following the pattern, we can try to delete it
                const oldPhotoPath = path.join(process.cwd(), 'uploads', 'photos', user.profile.profilePhoto.publicId);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }

            user.profile.profilePhoto = {
                url: `/api/v1/uploads/photos/${req.photoData.filename}`,
                publicId: req.photoData.filename // Using filename as publicID for local files
            };
        }

        // Handle resume upload if file exists
        if (fileData) {
            try {
                console.log('Processing resume upload...');

                // Delete old resume file if exists
                if (user.profile.resume?.path) {
                    deleteFile(user.profile.resume.path);
                }

                // Read the file for parsing
                const fileBuffer = fs.readFileSync(fileData.path);

                // Parse resume
                console.log('Parsing resume...');
                const parsedResume = await parseResume(fileBuffer);
                console.log('Parsed resume data:', parsedResume);

                // Update user profile with resume data
                user.profile.resume = {
                    filename: fileData.filename,
                    originalName: fileData.originalname,
                    path: fileData.path,
                    uploadedAt: new Date()
                };

                // Update parsed resume data
                user.profile.parsedResume = {
                    skills: parsedResume.skills || [],
                    jobTitle: parsedResume.jobTitle || '',
                    location: parsedResume.location || '',
                    lastUpdated: new Date()
                };

                console.log('Updated profile with resume data:', {
                    resumePath: user.profile.resume.path,
                    parsedSkills: user.profile.parsedResume.skills,
                    userSkills: user.profile.skills
                });

            } catch (error) {
                console.error('Resume processing error:', error);
                // Clean up uploaded file if there's an error
                if (fileData.path) {
                    deleteFile(fileData.path);
                }
                return res.status(400).json({
                    message: error.message || "Failed to process resume",
                    success: false
                });
            }
        }

        // Save user changes
        console.log('Saving user profile changes...');
        const savedUser = await user.save();
        console.log('User profile saved successfully');

        // Verify the save was successful
        if (!savedUser) {
            throw new Error('Failed to save user profile');
        }

        // Prepare user data for response
        const userData = {
            _id: savedUser._id,
            fullname: savedUser.fullname,
            email: savedUser.email,
            phoneNumber: savedUser.phoneNumber,
            role: savedUser.role,
            profile: {
                bio: savedUser.profile.bio,
                skills: savedUser.profile.skills,
                resume: savedUser.profile.resume,
                parsedResume: savedUser.profile.parsedResume,
                profilePhoto: savedUser.profile.profilePhoto
            }
        };

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: userData,
            success: true
        });

    } catch (error) {
        console.error("Profile update error:", error);
        // Clean up uploaded file if there's an error
        if (req.fileData?.path) {
            deleteFile(req.fileData.path);
        }
        return res.status(500).json({
            message: "Internal server error. Please try again later.",
            success: false
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};