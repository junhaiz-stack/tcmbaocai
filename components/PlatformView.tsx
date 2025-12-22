import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, Product, ProductStatus, User, UserRole, UserStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';
import { Check, X, BarChart2, FileText, AlertTriangle, Users, Key, Plus, ChevronRight, PackageSearch, Ban, ShieldCheck, Filter, Edit3, UserCheck, UserX, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MobileDialog } from './MobileDialog';
import { useToast } from './ToastContext';

interface PlatformViewProps {
  orders: Order[];
  users: User[];
  products: Product[];
  activeTab: string;
  onUpdateStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  onAddUser: (user: Omit<User, 'id' | 'avatar' | 'status'>) => void;
  onUpdateUser: (user: User) => void;
  onToggleUserStatus: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  onUpdateProductStatus: (product: Product, status: ProductStatus) => void;
}

export const PlatformView: React.FC<PlatformViewProps> = ({ 
  orders, 
  users, 
  products,
  activeTab,
  onUpdateStatus, 
  onAddUser,
  onUpdateUser,
  onToggleUserStatus,
  onResetPassword,
  onUpdateProductStatus
}) => {
  const toast = useToast();
  const [rejectModalOrder, setRejectModalOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    role: UserRole.MANUFACTURER,
    phone: '',
    email: '',
    address: ''
  });

  // Products filter state
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [selectedProductStatuses, setSelectedProductStatuses] = useState<ProductStatus[]>([]);
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<'supplier' | 'status' | null>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonsRef = useRef<HTMLDivElement>(null);

  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);

  // Unique supplier list for filter
  const supplierOptions: User[] = Array.from(
    new Map(
      users
        .filter((u) => u.role === UserRole.SUPPLIER)
        .map((u) => [u.id, u] as const)
    ).values()
  ) as User[];

  // Filtered products by supplier & status
  const filteredProducts = products.filter((product) => {
    if (selectedSupplierIds.length > 0 && !selectedSupplierIds.includes(product.supplierId)) {
      return false;
    }
    if (selectedProductStatuses.length > 0 && !selectedProductStatuses.includes(product.status)) {
      return false;
    }
    return true;
  });
  
  const handleRejectClick = (order: Order) => {
    setRejectModalOrder(order);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (rejectModalOrder && rejectReason) {
      try {
      onUpdateStatus(rejectModalOrder.id, OrderStatus.REJECTED, rejectReason);
      setRejectModalOrder(null);
      } catch (err: any) {
        toast.showError(err.message || '驳回订单失败');
      }
    } else {
      toast.showError('请输入驳回原因');
    }
  };

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        role: user.role,
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || ''
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', role: UserRole.MANUFACTURER, phone: '', email: '', address: '' });
    }
    setIsUserModalOpen(true);
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        ...userForm
      });
    } else {
      onAddUser(userForm);
    }
    setIsUserModalOpen(false);
    } catch (err: any) {
      toast.showError(err.message || '操作失败');
    }
  };

  const handleToggleProductStatus = (product: Product) => {
    const isCurrentlyDelisted = product.status === ProductStatus.DELISTED;

    if (!isCurrentlyDelisted) {
      // 下架前先记录待确认的包材，弹出移动端确认弹窗
      setConfirmProduct(product);
      return;
    }

    const newStatus = ProductStatus.ACTIVE;
    onUpdateProductStatus(product, newStatus);
  };

  const confirmDelistProduct = () => {
    if (!confirmProduct) return;
    onUpdateProductStatus(confirmProduct, ProductStatus.DELISTED);
    setConfirmProduct(null);
  };

  // 点击外部区域关闭筛选面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (filterDrawerOpen) {
        const target = event.target as Node;
        // 检查点击是否在筛选面板或筛选按钮内部
        if (
          filterPanelRef.current &&
          filterButtonsRef.current &&
          !filterPanelRef.current.contains(target) &&
          !filterButtonsRef.current.contains(target)
        ) {
          setFilterDrawerOpen(null);
        }
      }
    };

    if (filterDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [filterDrawerOpen]);

  // Analytics Data
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  const COLORS = ['#FBBF24', '#34D399', '#EF4444', '#818CF8', '#10B981'];

  return (
    <div className="space-y-4">
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-in fade-in duration-300">
           <div className="flex justify-between items-center px-2">
             <h3 className="text-xl font-black text-slate-900">待审队列</h3>
             <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-black">{pendingOrders.length}</span>
           </div>
           {pendingOrders.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-300 font-bold uppercase">无待审项</div>
           ) : (
              pendingOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-lg truncate leading-tight">{order.productName}</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tight">申请方: {order.manufacturerName}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 text-[11px] font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl mb-5">
                    <div className="flex-1 text-center border-r border-slate-200">
                      <div className="text-[9px] text-slate-300 uppercase mb-1">数量</div>
                      <div className="text-slate-800">{order.quantity.toLocaleString()}</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-[9px] text-slate-300 uppercase mb-1">交期</div>
                      <div className="text-slate-800">{order.requestDate}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                     <button className="flex-1 bg-red-50 text-red-600 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all" onClick={() => handleRejectClick(order)}>驳回</button>
                     <button className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-emerald-100" onClick={() => onUpdateStatus(order.id, OrderStatus.APPROVED)}>通过</button>
                  </div>
                </div>
              ))
           )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h3 className="text-xl font-black text-slate-900 px-2">包材管理</h3>

          {/* 筛选区：厂家 + 包材状态 */}
          <div className="px-2 space-y-2">
            <div className="flex gap-2 relative" ref={filterButtonsRef}>
              <button
                onClick={() => setFilterDrawerOpen(filterDrawerOpen === 'supplier' ? null : 'supplier')}
                className={`flex-1 bg-white border-2 rounded-2xl px-4 py-3 text-xs font-black transition-all ${
                  selectedSupplierIds.length > 0
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    厂家筛选
                  </span>
                  {selectedSupplierIds.length > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {selectedSupplierIds.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setFilterDrawerOpen(filterDrawerOpen === 'status' ? null : 'status')}
                className={`flex-1 bg-white border-2 rounded-2xl px-4 py-3 text-xs font-black transition-all ${
                  selectedProductStatuses.length > 0
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    状态筛选
                  </span>
                  {selectedProductStatuses.length > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {selectedProductStatuses.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
            {/* 厂家筛选下拉面板 - 宽度与整个筛选栏一致 */}
            {filterDrawerOpen === 'supplier' && (
              <div ref={filterPanelRef} className="bg-white border-2 border-slate-200 rounded-2xl shadow-xl z-50 max-h-[60vh] overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <button
                    onClick={() => {
                      setSelectedSupplierIds([]);
                      setFilterDrawerOpen(null);
                    }}
                    className={`w-full p-3 rounded-xl border-2 text-left font-black transition-all ${
                      selectedSupplierIds.length === 0
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    全部厂家
                  </button>
                  {supplierOptions.map((supplier) => {
                    const isSelected = selectedSupplierIds.includes(supplier.id);
                    return (
                      <button
                        key={supplier.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== supplier.id));
                          } else {
                            setSelectedSupplierIds([...selectedSupplierIds, supplier.id]);
                          }
                        }}
                        className={`w-full p-3 rounded-xl border-2 text-left font-black transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <span className="text-xs">{supplier.name}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 p-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedSupplierIds([]);
                      setFilterDrawerOpen(null);
                    }}
                    className="flex-1 py-2 text-xs font-black text-slate-400 rounded-xl bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    清空
                  </button>
                  <button
                    onClick={() => setFilterDrawerOpen(null)}
                    className="flex-[2] py-2 text-xs font-black text-white rounded-xl bg-emerald-600 active:bg-emerald-700 transition-colors"
                  >
                    确认
                  </button>
                </div>
              </div>
            )}
            {/* 状态筛选下拉面板 - 宽度与整个筛选栏一致 */}
            {filterDrawerOpen === 'status' && (
              <div ref={filterPanelRef} className="bg-white border-2 border-slate-200 rounded-2xl shadow-xl z-50 max-h-[60vh] overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <button
                    onClick={() => {
                      setSelectedProductStatuses([]);
                      setFilterDrawerOpen(null);
                    }}
                    className={`w-full p-3 rounded-xl border-2 text-left font-black transition-all ${
                      selectedProductStatuses.length === 0
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    全部状态
                  </button>
                  {[
                    { value: ProductStatus.ACTIVE, label: '正常流通' },
                    { value: ProductStatus.INACTIVE, label: '供应暂停' },
                    { value: ProductStatus.DELISTED, label: '已禁流' }
                  ].map((status) => {
                    const isSelected = selectedProductStatuses.includes(status.value);
                    return (
                      <button
                        key={status.value}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProductStatuses(selectedProductStatuses.filter(s => s !== status.value));
                          } else {
                            setSelectedProductStatuses([...selectedProductStatuses, status.value]);
                          }
                        }}
                        className={`w-full p-3 rounded-xl border-2 text-left font-black transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <span className="text-xs">{status.label}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 p-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedProductStatuses([]);
                      setFilterDrawerOpen(null);
                    }}
                    className="flex-1 py-2 text-xs font-black text-slate-400 rounded-xl bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    清空
                  </button>
                  <button
                    onClick={() => setFilterDrawerOpen(null)}
                    className="flex-[2] py-2 text-xs font-black text-white rounded-xl bg-emerald-600 active:bg-emerald-700 transition-colors"
                  >
                    确认
                  </button>
                </div>
              </div>
            )}
          </div>

           <div className="space-y-3">
            {filteredProducts.map(product => {
                const supplier = users.find(u => u.id === product.supplierId);
                const isDelisted = product.status === ProductStatus.DELISTED;
                const isInactive = product.status === ProductStatus.INACTIVE;
                
                return (
                  <div key={product.id} className={`bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-opacity ${isDelisted ? 'opacity-70' : ''}`}>
                     <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 relative">
                        <img src={product.image} alt={product.name} className={`w-full h-full object-cover ${isDelisted ? 'grayscale' : ''}`} />
                        {isDelisted && (
                          <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-white drop-shadow-md" />
                          </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="font-black text-slate-900 truncate">{product.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1 truncate">厂家: {supplier?.name}</div>
                        <div className="flex justify-between items-center mt-2">
                            {isDelisted ? (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">已禁流</span>
                            ) : isInactive ? (
                              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">供应暂停</span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">正常流通</span>
                            )}
                            
                            <button 
                              className={`text-[10px] font-black px-3 py-1.5 rounded-xl border-2 transition-all active:scale-90 ${isDelisted ? 'border-emerald-100 text-emerald-600 bg-emerald-50/50' : 'border-red-100 text-red-600 bg-red-50/50'}`}
                              onClick={() => handleToggleProductStatus(product)}
                            >
                        {isDelisted ? '恢复流通' : '下架'}
                            </button>
                        </div>
                     </div>
                  </div>
                );
             })}
           </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black text-slate-900">组织节点</h3>
            <button onClick={() => handleOpenUserModal()} className="bg-emerald-600 text-white p-2 rounded-2xl shadow-lg shadow-emerald-100">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {users.map(user => (
              <div key={user.id} className={`bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-opacity ${user.status === UserStatus.DISABLED ? 'opacity-50 grayscale' : ''}`}>
                <div className="relative">
                  <img src={user.avatar} alt="" className="w-12 h-12 rounded-2xl bg-slate-100 ring-2 ring-slate-50" />
                  {user.status === UserStatus.DISABLED && (
                    <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border-2 border-white">
                      <Ban className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-900 truncate">{user.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{user.role}</div>
                    <span className={`text-[8px] px-1 rounded-sm font-black ${user.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {user.status === UserStatus.ACTIVE ? '启用中' : '已禁用'}
                    </span>
                  </div>
                  {user.address && (
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      📍 {user.address}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onToggleUserStatus(user.id)} className={`p-2 rounded-xl transition-colors ${user.status === UserStatus.ACTIVE ? 'text-red-400 hover:bg-red-50' : 'text-emerald-400 hover:bg-emerald-50'}`} title={user.status === UserStatus.ACTIVE ? "禁用" : "启用"}>
                    {user.status === UserStatus.ACTIVE ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleOpenUserModal(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" title="编辑">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button onClick={() => onResetPassword(user.id)} className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl" title="重置密码">
                    <Key className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h3 className="text-xl font-black text-slate-900 px-2">数据透视</h3>
          <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} fill="#8884d8" paddingAngle={8} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
               {pieData.map((item, idx) => (
                 <div key={item.name} className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">{item.name}</span>
                   <span className="text-xs font-black text-slate-800 ml-auto">{item.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* 包材下架确认弹窗 */}
      <MobileDialog
        open={!!confirmProduct}
        mode="confirm"
        title="下架包材"
        message={confirmProduct ? `确认下架「${confirmProduct.name}」吗？` : ''}
        confirmText="确认下架"
        cancelText="再想想"
        onCancel={() => setConfirmProduct(null)}
        onConfirm={confirmDelistProduct}
      />

      {/* User Add/Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)}></div>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-[40px] sm:rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in slide-in-from-bottom duration-300">
              <h3 className="text-2xl font-black text-slate-900 mb-6">{editingUser ? '编辑账户' : '新增组织节点'}</h3>
              <form onSubmit={handleSubmitUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">组织名称</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    placeholder="例如：XX制药厂"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">业务角色</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value as UserRole})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                  >
                    <option value={UserRole.MANUFACTURER}>中药饮片厂 (采购方)</option>
                    <option value={UserRole.SUPPLIER}>包材生产厂 (生产方)</option>
                    <option value={UserRole.PLATFORM}>监管机构 (审批方)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">联系电话</label>
                    <input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">电子邮箱</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    联系地址
                    {(userForm.role === UserRole.MANUFACTURER || userForm.role === UserRole.SUPPLIER) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required={userForm.role === UserRole.MANUFACTURER || userForm.role === UserRole.SUPPLIER}
                    value={userForm.address}
                    onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                    placeholder="请输入详细地址"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 font-black text-slate-400">取消</button>
                  <Button type="submit" className="flex-[2] py-4 rounded-2xl shadow-xl shadow-emerald-100">
                    {editingUser ? '更新信息' : '创建账户'}
                  </Button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRejectModalOrder(null)}></div>
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden p-8 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-red-600 mb-6">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-2xl font-black leading-none">合规驳回</h3>
              </div>
              <p className="text-sm text-slate-400 font-bold mb-6 leading-relaxed">请输入驳回原因，该原因将反馈给厂家。</p>
              <textarea
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-bold text-sm min-h-[140px] focus:border-red-500 transition-colors"
                placeholder="例如：资质证书过期或规格填写有误"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-3 mt-8">
                <button onClick={() => setRejectModalOrder(null)} className="flex-1 py-4 font-black text-slate-400">取消</button>
                <button onClick={confirmReject} disabled={!rejectReason} className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 disabled:opacity-30">确认</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};