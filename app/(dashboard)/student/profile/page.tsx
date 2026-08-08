'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mail,
  Phone,
  Save,
  X,
  User,
  Upload,
  ShieldCheck,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  BadgeCheck,
  Building2,
  GraduationCap,
  Clock,
  ShieldAlert
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  getStudentProfileData,
  updateStudentProfileData,
  changeStudentPassword
} from './actions';

export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form States
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [level, setLevel] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Camera & File Upload
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Password Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true);
      const data = await getStudentProfileData();
      if (data && !('error' in data)) {
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setMatricNumber(data.matricNumber || '');
        setLevel(data.level || '');
        setAcademicSession(data.academicSession || '');
        setProfilePic(data.passportPhotoUrl || null);
        setUpdatedAt(data.updatedAt || null);
      } else if (data && 'error' in data) {
        toast.error(data.error);
      }
      setIsLoadingProfile(false);
    }
    loadProfile();
  }, []);

  // Password Strength Calculation
  const passwordCriteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword)
  };

  const passwordScore = Object.values(passwordCriteria).filter(Boolean).length;

  const getStrengthLabel = () => {
    if (newPassword.length === 0) return { label: 'Empty', color: 'bg-slate-200', text: 'text-slate-400' };
    if (passwordScore <= 1) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
    if (passwordScore === 2 || passwordScore === 3) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
    return { label: 'Strong & Secure', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const strength = getStrengthLabel();

  // Handle file upload selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera start
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Could not access the camera. Please check browser permissions.');
    }
  };

  // Handle camera stop
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOpen, stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setProfilePic(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    const res = await updateStudentProfileData({
      phone,
      passportPhotoUrl: profilePic
    });

    setIsSaving(false);
    if (res.success) {
      setSaveMessage('Profile saved & encrypted successfully!');
      toast.success('Contact info & passport photo updated!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      toast.error(res.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    const formData = new FormData();
    formData.append('currentPassword', currentPassword);
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);

    const res = await changeStudentPassword(formData);
    setIsChangingPassword(false);

    if (res.success) {
      toast.success(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(res.error || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header with Verification Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-[var(--color-poly-primary)] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
              Department of Computer Science
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Student Account
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[var(--color-poly-text-heading)]">
            Student Profile & Security Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage your personal profile, phone contact, passport photo, and security credentials.
          </p>
        </div>

        {updatedAt && (
          <div className="text-right text-[11px] text-slate-400 font-mono hidden md:block">
            <div className="flex items-center justify-end gap-1 font-sans text-slate-500 font-bold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Last Profile Update:
            </div>
            <span>{new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Security Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[var(--color-poly-primary-light)] text-white p-5 rounded-2xl shadow-sm border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              Institutional Identity Protection Active
            </h3>
            <p className="text-xs text-slate-300">
              Your official records (Matric No, Level, Email) are secured with HTTP-Only JWT tokens and end-to-end database checks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Session SSL/TLS Encrypted
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white px-6 rounded-2xl shadow-2xs border">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-4 px-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 mr-6 ${
            activeTab === 'profile'
              ? 'border-[var(--color-poly-primary)] text-[var(--color-poly-primary)]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          Personal & Contact Details
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-4 px-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-[var(--color-poly-primary)] text-[var(--color-poly-primary)]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security Credentials & Password
        </button>
      </div>

      {/* TAB 1: Profile Details */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            {/* Read-Only Official Institutional Record */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[var(--color-poly-primary)]" />
                  Academic Registry Master Record (Read-Only)
                </h3>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked Record
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {lastName.toUpperCase()} {firstName}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matriculation Number</span>
                  <p className="font-extrabold text-[var(--color-poly-primary)] font-mono text-sm mt-0.5">
                    {matricNumber || 'CS/ND/2024/001'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Level</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{level || 'ND2'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Session</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{academicSession || '2024/2025'}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Note: Official academic names and matriculation records can only be updated directly at the Computer Science Department Secretariat to prevent academic record discrepancies.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              {/* Profile Picture Upload Section */}
              <div>
                <h3 className="text-xs font-extrabold text-[var(--color-poly-text-heading)] mb-4 uppercase tracking-wider">
                  Passport Photograph
                </h3>

                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="w-32 h-32 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative shadow-2xs">
                    {profilePic ? (
                      <Image src={profilePic} alt="Profile" fill className="object-cover" unoptimized />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 max-w-lg">
                      Upload a clean, passport-style photograph (JPEG or PNG, max 2MB). This photo is synced to your digital student identity card and official result slips.
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 bg-[var(--color-poly-primary)] text-white rounded-xl text-xs font-bold hover:bg-[var(--color-poly-primary-light)] transition-colors shadow-2xs"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </button>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-[var(--color-poly-text-heading)] hover:bg-slate-200 transition-colors"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </button>
                      {profilePic && (
                        <button
                          type="button"
                          onClick={() => setProfilePic(null)}
                          className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Editable Contact Information */}
              <div>
                <h3 className="text-xs font-extrabold text-[var(--color-poly-text-heading)] mb-4 uppercase tracking-wider">
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
                      Institutional Email Address (Read-Only)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        readOnly
                        disabled
                        className="block w-full pl-10 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed shadow-2xs"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Bound to your institutional login domain (@polyibadan.edu.ng)</p>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number (Editable)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[var(--color-poly-primary)] focus:border-[var(--color-poly-primary)] shadow-2xs"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Profile Button */}
              <div className="pt-2 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-6 py-2.5 bg-[var(--color-poly-secondary)] text-[var(--color-poly-primary)] text-xs font-bold rounded-xl shadow-2xs hover:bg-yellow-400 focus:outline-none transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Contact & Photo Changes
                    </>
                  )}
                </button>

                {saveMessage && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    {saveMessage}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Security & Password Management */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Password Change Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xs border border-slate-200 p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-[var(--color-poly-primary)]" />
                Change Student Password
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Update your portal password regularly to protect your academic records and grade access.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="block w-full pr-10 pl-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 8 characters"
                    className="block w-full pr-10 pl-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator Meter */}
                {newPassword && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Password Strength:</span>
                      <span className={`font-extrabold ${strength.text}`}>{strength.label}</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden flex gap-1">
                      <div className={`h-full transition-all duration-300 ${passwordScore >= 1 ? strength.color : 'bg-transparent'}`} style={{ width: '25%' }}></div>
                      <div className={`h-full transition-all duration-300 ${passwordScore >= 2 ? strength.color : 'bg-transparent'}`} style={{ width: '25%' }}></div>
                      <div className={`h-full transition-all duration-300 ${passwordScore >= 3 ? strength.color : 'bg-transparent'}`} style={{ width: '25%' }}></div>
                      <div className={`h-full transition-all duration-300 ${passwordScore === 4 ? strength.color : 'bg-transparent'}`} style={{ width: '25%' }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-slate-500 font-medium">
                      <span className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-emerald-700 font-bold' : ''}`}>
                        {passwordCriteria.length ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : '•'} At least 8 characters
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.uppercase ? 'text-emerald-700 font-bold' : ''}`}>
                        {passwordCriteria.uppercase ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : '•'} Uppercase letter (A-Z)
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.lowercase ? 'text-emerald-700 font-bold' : ''}`}>
                        {passwordCriteria.lowercase ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : '•'} Lowercase letter (a-z)
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-emerald-700 font-bold' : ''}`}>
                        {passwordCriteria.number ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : '•'} Number (0-9)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">Passwords do not match.</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword || (confirmPassword !== newPassword)}
                  className="inline-flex items-center px-6 py-2.5 bg-[var(--color-poly-primary)] text-white text-xs font-bold rounded-xl shadow-2xs hover:bg-[var(--color-poly-primary-light)] transition-colors disabled:opacity-50"
                >
                  {isChangingPassword ? 'Updating Credentials...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Session & Security Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-6 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Active Session Integrity
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Cookie Security:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    HTTPOnly & Secure
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Encryption Method:</span>
                  <span className="font-mono font-bold text-slate-800">JOSE HS256 JWT</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Role Authorization:</span>
                  <span className="font-bold text-[var(--color-poly-primary)] bg-blue-50 px-2 py-0.5 rounded">
                    Student Only
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Session Expiry:</span>
                  <span className="font-medium text-slate-700">24 Hours Auto-Expire</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                Security Guideline
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Never share your portal credentials or matriculation numbers with third-party agents. The Department of Computer Science staff will never ask for your password.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Capture Passport Photo</h3>
              <button
                onClick={stopCamera}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 flex flex-col items-center">
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-md bg-black mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                ></video>
              </div>

              <canvas ref={canvasRef} className="hidden"></canvas>

              <button
                onClick={capturePhoto}
                className="inline-flex items-center px-8 py-3 bg-[var(--color-poly-primary)] text-white font-bold text-xs rounded-full shadow-lg hover:bg-[var(--color-poly-primary-light)] transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

