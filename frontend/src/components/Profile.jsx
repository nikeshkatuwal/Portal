import React, { useState } from 'react';
import Navbar from './shared/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Contact, Mail, Pen, MapPin, Briefcase } from 'lucide-react';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import AppliedJobTable from './AppliedJobTable';
import UpdateProfileDialog from './UpdateProfileDialog';
import { useSelector } from 'react-redux';
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs';
import { BASE_API_URL } from '@/utils/constant';

const Profile = () => {
    useGetAppliedJobs();
    const [open, setOpen] = useState(false);
    const { user } = useSelector(store => store.auth);

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        const url = photo.url || photo;
        if (typeof url !== 'string') return null;
        if (url.startsWith('http')) return url;
        const BACKEND_BASE_URL = "http://localhost:8001";
        return `${BACKEND_BASE_URL}${url}`;
    };

    const getResumeUrl = (resumePath) => {
        if (!resumePath) return null;
        // Convert Windows path to URL format and ensure it points to the correct API endpoint
        const formattedPath = resumePath.replace(/\\/g, '/').replace('uploads/', '');
        return `${BASE_API_URL}/uploads/${formattedPath}`;
    };

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl my-5 p-8'>
                <div className='flex justify-between'>
                    <div className='flex items-center gap-4'>
                        <Avatar className="h-24 w-24">

                            <AvatarImage src={user?.profile?.profilePhoto?.url || user?.profile?.profilePhoto } alt="User Avatar" />

                            <AvatarFallback>{user?.fullname?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className='font-medium text-xl'>{user?.fullname}</h1>
                            <p>{user?.profile?.bio}</p>
                        </div>
                    </div>
                    <Button onClick={() => setOpen(true)}>
                        <Pen className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </div>

                {/* Contact Information */}
                <div className='my-5 p-4 bg-gray-50 rounded-lg'>
                    <h2 className='font-semibold text-lg mb-3'>Contact Information</h2>
                    <div className='flex items-center gap-3 my-2'>
                        <Mail className="text-gray-600" />
                        <span>{user?.email}</span>
                    </div>
                    <div className='flex items-center gap-3 my-2'>
                        <Contact className="text-gray-600" />
                        <span>{user?.phoneNumber}</span>
                    </div>
                </div>

                {/* Resume Information */}
                <div className='my-5 p-4 bg-gray-50 rounded-lg'>
                    <h2 className='font-semibold text-lg mb-3'>Resume Information</h2>

                    {/* Extracted Job Title */}
                    {user?.profile?.parsedResume?.jobTitle && (
                        <div className='flex items-center gap-3 my-2'>
                            <Briefcase className="text-gray-600" />
                            <span>Preferred Role: {user.profile.parsedResume.jobTitle}</span>
                        </div>
                    )}

                    {/* Extracted Location */}
                    {user?.profile?.parsedResume?.location && (
                        <div className='flex items-center gap-3 my-2'>
                            <MapPin className="text-gray-600" />
                            <span>Preferred Location: {user.profile.parsedResume.location}</span>
                        </div>
                    )}

                    {/* Resume File */}
                    <div className='mt-4'>
                        <Label className="text-md font-semibold">Resume File</Label>
                        <div className='mt-2'>
                            {user?.profile?.resume ? (
                                <a
                                    href={getResumeUrl(user.profile.resume.path)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className='text-blue-500 hover:underline cursor-pointer flex items-center gap-2 group'
                                >
                                    <svg
                                        className="w-5 h-5 text-blue-500 group-hover:text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span>{user.profile.resume.originalName}</span>
                                    <span className='text-xs text-gray-500'>
                                        (Uploaded: {new Date(user.profile.resume.uploadedAt).toLocaleDateString()})
                                    </span>
                                </a>
                            ) : (
                                <span className='text-gray-500'>No resume uploaded</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Skills Section */}
                <div className='my-5 p-4 bg-gray-50 rounded-lg'>
                    <h2 className='font-semibold text-lg mb-3'>Skills</h2>
                    <div className='flex flex-wrap gap-2'>
                        {/* User provided skills */}
                        {user?.profile?.skills?.length > 0 ? (
                            user.profile.skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="bg-purple-50">
                                    {skill}
                                </Badge>
                            ))
                        ) : (
                            <span className='text-gray-500'>No skills added</span>
                        )}
                    </div>

                    {/* Extracted skills from resume */}
                    {user?.profile?.parsedResume?.skills?.length > 0 && (
                        <div className='mt-4'>
                            <Label className="text-md font-semibold">Skills Extracted from Resume</Label>
                            <div className='flex flex-wrap gap-2 mt-2'>
                                {user.profile.parsedResume.skills.map((skill, index) => (
                                    <Badge key={index} variant="outline" className="bg-blue-50">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Applied Jobs Section */}
            <div className='max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl my-5 p-6'>
                <h1 className='font-bold text-xl mb-4'>Applied Jobs</h1>
                <AppliedJobTable />
            </div>
            <UpdateProfileDialog open={open} setOpen={setOpen} />
        </div>
    );
};

export default Profile;