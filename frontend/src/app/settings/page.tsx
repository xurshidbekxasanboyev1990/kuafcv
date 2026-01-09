// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/api';
import { getFileUrl } from '@/lib/config';
import { Camera, Eye, EyeOff, Loader2, Lock, LogOut, Save, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
    const { user, loading, logout, checkAuth } = useAuth(); // Assuming checkAuth re-fetches user
    const router = useRouter();

    // Profile State
    const [profileLoading, setProfileLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Rasm hajmi 5MB dan oshmasligi kerak');
                return;
            }
            setAvatarFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            // Assuming updateProfile handles both data and file
            // If endpoint only updates avatar or info separately, adjust accordingly
            // Here we assume a unified endpoint or handle avatar separately if needed

            const formData: any = {};
            // Add other fields if editable (e.g. name)
            // formData.full_name = user.full_name; 

            await auth.updateProfile({ full_name: user.full_name }, avatarFile || undefined);

            toast.success('Profil muvaffaqiyatli yangilandi');
            await checkAuth(); // Refresh user data
            setAvatarFile(null);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Xatolik yuz berdi');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Parollar mos kelmadi');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            toast.error('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
            return;
        }

        setPasswordLoading(true);
        try {
            await auth.changePassword({
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword,
            });
            toast.success('Parol muvaffaqiyatli o\'zgartirildi');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Parolni o\'zgartirishda xatolik');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sozlamalar</h1>
                    <p className="text-muted-foreground">Profil ma'lumotlari, xavfsizlik va tizim sozlamalari</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Profile Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5" />
                                Profil Ma'lumotlari
                            </CardTitle>
                            <CardDescription>
                                Shaxsiy ma'lumotlar va profilingiz rasmini yangilang
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted bg-muted flex items-center justify-center relative">
                                            {(previewUrl || user.profile_image) ? (
                                                <img
                                                    src={previewUrl || getFileUrl(user.profile_image || '')}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <UserIcon className="w-16 h-16 text-muted-foreground" />
                                            )}

                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-lg transform translate-x-1/4 translate-y-1/4">
                                            <Camera className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Rasm yuklash uchun ustiga bosing
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>To'liq Ism (Tizim bo'yicha)</Label>
                                        <Input
                                            value={user.full_name || ''}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">Ismni o'zgartirish uchun Administratorga murojaat qiling</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            value={user.email}
                                            disabled
                                            className="bg-muted"
                                        />
                                    </div>

                                    {avatarFile && (
                                        <Button type="submit" className="w-full" disabled={profileLoading}>
                                            {profileLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            Rasmni Saqlash
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-8">
                        {/* Password Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Xavfsizlik
                                </CardTitle>
                                <CardDescription>
                                    Parolni yangilash
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPass">Joriy Parol</Label>
                                        <div className="relative">
                                            <Input
                                                id="currentPass"
                                                type={showCurrentPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                required
                                                value={passwordData.currentPassword}
                                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPass">Yangi Parol</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPass"
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                required
                                                value={passwordData.newPassword}
                                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Parol kamida 8 ta belgidan iborat bo'lishi, katta va kichik harflar, raqam va maxsus belgini o'z ichiga olishi kerak.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPass">Yangi Parolni Tasdiqlang</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPass"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                required
                                                value={passwordData.confirmPassword}
                                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={passwordLoading}>
                                        {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Parolni Yangilash
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Logout Section */}
                        <Card className="border-destructive/20 bg-destructive/5">
                            <CardHeader>
                                <CardTitle className="text-destructive flex items-center gap-2">
                                    <LogOut className="w-5 h-5" />
                                    Chiqish
                                </CardTitle>
                                <CardDescription>
                                    Tizimdan chiqish
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" className="w-full" onClick={logout}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Tizimdan Chiqish
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
