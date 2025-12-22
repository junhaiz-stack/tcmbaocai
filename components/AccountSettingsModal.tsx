import React, { useState, useRef } from 'react';
import { User } from '../types';
import { X, Camera, Mail, Lock, Building2, Phone } from 'lucide-react';
import { apiService } from '../src/services/api';
import { Button } from './Button';
import { useToast } from './ToastContext';

interface AccountSettingsModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

// 密码复杂度校验
const checkPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; message: string } => {
  if (password.length < 6) {
    return { strength: 'weak', message: '密码长度至少6位' };
  }
  
  let score = 0;
  // 包含小写字母
  if (/[a-z]/.test(password)) score++;
  // 包含大写字母
  if (/[A-Z]/.test(password)) score++;
  // 包含数字
  if (/[0-9]/.test(password)) score++;
  // 包含特殊字符
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) {
    return { strength: 'weak', message: '密码强度：弱（至少需要达到中等强度）' };
  } else if (score === 3) {
    return { strength: 'medium', message: '密码强度：中等' };
  } else {
    return { strength: 'strong', message: '密码强度：强' };
  }
};

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  user,
  open,
  onClose,
  onUpdate
}) => {
  const toast = useToast();
  const [email, setEmail] = useState(user.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.showError('图片大小不能超过 2MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      const imageUrl = await apiService.uploadImage(file, 'avatar');
      const updated = await apiService.updateUserAvatar(user.id, imageUrl);
      onUpdate(updated as User);
      toast.showSuccess('头像更新成功');
    } catch (error: any) {
      toast.showError(error.message || '头像上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email || email === user.email) {
      toast.showError('请输入新的邮箱地址');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.showError('请输入有效的邮箱地址');
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await apiService.updateUserEmail(user.id, email);
      onUpdate(updated as User);
      toast.showSuccess('邮箱更新成功');
    } catch (error: any) {
      toast.showError(error.message || '邮箱更新失败');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword) {
      toast.showError('请输入原密码');
      return;
    }

    if (!newPassword) {
      toast.showError('请输入新密码');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.showError('两次输入的新密码不一致');
      return;
    }

    const passwordCheck = checkPasswordStrength(newPassword);
    if (passwordCheck.strength === 'weak') {
      toast.showError(passwordCheck.message);
      return;
    }

    try {
      setIsUpdating(true);
      await apiService.updateUserPassword(user.id, oldPassword, newPassword);
      toast.showSuccess('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.showError(error.message || '密码修改失败');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white w-full rounded-t-[40px] shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-slate-900">账号设置</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 头像上传 */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt="" 
                  className="w-24 h-24 rounded-full ring-4 ring-emerald-50"
                />
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {uploadingAvatar && (
                <p className="text-xs text-slate-400 mt-2">上传中...</p>
              )}
            </div>

            {/* 企业名称 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                企业名称
              </label>
              <input
                type="text"
                value={user.name}
                disabled
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black text-slate-600 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">企业名称不可编辑</p>
            </div>

            {/* 手机号 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-4 h-4" />
                手机号
              </label>
              <input
                type="tel"
                value={user.phone || ''}
                disabled
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black text-slate-600 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">手机号不可编辑</p>
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-4 h-4" />
                邮箱
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                  placeholder="请输入邮箱地址"
                />
                <Button
                  onClick={handleUpdateEmail}
                  disabled={isUpdating || !email || email === user.email}
                  className="px-6"
                >
                  {isUpdating ? '更新中...' : '更新'}
                </Button>
              </div>
            </div>

            {/* 密码修改 */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-4 h-4" />
                密码修改
              </label>
              
              <div className="space-y-3">
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="请输入原密码"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少中等强度）"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                />
                {newPassword && (
                  <p className={`text-xs ${checkPasswordStrength(newPassword).strength === 'weak' ? 'text-red-500' : 'text-emerald-600'}`}>
                    {checkPasswordStrength(newPassword).message}
                  </p>
                )}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                />
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdating || !oldPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isUpdating ? '修改中...' : '修改密码'}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

    </>
  );
};

