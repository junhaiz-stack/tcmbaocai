import React, { useState, useRef } from 'react';
import { Order, OrderStatus, LogisticsInfo, Product, ProductStatus, User } from '../types';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';
import { Truck, Package, Plus, Edit2, Trash2, Image as ImageIcon, Info, Archive, Layers, Ruler, CheckCircle, Clock, Upload } from 'lucide-react';
import { MobileDialog } from './MobileDialog';
import { DatePicker } from './DatePicker';
import { useToast } from './ToastContext';
import { apiService } from '../src/services/api';

interface SupplierViewProps {
  orders: Order[];
  products: Product[];
  currentUser: User;
  activeTab: 'orders' | 'products';
  onShipOrder: (orderId: string, logistics: LogisticsInfo) => void;
  onAddProduct: (product: Omit<Product, 'id' | 'status' | 'supplierId'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export const SupplierView: React.FC<SupplierViewProps> = ({ 
  orders, 
  products, 
  currentUser, 
  activeTab,
  onShipOrder,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const toast = useToast();
  const [orderSubTab, setOrderSubTab] = useState<'pending' | 'completed'>('pending');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const myProducts = products.filter(p => p.supplierId === currentUser.id);
  const isAtLimit = myProducts.length >= 5;

  // Filter orders
  const pendingShipmentOrders = orders.filter(o => o.status === OrderStatus.APPROVED);
  const completedOrders = orders.filter(o => 
    [OrderStatus.SHIPPED, OrderStatus.COMPLETED].includes(o.status)
  );

  const displayedOrders = orderSubTab === 'pending' ? pendingShipmentOrders : completedOrders;

  // Shipping Modal State
  const [shippingModalOrder, setShippingModalOrder] = useState<Order | null>(null);
  const [logisticsForm, setLogisticsForm] = useState<Partial<LogisticsInfo>>({
    company: '',
    trackingNumber: '',
    estimatedArrivalDate: '',
    batchCode: '',
  });

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '软包装',
    material: '',
    spec: '',
    stock: 0,
    image: '',
    unitPrice: 0,
    unitsPerPackage: 1
  });
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const handleShipClick = (order: Order) => {
    setShippingModalOrder(order);
    setLogisticsForm({
      company: '',
      trackingNumber: '',
      estimatedArrivalDate: '',
      batchCode: `BATCH-${new Date().getFullYear()}${Math.floor(Math.random() * 10000)}`,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.showError("图片大小不能超过 2MB");
        return;
      }

      try {
        // 显示上传中的预览（临时使用base64）
        const reader = new FileReader();
        reader.onloadend = () => {
          setProductForm(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);

        // 上传到OSS
        const imageUrl = await apiService.uploadImage(file);
        
        // 使用OSS返回的URL替换临时预览
        setProductForm(prev => ({ ...prev, image: imageUrl }));
        toast.showSuccess('图片上传成功');
      } catch (error: any) {
        console.error('上传失败:', error);
        toast.showError(error.message || '图片上传失败，请稍后重试');
        // 上传失败时清空图片
        setProductForm(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const submitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (shippingModalOrder && logisticsForm.company && logisticsForm.trackingNumber && logisticsForm.batchCode && logisticsForm.estimatedArrivalDate) {
      try {
        onShipOrder(shippingModalOrder.id, {
          company: logisticsForm.company,
          trackingNumber: logisticsForm.trackingNumber,
          batchCode: logisticsForm.batchCode,
          estimatedArrivalDate: logisticsForm.estimatedArrivalDate,
          shippedDate: new Date().toISOString().split('T')[0],
        });
        setShippingModalOrder(null);
      } catch (err: any) {
        toast.showError(err.message || '发货失败');
      }
    } else {
      toast.showError('请填写完整的物流信息');
    }
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      if (product.status === ProductStatus.DELISTED) {
        toast.showError("该包材已被平台强制下架，无法编辑");
        return;
      }
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        material: product.material,
        spec: product.spec,
        stock: product.stock,
        image: product.image,
        unitPrice: product.unitPrice || 0,
        unitsPerPackage: product.unitsPerPackage || 1
      });
    } else {
      if (isAtLimit) {
        toast.showError("已达到最大包材发布限额 (5件)");
        return;
      }
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: '软包装',
        material: '',
        spec: '',
        stock: 1000,
        image: '',
        unitPrice: 0,
        unitsPerPackage: 1
      });
    }
    setProductModalOpen(true);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.image) {
      toast.showError("请上传包材图片");
      return;
    }
    try {
      if (editingProduct) {
        onUpdateProduct({
          ...editingProduct,
          ...productForm
        });
      } else {
        onAddProduct(productForm);
      }
      setProductModalOpen(false);
    } catch (err: any) {
      toast.showError(err.message || '操作失败');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setDeleteProductId(productId);
  };

