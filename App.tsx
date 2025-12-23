import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, LogisticsInfo, Product, ProductStatus, UserStatus } from './types';
import { Layout } from './components/Layout';
import { ManufacturerView } from './components/ManufacturerView';
import { PlatformView } from './components/PlatformView';
import { SupplierView } from './components/SupplierView';
import { GeneralManagerView } from './components/GeneralManagerView';
import { LoginScreen } from './components/LoginScreen';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { ToastProvider, useToast } from './components/ToastContext';
import { UserRole } from './types';
import { Box, LogOut, Camera } from 'lucide-react';
import { apiService } from './src/services/api';

function AppContent() {
  const toast = useToast();
  // State Management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>(''); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

  // 加载数据
  useEffect(() => {
    if (currentUser) {
      loadData();
    } else {
      // 未登录时只加载用户列表用于登录
      loadUsers();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 根据用户角色构建订单查询参数
      let ordersParams: { supplierId?: string; manufacturerId?: string } | undefined = undefined;
      if (currentUser) {
        if (currentUser.role === UserRole.SUPPLIER) {
          // 供应商只能看到自己包材的订单
          ordersParams = { supplierId: currentUser.id };
        } else if (currentUser.role === UserRole.MANUFACTURER) {
          // 制造商只能看到自己下的订单
          ordersParams = { manufacturerId: currentUser.id };
        }
        // PLATFORM 和 GENERAL_MANAGER 不传递过滤参数，查看所有订单
      }
      
      const [ordersData, productsData, usersData] = await Promise.all([
        apiService.getOrders(ordersParams),
        apiService.getProducts(),
        apiService.getUsers(),
      ]);
      setOrders(ordersData || []);
      setProducts(productsData || []);
      setUsers(usersData || []);
    } catch (err: any) {
      setError(err.message || '加载数据失败');
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await apiService.getUsers();
      setUsers(usersData || []);
    } catch (err: any) {
      console.error('加载用户列表失败:', err);
    }
  };

  // Actions
  const handleLogin = async (user: User) => {
    if (user.status === UserStatus.DISABLED) {
      alert('您的账号已被禁用，请联系管理员。');
      return;
    }
    setCurrentUser(user);
    if (user.role === UserRole.MANUFACTURER) setActiveTab('shop');
    else if (user.role === UserRole.SUPPLIER) setActiveTab('manage');
    else if (user.role === UserRole.PLATFORM) setActiveTab('audit');
    else if (user.role === UserRole.GENERAL_MANAGER) setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('');
  };

  // User Management Actions
  const handleAddUser = async (newUserFields: Omit<User, 'id' | 'avatar' | 'status'>) => {
    try {
      const newUser = await apiService.createUser(newUserFields);
      setUsers(prev => [...prev, newUser as User]);
      toast.showSuccess('创建用户成功');
    } catch (err: any) {
      toast.showError(err.message || '创建用户失败');
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const { id, avatar, status, ...updateData } = updatedUser;
      const updated = await apiService.updateUser(id, updateData);
      setUsers(prev => prev.map(u => u.id === id ? updated as User : u));
      if (currentUser?.id === id) {
        setCurrentUser(updated as User);
      }
      toast.showSuccess('更新用户成功');
    } catch (err: any) {
      toast.showError(err.message || '更新用户失败');
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const updated = await apiService.toggleUserStatus(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updated as User : u));
      if (currentUser?.id === userId) {
        setCurrentUser(updated as User);
      }
      const statusText = updated.status === UserStatus.ACTIVE ? '启用' : '禁用';
      toast.showSuccess(`${statusText}用户成功`);
    } catch (err: any) {
      toast.showError(err.message || '更新用户状态失败');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const result = await apiService.resetPassword(userId);
      toast.showSuccess(result.message || '重置密码链接已发送');
    } catch (err: any) {
      toast.showError(err.message || '重置密码失败');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!currentUser) return;
    try {
      const imageUrl = await apiService.uploadImage(file, 'avatar');
      const updated = await apiService.updateUserAvatar(currentUser.id, imageUrl);
      setCurrentUser(updated as User);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updated as User : u));
      toast.showSuccess('头像上传成功');
    } catch (err: any) {
      toast.showError(err.message || '头像上传失败');
      throw new Error(err.message || '头像上传失败');
    }
  };

  // Product Management Actions
  const handleAddProduct = async (newProductData: Omit<Product, 'id' | 'status' | 'supplierId'>) => {
    if (!currentUser) return;
    
    try {
      const newProduct = await apiService.createProduct({
        ...newProductData,
        supplierId: currentUser.id
      });
      setProducts(prev => [newProduct as Product, ...prev]);
      toast.showSuccess('创建包材成功');
    } catch (err: any) {
      toast.showError(err.message || '创建包材失败');
      throw err;
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      const { id, supplierId, status, ...updateData } = updatedProduct;
      const updated = await apiService.updateProduct(id, updateData);
      setProducts(prev => prev.map(p => p.id === id ? updated as Product : p));
      toast.showSuccess('更新包材成功');
    } catch (err: any) {
      toast.showError(err.message || '更新包材失败');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    // 此方法已废弃，改为使用handleUpdateProductStatus进行下架
    // 保留此方法以兼容旧代码，但实际不会调用
  };

  const handleUpdateProductStatus = async (product: Product, status: ProductStatus) => {
    try {
      const updated = await apiService.updateProductStatus(product.id, status);
      setProducts(prev => prev.map(p => p.id === product.id ? updated as Product : p));
      const statusText = status === ProductStatus.ACTIVE ? '上架' : '下架';
      toast.showSuccess(`${statusText}包材成功`);
    } catch (err: any) {
      toast.showError(err.message || '更新包材状态失败');
    }
  };

  // Order Actions
  const handleCreateOrder = async (newOrderData: Omit<Order, 'id' | 'status'>) => {
    try {
      const newOrder = await apiService.createOrder({
        ...newOrderData,
        manufacturerId: currentUser?.id || 'unknown'
      });
      setOrders(prev => [newOrder as Order, ...prev]);
      // 刷新产品列表以更新库存
      const productsData = await apiService.getProducts();
      setProducts(productsData || []);
      toast.showSuccess('提交订单成功');
    } catch (err: any) {
      toast.showError(err.message || '提交订单失败');
      throw err;
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    try {
      const updated = await apiService.updateOrderStatus(orderId, status, reason);
      setOrders(prev => prev.map(o => o.id === orderId ? updated as Order : o));
      const statusText = status === OrderStatus.APPROVED ? '审核通过' : status === OrderStatus.REJECTED ? '已驳回' : '状态已更新';
      toast.showSuccess(statusText);
    } catch (err: any) {
      toast.showError(err.message || '更新订单状态失败');
    }
  };

  const handleShipOrder = async (orderId: string, logistics: LogisticsInfo) => {
    try {
      const updated = await apiService.shipOrder(orderId, {
        ...logistics,
        shippedDate: logistics.shippedDate || new Date().toISOString().split('T')[0]
      });
      setOrders(prev => prev.map(o => o.id === orderId ? updated as Order : o));
      // 刷新产品列表以更新库存
      const productsData = await apiService.getProducts();
      setProducts(productsData || []);
      toast.showSuccess('发货成功');
    } catch (err: any) {
      toast.showError(err.message || '发货失败');
    }
  };

  const handleConfirmReceipt = async (orderId: string) => {
    try {
      const updated = await apiService.confirmReceipt(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated as Order : o));
      toast.showSuccess('确认收货成功');
    } catch (err: any) {
      toast.showError(err.message || '确认收货失败');
    }
  };

  // Render content based on role
  const renderContent = () => {
    if (!currentUser) return null;

    switch(currentUser.role) {
      case UserRole.MANUFACTURER:
        return (
          <ManufacturerView 
            orders={orders} 
            products={products}
            users={users}
            currentUser={currentUser}
            activeTab={activeTab === 'shop' ? 'catalog' : 'orders'}
            onCreateOrder={handleCreateOrder}
            onConfirmReceipt={handleConfirmReceipt}
          />
        );
      case UserRole.PLATFORM:
        return (
          <PlatformView 
            orders={orders}
            users={users}
            products={products}
            currentUser={currentUser}
            activeTab={activeTab}
            onUpdateStatus={handleUpdateStatus}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onToggleUserStatus={handleToggleUserStatus}
            onResetPassword={handleResetPassword}
            onUpdateProductStatus={handleUpdateProductStatus}
          />
        );
      case UserRole.SUPPLIER:
        return (
          <SupplierView 
            orders={orders}
            products={products}
            currentUser={currentUser}
            activeTab={activeTab === 'manage' ? 'orders' : 'products'}
            onShipOrder={handleShipOrder}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProductStatus={handleUpdateProductStatus}
          />
        );
      case UserRole.GENERAL_MANAGER:
        return (
          <GeneralManagerView 
            users={users}
            orders={orders}
            products={products}
            activeTab={activeTab}
          />
        );
      default:
        return <div>角色未知</div>;
    }
  };

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout currentUser={currentUser} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
      {activeTab === 'profile' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center relative">
             <div className="relative inline-block">
             <img src={currentUser.avatar} className="w-24 h-24 rounded-full mx-auto ring-4 ring-emerald-50 mb-4" alt="" />
               <label className="absolute bottom-0 right-1/4 p-2 bg-emerald-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                 <Camera className="w-4 h-4" />
                 <input
                   type="file"
                   accept="image/*"
                   onChange={async (e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       if (file.size > 2 * 1024 * 1024) {
                         toast.showError('图片大小不能超过 2MB');
                         return;
                       }
                       try {
                         await handleAvatarUpload(file);
                       } catch (err: any) {
                         // Toast 已在 handleAvatarUpload 中显示
                       }
                     }
                   }}
                   className="hidden"
                 />
               </label>
             </div>
             <h2 className="text-xl font-black text-slate-900">{currentUser.name}</h2>
             <p className="text-sm text-slate-400 font-medium mt-1">{currentUser.email}</p>
             <p className="text-xs bg-emerald-50 text-emerald-600 inline-block px-3 py-1 rounded-full mt-4 font-bold uppercase tracking-wider">{currentUser.role}</p>
           </div>
           <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => setIsAccountSettingsOpen(true)}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 font-bold text-slate-700 active:bg-slate-50"
              >
                <span>账号设置</span>
                <Box className="w-4 h-4 text-slate-300" />
              </button>
              <button className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 font-bold text-slate-700 active:bg-slate-50">
                <span>消息中心</span>
                <Box className="w-4 h-4 text-slate-300" />
              </button>
              <button onClick={handleLogout} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100 font-bold text-red-600 active:bg-red-100">
                <span>退出登录</span>
                <LogOut className="w-4 h-4" />
              </button>
           </div>
        </div>
      ) : renderContent()}
      
      {/* 账号设置模态框 */}
      {currentUser && (
        <AccountSettingsModal
          user={currentUser}
          open={isAccountSettingsOpen}
          onClose={() => setIsAccountSettingsOpen(false)}
          onUpdate={(updatedUser) => {
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          }}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}