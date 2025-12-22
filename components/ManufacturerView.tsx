import React, { useState } from 'react';
import { Order, OrderStatus, Product, ProductStatus, User, UserRole } from '../types';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';
import { ShoppingBag, Filter, Package, Clock, Truck, CheckCircle2, XCircle, ArrowLeft, Calendar, Package2, Factory, CheckCircle, FileText } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { useToast } from './ToastContext';

interface ManufacturerViewProps {
  orders: Order[];
  products: Product[];
  users: User[];
  currentUser: User;
  activeTab: 'catalog' | 'orders';
  onCreateOrder: (order: Omit<Order, 'id' | 'status'>) => void;
  onConfirmReceipt: (orderId: string) => void;
}

type OrderFilterStatus = 'ALL' | OrderStatus;

export const ManufacturerView: React.FC<ManufacturerViewProps> = ({ 
  orders, 
  products,
  users,
  currentUser, 
  activeTab,
  onCreateOrder,
  onConfirmReceipt
}) => {
  const toast = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [packageQuantity, setPackageQuantity] = useState<number>(1); // 按"件"下单
  const [packageQuantityInput, setPackageQuantityInput] = useState<string>('1'); // 输入框的值（字符串，支持清空）
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState<OrderFilterStatus>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myOrders = orders.filter(o => o.manufacturerName === currentUser.name);
  const suppliers = users.filter(u => u.role === UserRole.SUPPLIER);

  // Filter products: Must be ACTIVE and match selected supplier (if any)
  const displayedProducts = products.filter(p => {
    const isActive = p.status === ProductStatus.ACTIVE;
    const matchesSupplier = selectedSupplierId === 'all' || p.supplierId === selectedSupplierId;
    return isActive && matchesSupplier;
  });

  // Filter my orders based on selected sub-tab
  const filteredOrders = myOrders.filter(o => {
    if (orderFilter === 'ALL') return true;
    return o.status === orderFilter;
  });

  const handleOpenOrderModal = (product: Product) => {
    setSelectedProduct(product);
    setPackageQuantity(1);
    setPackageQuantityInput('1');
    setExpectedDate('');
    setIsModalOpen(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.showError('请选择要采购的包材');
      return;
    }
    // 期望日期暂时隐藏，设为非必填
    // if (!expectedDate) {
    //   toast.showError('请选择期望日期');
    //   return;
    // }

    // 校验采购数量不能为空
    if (packageQuantityInput === '' || isNaN(Number(packageQuantityInput)) || Number(packageQuantityInput) < 1) {
      toast.showError('请输入有效的采购数量（至少1件）');
      return;
    }

    // 使用最新库存做校验，防止超卖
    const latestProduct = products.find(p => p.id === selectedProduct.id);
    if (!latestProduct) {
      toast.showError('包材不存在或已下架');
      return;
    }

    // 计算实际数量（件数 * 件装数）
    const unitsPerPackage = latestProduct.unitsPerPackage || 1;
    const actualQuantity = packageQuantity * unitsPerPackage;

    if (actualQuantity > latestProduct.stock) {
      const errorMsg = `库存不足，当前剩余库存 ${latestProduct.stock} ${latestProduct.unit || '个'}`;
      toast.showError(errorMsg);
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateOrder({
      manufacturerName: currentUser.name,
      productId: latestProduct.id,
      productName: latestProduct.name,
      quantity: actualQuantity, // 存储实际数量（件数 * 件装数）
      requestDate: new Date().toISOString().split('T')[0],
      expectedDate: expectedDate || new Date().toISOString().split('T')[0], // 如果没有填写，使用当前日期
    });
      toast.showSuccess('订单提交成功');
      setIsModalOpen(false);
      // Reset form
      setPackageQuantity(1);
      setPackageQuantityInput('1');
      setExpectedDate('');
    } catch (error: any) {
      toast.showError(error.message || '订单提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterTabs = [
    { id: 'ALL', label: '全部', icon: Package },
    { id: OrderStatus.PENDING, label: '待审核', icon: Clock },
    { id: OrderStatus.SHIPPED, label: '已发货', icon: Truck },
    { id: OrderStatus.COMPLETED, label: '已完成', icon: CheckCircle2 },
    { id: OrderStatus.REJECTED, label: '已驳回', icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {activeTab === 'catalog' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Supplier Filter */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex items-center space-x-2 mb-2">
               <Filter className="w-4 h-4 text-emerald-600" />
               <span className="text-xs font-black text-slate-900 uppercase tracking-widest">厂家直供</span>
             </div>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedSupplierId('all')}
                  className={`px-4 py-2 text-xs font-bold rounded-full border-2 transition-all whitespace-nowrap ${
                    selectedSupplierId === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                      : 'bg-white text-slate-400 border-slate-100'
                  }`}
                >
                  全部
                </button>
                {suppliers.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSupplierId(s.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-full border-2 transition-all whitespace-nowrap ${
                      selectedSupplierId === s.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                        : 'bg-white text-slate-400 border-slate-100'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {displayedProducts.length === 0 ? (
               <div className="text-center py-20 text-slate-300 font-bold bg-white rounded-3xl border-2 border-dashed border-slate-100">
                 暂无上架包材
               </div>
            ) : (
              displayedProducts.map((product) => {
                const supplier = users.find(u => u.id === product.supplierId);
                return (
                  <div key={product.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex p-3 gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                       <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="text-base font-black text-slate-900 line-clamp-1 leading-none mb-1">{product.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{product.material} • {product.spec}</p>
                        <div className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center">
                          <ShoppingBag className="w-3 h-3 mr-1" />
                          {supplier?.name}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                         <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-bold text-slate-400">库存: {product.stock.toLocaleString()}</span>
                           {product.unitPrice && (
                             <span className="text-[10px] font-bold text-emerald-600">
                               单价: ¥{product.unitPrice.toFixed(2)}
                               {product.unitsPerPackage && ` / 件装: ${product.unitsPerPackage}`}
                             </span>
                           )}
                         </div>
                         <Button size="sm" className="rounded-xl px-4 py-2 shadow-sm" onClick={() => handleOpenOrderModal(product)}>
                           下单
                         </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && !selectedOrder && (
        <div className="space-y-4 animate-in fade-in duration-300">
           {/* Order Status Filters */}
           <div className="bg-white px-2 py-3 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide flex gap-4 sticky top-0 z-10">
              {filterTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = orderFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setOrderFilter(tab.id as OrderFilterStatus)}
                    className={`flex flex-col items-center min-w-[56px] transition-all ${isActive ? 'scale-105' : 'opacity-60 grayscale'}`}
                  >
                    <div className={`p-2 rounded-xl mb-1 ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-black whitespace-nowrap ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {tab.label}
                    </span>
                    {isActive && <div className="w-1 h-1 bg-emerald-600 rounded-full mt-1"></div>}
                  </button>
                )
              })}
           </div>

           <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-slate-300 font-bold bg-white rounded-3xl border-2 border-dashed border-slate-100 uppercase tracking-widest">
                  无相关订单
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div 
                    key={order.id} 
                    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-slate-300">#{order.id}</div>
                        <div className="font-black text-slate-900 text-lg leading-tight">{order.productName}</div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    
                    {(() => {
                      const product = products.find(p => p.id === order.productId);
                      const unitsPerPackage = product?.unitsPerPackage || 1;
                      const packageCount = Math.ceil(order.quantity / unitsPerPackage);
                      const totalPrice = product?.unitPrice ? product.unitPrice * order.quantity : null;
                      return (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-50 p-3 rounded-2xl">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">件数</span>
                            <span className="font-black text-slate-800">{packageCount} 件</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">总量</span>
                            <span className="font-black text-slate-800">{order.quantity.toLocaleString()} 个</span>
                          </div>
                          {totalPrice && (
                            <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-50 col-span-2">
                              <span className="text-[10px] font-bold text-emerald-600/50 block uppercase mb-1">价格</span>
                              <span className="font-black text-emerald-700">¥{totalPrice.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {order.logistics && (
                        <div className="text-xs text-blue-800 bg-blue-50/50 p-3 rounded-2xl border border-blue-100 mb-4">
                          <div className="flex items-center gap-1 font-black mb-1">
                            <Truck className="w-3 h-3" />
                            {order.logistics.company}
                          </div>
                          <div className="font-mono text-[10px]">{order.logistics.trackingNumber}</div>
                        </div>
                    )}
                    
                    {order.status === OrderStatus.REJECTED && (
                        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 mb-4 font-bold">
                          驳回原因: {order.rejectReason}
                        </div>
                    )}

                    {order.status === OrderStatus.SHIPPED && (
                        <Button className="w-full py-4 rounded-2xl shadow-lg shadow-emerald-100" onClick={(e) => {
                          e.stopPropagation();
                          onConfirmReceipt(order.id);
                        }}>
                          确认收货
                        </Button>
                    )}
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {/* 订单详情页 */}
      {activeTab === 'orders' && selectedOrder && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* 返回按钮 */}
          <button 
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 text-slate-600 font-bold text-sm mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            返回订单列表
          </button>

          {/* 订单详情卡片 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            {/* 订单标题和状态 */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <div className="text-[10px] font-mono font-bold text-slate-300 mb-1">#{selectedOrder.id}</div>
                <h2 className="text-xl font-black text-slate-900">{selectedOrder.productName}</h2>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {/* 详细信息 */}
            <div className="space-y-4">
              {/* 包材名 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Package2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">包材名称</div>
                  <div className="font-black text-slate-900">{selectedOrder.productName}</div>
                </div>
              </div>

              {/* 包材厂名 */}
              {(() => {
                const product = products.find(p => p.id === selectedOrder.productId);
                const supplier = product ? users.find(u => u.id === product.supplierId) : null;
                return (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Factory className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">包材厂名</div>
                      <div className="font-black text-slate-900">{supplier?.name || '未知'}</div>
                    </div>
                  </div>
                );
              })()}

              {/* 下单时间 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">下单时间</div>
                  <div className="font-black text-slate-900">{selectedOrder.requestDate}</div>
                </div>
              </div>

              {/* 件数 */}
              {(() => {
                const product = products.find(p => p.id === selectedOrder.productId);
                const unitsPerPackage = product?.unitsPerPackage || 1;
                const packageCount = Math.ceil(selectedOrder.quantity / unitsPerPackage);
                return (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-xl">
                      <Package className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">件数</div>
                      <div className="font-black text-slate-900">{packageCount} 件</div>
                    </div>
                  </div>
                );
              })()}

              {/* 总量 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-xl">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">总量</div>
                  <div className="font-black text-slate-900">{selectedOrder.quantity.toLocaleString()} 个</div>
                </div>
              </div>

              {/* 价格信息 */}
              {(() => {
                const product = products.find(p => p.id === selectedOrder.productId);
                const totalPrice = product?.unitPrice ? product.unitPrice * selectedOrder.quantity : null;
                if (totalPrice) {
                  return (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">价格</div>
                        <div className="font-black text-emerald-600 text-lg">¥{totalPrice.toFixed(2)}</div>
                        {product?.unitPrice && (
                          <div className="text-xs text-slate-500 mt-1">
                            单价: ¥{product.unitPrice.toFixed(2)}/个
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 平台审核时间 */}
              {selectedOrder.approvedDate && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">平台审核时间</div>
                    <div className="font-black text-slate-900">{selectedOrder.approvedDate}</div>
                  </div>
                </div>
              )}

              {/* 订单状态 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">订单状态</div>
                  <div className="mt-1">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>
              </div>

              {/* 快递进度 */}
              {selectedOrder.logistics && (
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">快递进度</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">承运方</span>
                      <span className="text-sm font-black text-slate-900">{selectedOrder.logistics.company}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">快递单号</span>
                      <span className="text-xs font-mono font-black text-slate-900">{selectedOrder.logistics.trackingNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">发货日期</span>
                      <span className="text-xs font-black text-slate-900">{selectedOrder.logistics.shippedDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">预计抵达</span>
                      <span className="text-xs font-black text-emerald-600">{selectedOrder.logistics.estimatedArrivalDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">批次号</span>
                      <span className="text-xs font-mono font-black text-slate-900">{selectedOrder.logistics.batchCode}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 驳回原因 */}
              {selectedOrder.status === OrderStatus.REJECTED && selectedOrder.rejectReason && (
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">驳回原因</div>
                  <div className="text-sm font-bold text-red-800">{selectedOrder.rejectReason}</div>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            {selectedOrder.status === OrderStatus.SHIPPED && (
              <div className="pt-4 border-t border-slate-100">
                <Button 
                  className="w-full py-4 rounded-2xl shadow-lg shadow-emerald-100" 
                  onClick={() => {
                    onConfirmReceipt(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                >
                  确认收货
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full rounded-t-[40px] shadow-2xl overflow-hidden p-8 animate-in slide-in-from-bottom duration-300">
              <form onSubmit={handleSubmitOrder}>
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-slate-900 leading-none">确认采购</h3>
                  <p className="text-slate-400 font-bold text-sm mt-2">{selectedProduct.name}</p>
                </div>
                
                {/* 包材信息展示 */}
                {selectedProduct.unitPrice && (
                  <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">单价（最小单位）</span>
                      <span className="text-sm font-black text-slate-900">¥{selectedProduct.unitPrice.toFixed(2)}</span>
                    </div>
                    {selectedProduct.unitsPerPackage && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">件装数</span>
                        <span className="text-sm font-black text-slate-900">{selectedProduct.unitsPerPackage} 个/件</span>
                      </div>
                    )}
                    {selectedProduct.unitsPerPackage && selectedProduct.unitPrice && (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-xs font-bold text-emerald-600">件单价</span>
                        <span className="text-sm font-black text-emerald-600">
                          ¥{(selectedProduct.unitPrice * selectedProduct.unitsPerPackage).toFixed(2)}/件
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      采购数量（件）
                      {selectedProduct.unitsPerPackage && (
                        <span className="text-slate-500 normal-case ml-1">
                          （每件 {selectedProduct.unitsPerPackage} 个）
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = Math.max(1, packageQuantity - 1);
                          setPackageQuantity(newValue);
                          setPackageQuantityInput(newValue.toString());
                        }}
                        className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-600 active:bg-slate-200 transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={packageQuantityInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPackageQuantityInput(value);
                          // 允许清空输入
                          if (value === '') {
                            return;
                          }
                          const numValue = Number(value);
                          if (!isNaN(numValue) && numValue >= 1) {
                            setPackageQuantity(numValue);
                          }
                        }}
                        onBlur={(e) => {
                          // 失去焦点时，如果为空或无效，恢复为1
                          const value = e.target.value;
                          if (value === '' || isNaN(Number(value)) || Number(value) < 1) {
                            setPackageQuantityInput('1');
                            setPackageQuantity(1);
                          } else {
                            setPackageQuantityInput(value);
                            setPackageQuantity(Number(value));
                          }
                        }}
                        onFocus={(e) => {
                          // 聚焦时选中所有文本，方便编辑
                          e.target.select();
                        }}
                        className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black text-center focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = packageQuantity + 1;
                          setPackageQuantity(newValue);
                          setPackageQuantityInput(newValue.toString());
                        }}
                        className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center font-black text-emerald-600 active:bg-emerald-200 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {selectedProduct.unitsPerPackage && (
                      <p className="text-xs text-slate-500 mt-1">
                        实际数量: {packageQuantity * selectedProduct.unitsPerPackage} 个
                      </p>
                    )}
                  </div>
                  {/* 期望日期暂时隐藏 */}
                  {/* <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">期望日期</label>
                    <DatePicker
                      value={expectedDate}
                      onChange={setExpectedDate}
                      minDate={new Date().toISOString().split('T')[0]}
                      placeholder="选择期望日期"
                    />
                  </div> */}
                  
                  {/* 总计金额 */}
                  {selectedProduct.unitPrice && selectedProduct.unitsPerPackage && (
                    <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-emerald-700">总计金额</span>
                        <span className="text-xl font-black text-emerald-600">
                          ¥{(selectedProduct.unitPrice * selectedProduct.unitsPerPackage * packageQuantity).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-600 mt-1">
                        {packageQuantity} 件 × ¥{(selectedProduct.unitPrice * selectedProduct.unitsPerPackage).toFixed(2)}/件
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400" disabled={isSubmitting}>取消</button>
                  <Button type="submit" className="flex-[2] py-4 rounded-2xl shadow-xl shadow-emerald-100" disabled={isSubmitting}>
                    {isSubmitting ? '提交中...' : '提交订单'}
                  </Button>
                </div>
              </form>
          </div>
        </div>
      )}

    </div>
  );
};