import React, { useState, useRef, useEffect } from 'react';
import { Order, OrderStatus, LogisticsInfo, Product, ProductStatus, User, ProductChangeRequest } from '../types';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';
import { Truck, Package, Plus, Edit2, Trash2, Image as ImageIcon, Info, Archive, Layers, Ruler, CheckCircle, Clock, Upload, ChevronDown } from 'lucide-react';
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
  onDeleteProduct,
  onUpdateProductStatus
}) => {
  const toast = useToast();
  const [orderSubTab, setOrderSubTab] = useState<'pending' | 'completed'>('pending');
  const [productSubTab, setProductSubTab] = useState<'active' | 'pending' | 'delisted'>('active');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 所有我的包材
  const allMyProducts = products.filter(p => p.supplierId === currentUser.id);
  // 上架中的包材（ACTIVE状态）
  const myProducts = allMyProducts.filter(p => p.status === ProductStatus.ACTIVE);
  // 已下架的包材（INACTIVE状态）
  const delistedProducts = allMyProducts.filter(p => p.status === ProductStatus.INACTIVE);
  // 容量限制：只计算上架中的数量
  const isAtLimit = myProducts.length >= 5;

  // Filter orders
  const pendingShipmentOrders = orders.filter(o => o.status === OrderStatus.APPROVED);
  const completedOrders = orders.filter(o => 
    [OrderStatus.SHIPPED, OrderStatus.COMPLETED].includes(o.status)
  );

  // 先按状态筛选
  const statusFilteredOrders = orderSubTab === 'pending' ? pendingShipmentOrders : completedOrders;

  // 再按包材筛选
  const displayedOrders = selectedProductFilter === 'all' 
    ? statusFilteredOrders 
    : statusFilteredOrders.filter(o => o.productId === selectedProductFilter);

  // 获取当前订单中涉及的包材列表（去重）
  const ordersProductIds = new Set(statusFilteredOrders.map(o => o.productId));
  const ordersProducts = products.filter(p => ordersProductIds.has(p.id));

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
    unitsPerPackage: 1,
    packageCount: 0
  });
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  // 审核中包材状态
  const [pendingChangeRequests, setPendingChangeRequests] = useState<ProductChangeRequest[]>([]);

  // 加载审核中的包材变更请求
  useEffect(() => {
    if (activeTab === 'products') {
      loadPendingChangeRequests();
    }
  }, [activeTab, currentUser.id]);

  const loadPendingChangeRequests = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:102',message:'loadPendingChangeRequests called',data:{activeTab,currentUserId:currentUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:105',message:'Before API call',data:{status:'PENDING'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const requests = await apiService.getProductChangeRequests('PENDING');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:108',message:'API response received',data:{totalRequests:requests.length,requests:requests.map((r:any)=>({id:r.id,changeType:r.changeType,productId:r.productId,hasProduct:!!r.product,productSupplierId:r.product?.supplierId,pendingChangesSupplierId:r.pendingChanges?.supplierId}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // 过滤出当前供应商的请求
      const myRequests = requests.filter((req: any) => {
        const pendingData = req.pendingChanges;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:112',message:'Filtering request',data:{requestId:req.id,changeType:req.changeType,currentUserId:currentUser.id,pendingDataSupplierId:pendingData?.supplierId,productSupplierId:req.product?.supplierId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        if (req.changeType === 'CREATE') {
          const matches = pendingData.supplierId === currentUser.id;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:115',message:'CREATE type filter result',data:{requestId:req.id,matches,pendingDataSupplierId:pendingData?.supplierId,currentUserId:currentUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          return matches;
        } else {
          // UPDATE类型：通过product.supplierId或pendingChanges.supplierId验证
          if (req.product) {
            const matches = req.product.supplierId === currentUser.id;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:121',message:'UPDATE type filter result (via product)',data:{requestId:req.id,matches,productSupplierId:req.product.supplierId,currentUserId:currentUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
            // #endregion
            return matches;
          }
          const matches = pendingData.supplierId === currentUser.id;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:126',message:'UPDATE type filter result (via pendingChanges)',data:{requestId:req.id,matches,pendingDataSupplierId:pendingData?.supplierId,currentUserId:currentUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          return matches;
        }
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:131',message:'Filtering complete',data:{totalRequests:requests.length,filteredRequests:myRequests.length,currentUserId:currentUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      setPendingChangeRequests(myRequests);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:134',message:'loadPendingChangeRequests error',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      console.error('加载审核中包材失败:', error);
    }
  };

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:134',message:'handleImageUpload called',data:{hasFile:!!file,fileName:file?.name,fileSize:file?.size,fileType:file?.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:137',message:'File size validation failed',data:{fileSize:file.size,maxSize:2*1024*1024},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        toast.showError("图片大小不能超过 2MB");
        return;
      }

      try {
        // 显示上传中的预览（临时使用base64）
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:145',message:'Starting image upload',data:{fileName:file.name,fileSize:file.size,fileType:file.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const reader = new FileReader();
        reader.onloadend = () => {
          setProductForm(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);

        // 上传到OSS
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:152',message:'Calling uploadImage API',data:{fileName:file.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        const imageUrl = await apiService.uploadImage(file);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:155',message:'Image upload successful',data:{imageUrl:imageUrl?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // 使用OSS返回的URL替换临时预览
        setProductForm(prev => ({ ...prev, image: imageUrl }));
        toast.showSuccess('图片上传成功');
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:160',message:'Image upload error',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/SupplierView.tsx:139',message:'Opening edit modal with product',data:{productId:product.id,packageCount:product.packageCount,unitsPerPackage:product.unitsPerPackage,hasPackageCount:product.packageCount !== undefined && product.packageCount !== null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setProductForm({
        name: product.name,
        category: product.category,
        material: product.material,
        spec: product.spec,
        stock: product.stock,
        image: product.image,
        unitPrice: product.unitPrice || 0,
        unitsPerPackage: product.unitsPerPackage || 1,
        packageCount: product.packageCount || 0
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
        stock: 0,
        image: '',
        unitPrice: 0,
        unitsPerPackage: 1,
        packageCount: 0
      });
    }
    setProductModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.image) {
      toast.showError("请上传包材图片");
      return;
    }
    if (productForm.unitPrice === 0 || productForm.unitPrice === null || productForm.unitPrice === undefined) {
      toast.showError("请填写最小单位价格");
      return;
    }
    
    // 新增包材时检查容量限制（只计算上架中的数量）
    if (!editingProduct && isAtLimit) {
      toast.showError(`已达到最大上架数量（5件），请先下架其他包材`);
      return;
    }
    
    try {
      // 计算库存储备 = 件装量 * 件数
      const calculatedStock = (productForm.unitsPerPackage || 1) * (productForm.packageCount || 0);
      const productData = {
        ...productForm,
        stock: calculatedStock
      };
      
      // 定义需审核的字段
      const 审核字段: (keyof typeof productForm)[] = ['category', 'material', 'spec', 'unitPrice'];
      
      // 判断是否需要审核
      const needsApproval = !editingProduct || 审核字段.some(field => {
        // 对于数字类型字段，需要转换为相同类型再比较
        const oldValue = field === 'unitPrice' ? Number(editingProduct[field] || 0) : editingProduct[field];
        const newValue = field === 'unitPrice' ? Number(productForm[field] || 0) : productForm[field];
        return oldValue !== newValue;
      });
      
      if (needsApproval) {
        // 创建审核请求
        await apiService.createProductChangeRequest({
          productId: editingProduct?.id,
          changeType: editingProduct ? 'UPDATE' : 'CREATE',
          pendingChanges: {
            ...productData,
            supplierId: currentUser.id
          }
        });
        
        toast.showInfo('已提交审核，请等待平台审核');
      } else {
        // 直接更新（不涉及审核字段）
        onUpdateProduct({
          ...editingProduct!,
          ...productData
        });
        
        toast.showSuccess('更新成功');
      }
      
      setProductModalOpen(false);
    } catch (err: any) {
      toast.showError(err.message || '操作失败');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setDeleteProductId(productId);
  };

  // 重新上架包材
  const handleRelistProduct = (product: Product) => {
    // 检查容量限制
    if (isAtLimit) {
      toast.showError(`已达到最大上架数量（5件），请先下架其他包材`);
      return;
    }
    
    // 更新状态为ACTIVE
    onUpdateProductStatus(product, ProductStatus.ACTIVE);
  };

  // 撤销审核请求
  const handleCancelRequest = async (requestId: string) => {
    try {
      await apiService.cancelProductChangeRequest(requestId, currentUser.id);
      toast.showSuccess('已撤销');
      loadPendingChangeRequests();
    } catch (error: any) {
      toast.showError(error.message || '撤销失败');
    }
  };

  // 渲染变更字段
  const renderChangedFields = (request: ProductChangeRequest) => {
    if (request.changeType === 'CREATE') {
      // 新增：显示所有关键字段
      const changes = request.pendingChanges;
      return (
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold w-12">分类:</span>
            <span className="text-slate-700 font-black">{changes.category || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold w-12">材质:</span>
            <span className="text-slate-700 font-black">{changes.material || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold w-12">规格:</span>
            <span className="text-slate-700 font-black">{changes.spec || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold w-12">单价:</span>
            <span className="text-emerald-600 font-black">¥{changes.unitPrice || '-'}</span>
          </div>
        </div>
      );
    } else {
      // 编辑：对比显示变更字段
      const originalProduct = products.find(p => p.id === request.productId);
      const changes = request.pendingChanges;
      const changedFields: JSX.Element[] = [];

      if (originalProduct) {
        // 对比关键字段
        if (changes.category !== undefined && changes.category !== originalProduct.category) {
          changedFields.push(
            <div key="category" className="flex items-center gap-2">
              <span className="text-slate-400 font-bold w-12">分类:</span>
              <span className="text-slate-700 font-black">
                <span className="text-slate-500 line-through">{originalProduct.category}</span>
                <span className="mx-2">→</span>
                <span className="text-emerald-600">{changes.category}</span>
              </span>
            </div>
          );
        }
        if (changes.material !== undefined && changes.material !== originalProduct.material) {
          changedFields.push(
            <div key="material" className="flex items-center gap-2">
              <span className="text-slate-400 font-bold w-12">材质:</span>
              <span className="text-slate-700 font-black">
                <span className="text-slate-500 line-through">{originalProduct.material}</span>
                <span className="mx-2">→</span>
                <span className="text-emerald-600">{changes.material}</span>
              </span>
            </div>
          );
        }
        if (changes.spec !== undefined && changes.spec !== originalProduct.spec) {
          changedFields.push(
            <div key="spec" className="flex items-center gap-2">
              <span className="text-slate-400 font-bold w-12">规格:</span>
              <span className="text-slate-700 font-black">
                <span className="text-slate-500 line-through">{originalProduct.spec}</span>
                <span className="mx-2">→</span>
                <span className="text-emerald-600">{changes.spec}</span>
              </span>
            </div>
          );
        }
        if (changes.unitPrice !== undefined && changes.unitPrice !== originalProduct.unitPrice) {
          changedFields.push(
            <div key="unitPrice" className="flex items-center gap-2">
              <span className="text-slate-400 font-bold w-12">单价:</span>
              <span className="text-slate-700 font-black">
                <span className="text-slate-500 line-through">¥{originalProduct.unitPrice || '-'}</span>
                <span className="mx-2">→</span>
                <span className="text-emerald-600">¥{changes.unitPrice}</span>
              </span>
            </div>
          );
        }
      }

      if (changedFields.length === 0) {
        return (
          <div className="text-xs text-slate-400 font-bold">无变更</div>
        );
      }

      return (
        <div className="space-y-1.5 text-xs">
          {changedFields}
        </div>
      );
    }
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

          {/* 包材筛选器 */}
          {statusFilteredOrders.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className="w-full flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">
                    {selectedProductFilter === 'all' 
                      ? `全部包材 (${statusFilteredOrders.length})`
                      : `${ordersProducts.find(p => p.id === selectedProductFilter)?.name} (${statusFilteredOrders.filter(o => o.productId === selectedProductFilter).length})`
                    }
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 下拉菜单 */}
              {isFilterMenuOpen && (
                <>
                  {/* 背景遮罩 */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsFilterMenuOpen(false)}
                  />
                  
                  {/* 菜单内容 */}
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedProductFilter('all');
                        setIsFilterMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-xs font-bold transition-colors ${
                        selectedProductFilter === 'all' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>全部包材</span>
                        <span className="text-slate-400">({statusFilteredOrders.length})</span>
                      </div>
                    </button>
                    
                    {ordersProducts.map(product => {
                      const count = statusFilteredOrders.filter(o => o.productId === product.id).length;
                      return (
                        <button
                          key={product.id}
                          onClick={() => {
                            setSelectedProductFilter(product.id);
                            setIsFilterMenuOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-xs font-bold transition-colors border-t border-slate-50 ${
                            selectedProductFilter === product.id 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate pr-2">{product.name}</span>
                            <span className="text-slate-400 flex-shrink-0">({count})</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-4">
            {displayedOrders.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">暂无订单</p>
              </div>
            ) : (
              displayedOrders.map((order) => {
                // 获取对应的产品信息
                const product = products.find(p => p.id === order.productId);
                
                return (
                <div key={order.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="flex gap-4 mb-4">
                    {/* 商品缩略图 */}
                    {product?.image && (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img 
                          src={product.image} 
                          alt={order.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* 订单信息 */}
                    <div className="flex-1 flex justify-between items-start min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-300 mb-1">#{order.id}</div>
                        <div className="font-black text-slate-900 text-lg leading-tight truncate">{order.productName}</div>
                        <div className="text-[10px] font-bold text-emerald-600 mt-1 uppercase">厂家: {order.manufacturerName}</div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-500 mb-6 bg-slate-50 p-4 rounded-2xl">
                     <div>
                       <span className="block text-[9px] text-slate-300 uppercase mb-0.5">规格</span>
                       <span className="text-slate-800">{product?.spec || '-'}</span>
                     </div>
                     <div>
                       <span className="block text-[9px] text-slate-300 uppercase mb-0.5">材质</span>
                       <span className="text-slate-800">{product?.material || '-'}</span>
                     </div>
                     <div>
                       <span className="block text-[9px] text-slate-300 uppercase mb-0.5">数量</span>
                       <span className="text-slate-800">{order.quantity.toLocaleString()}</span>
                     </div>
                     <div>
                       <span className="block text-[9px] text-slate-300 uppercase mb-0.5">金额</span>
                       <span className="text-emerald-600">
                         {product?.unitPrice 
                           ? `¥${(order.quantity * product.unitPrice).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
                           : '-'}
                       </span>
                     </div>
                     <div className="col-span-2">
                       <span className="block text-[9px] text-slate-300 uppercase mb-0.5">下单日期</span>
                       <span className="text-emerald-600">{order.requestDate}</span>
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
                );
              })
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
            {productSubTab === 'active' && (
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
            )}
          </div>

          {/* 子Tab切换 */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setProductSubTab('active')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                productSubTab === 'active' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400'
              }`}
            >
              <Package className="w-4 h-4" /> 上架中
              {myProducts.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${productSubTab === 'active' ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {myProducts.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setProductSubTab('pending')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                productSubTab === 'pending' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400'
              }`}
            >
              <Clock className="w-4 h-4" /> 审核中
              {pendingChangeRequests.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${productSubTab === 'pending' ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {pendingChangeRequests.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setProductSubTab('delisted')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                productSubTab === 'delisted' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400'
              }`}
            >
              <Archive className="w-4 h-4" /> 已下架
              {delistedProducts.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${productSubTab === 'delisted' ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {delistedProducts.length}
                </span>
              )}
            </button>
          </div>

          {/* 上架中包材 */}
          {productSubTab === 'active' && (
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
                        {product.packageCount !== undefined && product.packageCount !== null && (
                          <span className="text-xs font-black text-slate-600">
                            件数: {product.packageCount}
                          </span>
                        )}
                        {product.unitsPerPackage && (
                          <span className="text-xs font-black text-slate-600">
                            件装量: {product.unitsPerPackage}
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
          )}

          {/* 审核中包材 */}
          {productSubTab === 'pending' && (
            <div className="space-y-4">
              {pendingChangeRequests.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                  <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">暂无审核中包材</p>
                </div>
              ) : (
                pendingChangeRequests.map(request => (
                  <div key={request.id} className="bg-amber-50 border-2 border-amber-200 rounded-[32px] p-4">
                    {/* 包材信息头部 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="font-black text-slate-900">{request.pendingChanges.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">
                          {request.changeType === 'CREATE' ? '新增' : '编辑'}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleCancelRequest(request.id)}
                        className="text-xs font-black text-red-600 hover:text-red-700 active:scale-95 transition-all"
                      >
                        撤销
                      </button>
                    </div>
                    
                    {/* 修改内容展示 */}
                    <div className="bg-white rounded-2xl p-3 space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-2">修改内容</div>
                      {renderChangedFields(request)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 已下架包材 */}
          {productSubTab === 'delisted' && (
            <div className="grid grid-cols-1 gap-4">
              {delistedProducts.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                  <Archive className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">暂无已下架包材</p>
                </div>
              ) : (
                delistedProducts.map(product => (
                  <div key={product.id} className="bg-slate-50 rounded-[32px] border-2 border-slate-200 p-4 flex gap-4 shadow-sm opacity-75">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover grayscale" 
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-slate-600 truncate leading-tight">{product.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-bold">
                          已下架
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {product.category} • {product.spec}
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-2">
                        <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-xs font-black text-slate-500">
                            仓储: {product.stock.toLocaleString()}
                          </span>
                          {product.packageCount !== undefined && product.packageCount !== null && (
                            <span className="text-xs font-black text-slate-500">
                              件数: {product.packageCount}
                            </span>
                          )}
                          {product.unitsPerPackage && (
                            <span className="text-xs font-black text-slate-500">
                              件装量: {product.unitsPerPackage}
                            </span>
                          )}
                          {product.unitPrice && (
                            <span className="text-xs font-black text-slate-500">
                              单价: ¥{product.unitPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button 
                            onClick={() => handleRelistProduct(product)} 
                            className="p-2 text-emerald-600 bg-emerald-50 rounded-xl active:scale-90 transition-transform"
                            title="重新上架"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <Layers className="w-3 h-3" /> 分类
                     <span className="text-[9px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-bold normal-case">
                       需审核
                     </span>
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
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <Archive className="w-3 h-3" /> 材质
                     <span className="text-[9px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-bold normal-case">
                       需审核
                     </span>
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

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Ruler className="w-3 h-3" /> 规格
                   <span className="text-[9px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-bold normal-case">
                     需审核
                   </span>
                 </label>
                 <input 
                   required 
                   className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                   value={productForm.spec} 
                   onChange={e => setProductForm({...productForm, spec: e.target.value})} 
                   placeholder="如: 500ml"
                 />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                     件装量
                   </label>
                   <input 
                     type="number"
                     min="1"
                     required
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                     value={productForm.unitsPerPackage} 
                     onChange={e => setProductForm({...productForm, unitsPerPackage: parseInt(e.target.value) || 1})} 
                     placeholder="每件包含数量"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                     件数
                   </label>
                   <input 
                     type="number"
                     min="0"
                     required
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                     value={productForm.packageCount} 
                     onChange={e => setProductForm({...productForm, packageCount: parseInt(e.target.value) || 0})} 
                     placeholder="件数"
                   />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                     库存储备（最小单位）
                   </label>
                   <input 
                     type="number"
                     readOnly
                     className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl p-4 font-black text-slate-600 cursor-not-allowed" 
                     value={(productForm.unitsPerPackage || 1) * (productForm.packageCount || 0)} 
                   />
                 </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     最小单位价格（元）
                     <span className="text-[9px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-bold normal-case">
                       需审核
                     </span>
                   </label>
                   <input 
                     type="number"
                     step="0.01"
                     min="0"
                     required
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black focus:border-emerald-500 transition-colors" 
                     value={productForm.unitPrice} 
                     onChange={e => setProductForm({...productForm, unitPrice: parseFloat(e.target.value) || 0})} 
                     placeholder="最小单位价格"
                   />
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

      {/* 下架包材确认弹窗 */}
      <MobileDialog
        open={!!deleteProductId}
        mode="confirm"
        title="下架包材"
        message="确定要下架该包材吗？下架后包材将不再对外展示，但可以重新上架。"
        confirmText="确认下架"
        cancelText="取消"
        onCancel={() => setDeleteProductId(null)}
        onConfirm={() => {
          if (deleteProductId) {
            const product = products.find(p => p.id === deleteProductId);
            if (product) {
              onUpdateProductStatus(product, ProductStatus.INACTIVE);
            }
          }
          setDeleteProductId(null);
        }}
      />
    </div>
  );
};
