import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Package, ShieldCheck, Factory, Building2, Info, Download, Smartphone } from 'lucide-react';
import { Button } from './Button';
import { apiService } from '../src/services/api';
import { SystemIntroModal } from './SystemIntroModal';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MANUFACTURER);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  
  // PWA 安装相关状态
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  React.useEffect(() => {
    // 根据角色设置默认手机号
    const defaultUser = users.find(u => u.role === selectedRole);
    if (defaultUser && defaultUser.phone) {
      setPhone(defaultUser.phone);
    }
  }, [selectedRole, users]);

  // PWA 安装事件监听
  useEffect(() => {
    // 检测是否为 iOS 设备
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // 监听 beforeinstallprompt 事件（Chrome/Edge）
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // 监听 appinstalled 事件（安装成功后）
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 检查是否已经安装（standalone 模式）
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('请输入手机号');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // 调用 API 登录
      const result = await apiService.login(phone, selectedRole);
      
      if (result && result.user) {
        onLogin(result.user as User);
      } else {
        setError('登录失败，请检查手机号和角色');
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查手机号和角色');
    } finally {
      setLoading(false);
    }
  };

  // 处理添加到桌面
  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS Safari 需要手动添加
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      // 显示安装提示
      deferredPrompt.prompt();
      
      // 等待用户响应
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('用户接受了安装提示');
      } else {
        console.log('用户拒绝了安装提示');
      }
      
      // 清除保存的提示
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const roles = [
    { id: UserRole.MANUFACTURER, label: '中药饮片厂', icon: Factory, color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
    { id: UserRole.PLATFORM, label: '平台管理方', icon: ShieldCheck, color: 'bg-blue-100 text-blue-600 border-blue-200' },
    { id: UserRole.SUPPLIER, label: '包材供应商', icon: Building2, color: 'bg-purple-100 text-purple-600 border-purple-200' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Logo and Title Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl shadow-lg ring-4 ring-emerald-500/20">
              <Package className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            金方包材管理系统
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            全流程数字化追溯系统
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-blue-500 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">系统登录</h2>
            <button
              type="button"
              onClick={() => setIsIntroModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium"
            >
              <Info className="w-4 h-4" />
              系统介绍
            </button>
          </div>
          
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-3">选择角色</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`cursor-pointer flex sm:flex-col items-center p-3 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? `border-emerald-500 bg-emerald-50 shadow-md` 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${role.color} mr-3 sm:mr-0 sm:mb-2`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-emerald-800' : 'text-gray-600'}`}>
                        {role.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  placeholder="请输入手机号"
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="请输入密码"
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span> 
                    <span>{error}</span>
                  </p>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full justify-center py-3 text-base shadow-lg shadow-emerald-500/30"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录系统'}
            </Button>
            </form>

            {/* Test Accounts Info */}
            <div className="mt-8 text-center">
              <div className="text-xs text-gray-400">
                测试服，账号已固定，密码随意
              </div>
            </div>

            {/* 添加到桌面按钮 */}
            {(isInstallable || isIOS) && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  添加到桌面
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 系统介绍弹窗 */}
      <SystemIntroModal 
        open={isIntroModalOpen} 
        onClose={() => setIsIntroModalOpen(false)} 
      />

      {/* iOS 安装提示弹窗 */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <Smartphone className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900">添加到主屏幕</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-600 mb-6">
              <p className="font-bold">请按照以下步骤操作：</p>
              <ol className="space-y-2 list-decimal list-inside">
                <li>点击浏览器底部的<span className="font-black text-emerald-600">分享</span>按钮</li>
                <li>在分享菜单中选择<span className="font-black text-emerald-600">"添加到主屏幕"</span></li>
                <li>点击<span className="font-black text-emerald-600">"添加"</span>完成安装</li>
              </ol>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};