  return (
    <div className="space-y-4">
      {activeTab === 'orders' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Orders Header & Sub-tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setOrderSubTab('pending')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                orderSubTab === 'pending' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400'
              }`}
            >
              <Clock className="w-4 h-4" /> 待发货清单
              {pendingShipmentOrders.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${orderSubTab === 'pending' ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {pendingShipmentOrders.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setOrderSubTab('completed')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                orderSubTab === 'completed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400'
              }`}
            >
              <CheckCircle className="w-4 h-4" /> 已完成订单
            </button>
          </div>

          <div className="space-y-4">
            {displayedOrders.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">暂无订单</p>
              </div>
            ) : (
              displayedOrders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-300 mb-1">#{order.id}</div>
                      <div className="font-black text-slate-900 text-lg leading-tight">{order.productName}</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-1 uppercase">厂家: {order.manufacturerName}</div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-6 bg-slate-50 p-4 rounded-2xl">
                     <div>
                       <span className="block text-[9px] text-slate-300 uppercase mb-0.5">数量</span>
                       <span className="text-slate-800">{order.quantity.toLocaleString()}</span>
                     </div>
                     <div className="text-right">
                       <span className="block text-[9px] text-slate-300 uppercase mb-0.5">承诺期</span>
                       <span className="text-emerald-600">{order.expectedDate}</span>
                     </div>
                  </div>
                  {order.status === OrderStatus.APPROVED ? (
                    <Button className="w-full py-4 rounded-2xl shadow-lg shadow-emerald-50" onClick={() => handleShipClick(order)}>
                      <Truck className="w-5 h-5 mr-2" /> 立即发货
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-300 font-black uppercase py-3 border-2 border-dashed border-slate-50 rounded-2xl">
                      <CheckCircle className="w-4 h-4" /> 流程已交付
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-2">
            <div>
              <h3 className="font-black text-xl text-slate-900">包材仓库</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                当前容量: <span className={isAtLimit ? 'text-red-500' : 'text-emerald-600'}>{myProducts.length}</span> / 5
              </p>
            </div>
            <button 
              onClick={() => handleOpenProductModal()} 
              disabled={isAtLimit}
              className={`p-2.5 rounded-2xl shadow-xl transition-all ${
                isAtLimit 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-emerald-600 text-white shadow-emerald-100 active:scale-90'
              }`}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myProducts.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">暂无入库包材</p>
              </div>
            ) : (
              myProducts.map(product => (
                <div key={product.id} className="bg-white rounded-[32px] border border-slate-100 p-4 flex gap-4 shadow-sm">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className={`w-full h-full object-cover ${product.status !== ProductStatus.ACTIVE ? 'grayscale opacity-50' : ''}`} 
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-900 truncate leading-tight">{product.name}</h4>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {product.category} • {product.spec}
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className={`text-xs font-black ${product.stock < 500 ? 'text-orange-500' : 'text-emerald-600'}`}>
                          仓储: {product.stock.toLocaleString()}
                        </span>
                        {product.unitsPerPackage && (
                          <span className="text-xs font-black text-slate-600">
                            件数: {product.unitsPerPackage}
                          </span>
                        )}
                        {product.unitPrice && (
                          <span className="text-xs font-black text-slate-600">
                            单价: ¥{product.unitPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => handleOpenProductModal(product)} className="p-2 text-blue-600 bg-blue-50 rounded-xl active:scale-90 transition-transform">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 bg-red-50 rounded-xl active:scale-90 transition-transform">
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setProductModalOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-[40px] sm:rounded-[32px] shadow-2xl p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 scrollbar-hide">
            <h3 className="text-2xl font-black text-slate-900 mb-6">{editingProduct ? '包材信息维护' : '入库新包材'}</h3>
            <form onSubmit={handleSubmitProduct} className="space-y-4">
               {/* Image Upload Component */}
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                   <ImageIcon className="w-3 h-3" /> 包材展示图
                 </label>
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors group overflow-hidden relative"
                 >
                   {productForm.image ? (
                     <>
                       <img src={productForm.image} className="w-full h-full object-cover" alt="Uploaded" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Upload className="w-8 h-8 text-white" />
                       </div>
                     </>
                   ) : (
                     <>
                       <div className="p-4 bg-white rounded-2xl shadow-sm mb-2 group-hover:scale-110 transition-transform">
                         <Upload className="w-6 h-6 text-emerald-600" />
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase">点击上传图片</p>
                       <p className="text-[8px] font-bold text-slate-300 mt-1">支持 JPG, PNG (最大 2MB)</p>
                     </>
                   )}
                 </div>
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   onChange={handleImageUpload}
                   accept="image/*"
                   className="hidden" 
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                   <Package className="w-3 h-3" /> 产品名称
                 </label>
                 <input 
                   required 
                   className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                   value={productForm.name} 
                   onChange={e => setProductForm({...productForm, name: e.target.value})} 
                   placeholder="请输入名称"
                 />
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                     <Layers className="w-3 h-3" /> 分类
                   </label>
                   <select 
                     required
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors"
                     value={productForm.category}
                     onChange={e => setProductForm({...productForm, category: e.target.value})}
                   >
                     <option value="软包装">软包装</option>
                     <option value="瓶罐">瓶罐</option>
                     <option value="礼盒">礼盒</option>
                     <option value="标签/说明书">标签/说明书</option>
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                     <Archive className="w-3 h-3" /> 材质
                   </label>
                   <input 
                     required 
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                     value={productForm.material} 
                     onChange={e => setProductForm({...productForm, material: e.target.value})} 
                     placeholder="材质说明"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                     <Ruler className="w-3 h-3" /> 规格
                   </label>
                   <input 
                     required 
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                     value={productForm.spec} 
                     onChange={e => setProductForm({...productForm, spec: e.target.value})} 
                     placeholder="如: 500ml"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                     库存储备
                   </label>
                   <input 
                     type="number"
                     required 
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                     value={productForm.stock} 
                     onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})} 
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                     单价（元）
                   </label>
                   <input 
                     type="number"
                     step="0.01"
                     min="0"
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                     value={productForm.unitPrice} 
                     onChange={e => setProductForm({...productForm, unitPrice: parseFloat(e.target.value) || 0})} 
                     placeholder="最小单位价格"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                     件装数
                   </label>
                   <input 
                     type="number"
                     min="1"
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                     value={productForm.unitsPerPackage} 
                     onChange={e => setProductForm({...productForm, unitsPerPackage: parseInt(e.target.value) || 1})} 
                     placeholder="每件包含数量"
                   />
                 </div>
               </div>

               <div className="flex gap-3 pt-6">
                 <button type="button" onClick={() => setProductModalOpen(false)} className="flex-1 py-4 font-black text-slate-400">取消</button>
                 <Button type="submit" className="flex-[2] py-4 rounded-2xl shadow-xl shadow-emerald-50">
                   {editingProduct ? '提交修改' : '确认入库'}
                 </Button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShippingModalOrder(null)} />
          <div className="relative bg-white w-full rounded-t-[40px] shadow-2xl p-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-6">物流出库</h3>
            <form onSubmit={submitShipping} className="space-y-5">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">承运方</label>
                 <select required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500" value={logisticsForm.company} onChange={e => setLogisticsForm({...logisticsForm, company: e.target.value})}>
                    <option value="">选择快递</option>
                    <option value="顺丰速运">顺丰速运</option>
                    <option value="京东物流">京东物流</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">快递单号</label>
                 <input required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500" value={logisticsForm.trackingNumber} onChange={e => setLogisticsForm({...logisticsForm, trackingNumber: e.target.value})} placeholder="输入运单号" />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">预计抵达</label>
                 <DatePicker
                   value={logisticsForm.estimatedArrivalDate || ''}
                   onChange={(date) => setLogisticsForm({...logisticsForm, estimatedArrivalDate: date})}
                   minDate={new Date().toISOString().split('T')[0]}
                   placeholder="选择预计抵达日期"
                 />
               </div>
               <div className="flex gap-3 pt-6">
                 <button type="button" onClick={() => setShippingModalOrder(null)} className="flex-1 py-4 font-black text-slate-400">取消</button>
                 <Button type="submit" className="flex-[2] py-4 rounded-2xl shadow-xl shadow-emerald-50">确认出库</Button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除包材确认弹窗 */}
      <MobileDialog
        open={!!deleteProductId}
        mode="confirm"
        title="删除包材"
        message="确定要删除该包材吗？此操作不可撤销。"
        confirmText="确认删除"
        cancelText="再想想"
        onCancel={() => setDeleteProductId(null)}
        onConfirm={() => {
          if (deleteProductId) {
            onDeleteProduct(deleteProductId);
          }
          setDeleteProductId(null);
        }}
      />
    </div>
  );
};