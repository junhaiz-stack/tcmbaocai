import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Package, ShieldCheck, Factory, Building2 } from 'lucide-react';
import { Button } from './Button';
import { apiService } from '../src/services/api';

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

  React.useEffect(() => {
    // 根据角色设置默认手机号
    const defaultUser = users.find(u => u.role === selectedRole);
    if (defaultUser && defaultUser.phone) {
      setPhone(defaultUser.phone);
    }
  }, [selectedRole, users]);

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
          <div className="bg-gradient-to-r from-emerald-500 to-blue-500 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">系统登录</h2>
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
              <div className="text-xs text-gray-400 mb-2">
                测试账号（手机号 + 角色）：
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>饮片厂：13800138001</div>
                <div>平台方：13900139000</div>
                <div>供应商：13600136003</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};