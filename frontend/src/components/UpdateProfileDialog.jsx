import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { X, Plus, Check } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '@/redux/authSlice';
import { USER_API_END_POINT } from '@/utils/constant';
import axios from 'axios';
import { toast } from 'sonner';

// List of predefined skills matching the backend
const PREDEFINED_SKILLS = [
    "JavaScript", "Python", "Java", "C++", "SQL", "ExpressJS",
    "React", "Node.js", "MongoDB", "HTML", "CSS",
    "Machine Learning", "AI", "Data Science", "Cloud Computing",
    "AWS", "Azure", "DevOps", "Docker", "Kubernetes",
    "Git", "REST API", "GraphQL", "TypeScript", "Angular",
    "Vue.js", "PHP", "Ruby", "Swift", "Kotlin",
    "Android", "iOS", "React Native", "Flutter", "Blockchain",
    "Cybersecurity", "Network Security", "Database Management",
    "Agile", "Scrum", "Project Management", "Team Leadership",
    "Problem Solving", "Communication", "Analytical Skills"
];

const UpdateProfileDialog = ({ open, setOpen }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(store => store.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phoneNumber: '',
        bio: '',
        skills: [],
        file: null,
        profilePhoto: null
    });
    const [skillInput, setSkillInput] = useState('');
    const [suggestedSkills, setSuggestedSkills] = useState([]);

    useEffect(() => {
        if (user) {
            setFormData({
                fullname: user.fullname || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                bio: user.profile?.bio || '',
                skills: user.profile?.skills || [],
                file: null,
                profilePhoto: null
            });
        }
    }, [user]);

    useEffect(() => {
        // Update suggestions based on input
        if (skillInput.trim()) {
            const filtered = PREDEFINED_SKILLS.filter(skill =>
                skill.toLowerCase().includes(skillInput.toLowerCase()) &&
                !formData.skills.includes(skill)
            );
            setSuggestedSkills(filtered);
        } else {
            setSuggestedSkills([]);
        }
    }, [skillInput, formData.skills]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error('Please upload a PDF file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                toast.error('File size should be less than 5MB');
                return;
            }
            setFormData(prev => ({
                ...prev,
                file
            }));
            toast.success('Resume selected successfully');
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB
                toast.error('Photo size should be less than 2MB');
                return;
            }
            setFormData(prev => ({
                ...prev,
                profilePhoto: file
            }));
            toast.success('Profile photo selected successfully');
        }
    };

    const handleAddSkill = (e) => {
        e.preventDefault();
        if (skillInput.trim()) {
            if (!formData.skills.includes(skillInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    skills: [...prev.skills, skillInput.trim()]
                }));
            }
            setSkillInput('');
            setSuggestedSkills([]);
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('fullname', formData.fullname);
            submitData.append('email', formData.email);
            submitData.append('phoneNumber', formData.phoneNumber);
            submitData.append('bio', formData.bio);
            submitData.append('skills', formData.skills.join(','));
            if (formData.file) {
                submitData.append('file', formData.file);
            }
            if (formData.profilePhoto) {
                submitData.append('profilePhoto', formData.profilePhoto);
            }

            console.log('Submitting form data:', {
                fullname: formData.fullname,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                bio: formData.bio,
                skills: formData.skills,
                hasFile: !!formData.file,
                hasPhoto: !!formData.profilePhoto
            });

            const res = await axios.put(`${USER_API_END_POINT}/update-profile`, submitData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                dispatch(setUser(res.data.user));
                toast.success(res.data.message);
                setOpen(false);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Profile</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Profile Photo */}
                    <div>
                        <Label htmlFor="profilePhoto">Profile Photo (Image)</Label>
                        <Input
                            id="profilePhoto"
                            name="profilePhoto"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="cursor-pointer"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Maximum file size: 2MB
                        </p>
                    </div>

                    {/* Full Name */}
                    <div>
                        <Label htmlFor="fullname">Full Name</Label>
                        <Input
                            id="fullname"
                            name="fullname"
                            value={formData.fullname}
                            onChange={handleInputChange}
                            placeholder="Enter your full name"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="Enter your phone number"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            placeholder="Tell us about yourself"
                            className="h-24"
                        />
                    </div>

                    {/* Skills */}
                    <div>
                        <Label>Skills</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                placeholder="Add a skill"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSkill(e);
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddSkill}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="bg-purple-50 flex items-center gap-1">
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Resume Upload */}
                    <div>
                        <Label htmlFor="resume">Resume (PDF)</Label>
                        <Input
                            id="resume"
                            name="file"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Maximum file size: 5MB
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Save Changes'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateProfileDialog;