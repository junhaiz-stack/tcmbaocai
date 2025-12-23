import React from 'react';
import { User, UserRole } from '../types';
import { Package, LayoutDashboard, Settings, User as UserIcon, LogOut, ShoppingBag, ClipboardList, ShieldAlert, BarChart3, Users, Box } from 'lucide-react';

interface LayoutProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ currentUser, activeTab, onTabChange, children, onLogout }) => {
  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case UserRole.MANUFACTURER: return '饮片厂采购';
      case UserRole.PLATFORM: return '包材管理';
      case UserRole.SUPPLIER: return '包材厂管理';
      case UserRole.GENERAL_MANAGER: return '总经理';
      default: return '个人中心';
    }
  };

  const getNavItems = () => {
    switch(currentUser.role) {
      case UserRole.MANUFACTURER: 
        return [
          { id: 'shop', label: '采购', icon: ShoppingBag },
          { id: 'orders', label: '订单', icon: ClipboardList },
          { id: 'profile', label: '我的', icon: UserIcon },
        ];
      case UserRole.SUPPLIER:
        return [
          { id: 'manage', label: '待办', icon: Package },
          { id: 'stock', label: '包材', icon: Box },
          { id: 'profile', label: '我的', icon: UserIcon },
        ];
      case UserRole.PLATFORM:
        return [
          { id: 'audit', label: '审核', icon: ShieldAlert },
          { id: 'products', label: '包材管理', icon: Box },
          // 报表页暂时隐藏，如需恢复可重新加入 analytics Tab
          { id: 'statistics', label: '统计', icon: BarChart3 },
          { id: 'users', label: '用户', icon: Users },
        ];
      case UserRole.GENERAL_MANAGER:
        return [
          { id: 'dashboard', label: '总览', icon: LayoutDashboard },
          { id: 'users', label: '用户', icon: Users },
          { id: 'profile', label: '我的', icon: UserIcon },
        ];
      default: return [
        { id: 'profile', label: '我的', icon: UserIcon },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-14 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm tracking-tight text-slate-900">金方包材管理系统</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {getRoleLabel(currentUser.role)}
          </span>
          <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full ring-2 ring-emerald-100" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 overflow-x-hidden">
        <div className="p-4 max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 flex justify-around items-center px-2 py-2 z-40 pb-safe shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center flex-1 py-1 transition-all active:scale-90"
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-50' : ''}`}>
                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <span className={`text-[10px] font-bold mt-1 uppercase tracking-tighter transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        <button 
          onClick={onLogout}
          className="flex flex-col items-center flex-1 py-1 text-slate-300 active:scale-90"
        >
          <div className="p-1.5">
            <LogOut className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">退出</span>
        </button>
      </nav>
    </div>
  );
};