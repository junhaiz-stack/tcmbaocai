import React from 'react';
import { User, Order, Product } from '../types';
import { Users, Package, ClipboardList, TrendingUp, BarChart3 } from 'lucide-react';

interface GeneralManagerViewProps {
  users: User[];
  orders: Order[];
  products: Product[];
  activeTab: string;
}

export const GeneralManagerView: React.FC<GeneralManagerViewProps> = ({
  users,
  orders,
  products,
  activeTab,
}) => {
  // 统计数据
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'ACTIVE').length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'PENDING').length,
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'ACTIVE').length,
  };

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-6">数据总览</h2>
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 opacity-80" />
                <span className="text-xs font-bold opacity-80">用户总数</span>
              </div>
              <div className="text-3xl font-black">{stats.totalUsers}</div>
              <div className="text-xs opacity-80 mt-1">活跃: {stats.activeUsers}</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <ClipboardList className="w-6 h-6 opacity-80" />
                <span className="text-xs font-bold opacity-80">订单总数</span>
              </div>
              <div className="text-3xl font-black">{stats.totalOrders}</div>
              <div className="text-xs opacity-80 mt-1">待处理: {stats.pendingOrders}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-2xl text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-6 h-6 opacity-80" />
                <span className="text-xs font-bold opacity-80">包材总数</span>
              </div>
              <div className="text-3xl font-black">{stats.totalProducts}</div>
              <div className="text-xs opacity-80 mt-1">在售: {stats.activeProducts}</div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-2xl text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 opacity-80" />
                <span className="text-xs font-bold opacity-80">系统状态</span>
              </div>
              <div className="text-3xl font-black">正常</div>
              <div className="text-xs opacity-80 mt-1">运行中</div>
            </div>
          </div>

          {/* 角色分布 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6">
            <h3 className="text-lg font-black text-slate-900 mb-4">用户角色分布</h3>
            <div className="space-y-3">
              {['MANUFACTURER', 'SUPPLIER', 'PLATFORM', 'GENERAL_MANAGER'].map((role) => {
                const count = users.filter(u => u.role === role).length;
                const roleNames: Record<string, string> = {
                  MANUFACTURER: '饮片厂',
                  SUPPLIER: '供应商',
                  PLATFORM: '平台方',
                  GENERAL_MANAGER: '总经理',
                };
                return (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">{roleNames[role] || role}</span>
                    <span className="text-sm font-black text-emerald-600">{count} 人</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 订单状态分布 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4">订单状态分布</h3>
            <div className="space-y-3">
              {['PENDING', 'APPROVED', 'SHIPPED', 'COMPLETED', 'REJECTED'].map((status) => {
                const count = orders.filter(o => o.status === status).length;
                const statusNames: Record<string, string> = {
                  PENDING: '待审核',
                  APPROVED: '已批准',
                  SHIPPED: '已发货',
                  COMPLETED: '已完成',
                  REJECTED: '已拒绝',
                };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">{statusNames[status] || status}</span>
                    <span className="text-sm font-black text-blue-600">{count} 单</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'users') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-6">用户管理</h2>
          
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full ring-2 ring-emerald-100"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-slate-900">{user.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      user.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {user.status === 'ACTIVE' ? '活跃' : '禁用'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {user.phone && `${user.phone} • `}
                    {user.role === 'MANUFACTURER' ? '饮片厂' :
                     user.role === 'SUPPLIER' ? '供应商' :
                     user.role === 'PLATFORM' ? '平台方' :
                     user.role === 'GENERAL_MANAGER' ? '总经理' : user.role}
                  </p>
                  {user.address && (
                    <p className="text-xs text-slate-400 mt-1">
                      📍 {user.address}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

