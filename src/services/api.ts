// API服务层
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:11',message:'API request entry',data:{apiBaseUrl:API_BASE_URL,endpoint,method:options?.method||'GET'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const token = localStorage.getItem('token');
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:18',message:'Before fetch',data:{fullUrl,hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options?.headers,
        },
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:30',message:'Fetch response received',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:35',message:'Response not OK',data:{status:response.status,errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        throw new Error(error.message || `API Error: ${response.statusText}`);
      }

      const result: ApiResponse<T> = await response.json();
      
      if (!result.success) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:42',message:'API response not successful',data:{message:result.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        throw new Error(result.message || '请求失败');
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:47',message:'API request success',data:{endpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return result.data as T;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:50',message:'Fetch error caught',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,200),fullUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  }

  // ========== 认证相关 ==========
  async login(phone: string, role: string) {
    return this.request<{ user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    });
  }

  async resetPassword(userId: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // ========== 用户相关 ==========
  async getUsers(params?: { role?: string }) {
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return this.request<any[]>(`/users${query}`);
  }

  async createUser(userData: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: any) {
    return this.request<any>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async toggleUserStatus(userId: string) {
    const user = await this.getUsers();
    const currentUser = user.find(u => u.id === userId);
    const newStatus = currentUser?.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    
    return this.request<any>(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async updateUserAvatar(userId: string, avatarUrl: string) {
    return this.request<any>(`/users/${userId}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ avatar: avatarUrl }),
    });
  }

  async updateUserEmail(userId: string, email: string) {
    return this.request<any>(`/users/${userId}/email`, {
      method: 'PATCH',
      body: JSON.stringify({ email }),
    });
  }

  async updateUserPassword(userId: string, oldPassword: string, newPassword: string) {
    return this.request<any>(`/users/${userId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  // ========== 产品相关 ==========
  async getProducts(params?: { supplierId?: string; status?: string }) {
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return this.request<any[]>(`/products${query}`);
  }

  async createProduct(productData: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId: string, productData: any) {
    return this.request<any>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId: string) {
    return this.request<{ message: string }>(`/products/${productId}`, {
      method: 'DELETE',
    });
  }

  async updateProductStatus(productId: string, status: string) {
    return this.request<any>(`/products/${productId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ========== 产品变更审核相关 ==========
  async getProductChangeRequests(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/product-change-requests${query}`, {
      method: 'GET',
    });
  }

  async createProductChangeRequest(data: {
    productId?: string;
    changeType: string;
    pendingChanges: any;
  }) {
    return this.request<any>('/product-change-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveProductChange(requestId: string, reviewerId: string) {
    return this.request<void>(`/product-change-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewerId }),
    });
  }

  async rejectProductChange(requestId: string, reviewerId: string, rejectReason: string) {
    return this.request<void>(`/product-change-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewerId, rejectReason }),
    });
  }

  async cancelProductChangeRequest(requestId: string, supplierId: string) {
    return this.request<void>(`/product-change-requests/${requestId}`, {
      method: 'DELETE',
      body: JSON.stringify({ supplierId }),
    });
  }

  // ========== 订单相关 ==========
  async getOrders(params?: { status?: string; manufacturerId?: string; manufacturerName?: string }) {
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return this.request<any[]>(`/orders${query}`);
  }

  async getOrderDetail(orderId: string) {
    return this.request<any>(`/orders/${orderId}`);
  }

  async createOrder(orderData: any) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(orderId: string, status: string, reason?: string) {
    return this.request<any>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async shipOrder(orderId: string, logistics: any) {
    return this.request<any>(`/orders/${orderId}/ship`, {
      method: 'POST',
      body: JSON.stringify(logistics),
    });
  }

  async confirmReceipt(orderId: string) {
    return this.request<any>(`/orders/${orderId}/confirm`, {
      method: 'POST',
    });
  }

  // ========== 文件上传相关 ==========
  async uploadImage(file: File, type: 'product' | 'avatar' = 'product'): Promise<string> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:244',message:'uploadImage API entry',data:{fileName:file.name,fileSize:file.size,fileType:file.type,type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const uploadUrl = `${API_BASE_URL}/upload/image?type=${type}`;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:250',message:'Before fetch upload request',data:{uploadUrl,hasToken:!!token,formDataHasImage:formData.has('image')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:261',message:'Upload response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,contentType:response.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const errorText = await response.text();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:265',message:'Upload response not OK',data:{status:response.status,statusText:response.statusText,errorText:errorText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: response.statusText };
        }
        throw new Error(error.message || `上传失败: ${response.statusText}`);
      }

      const result: ApiResponse<{ url: string }> = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:275',message:'Upload response parsed',data:{success:result.success,hasData:!!result.data,hasUrl:!!result.data?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      
      if (!result.success) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:278',message:'Upload response not successful',data:{message:result.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        throw new Error(result.message || '图片上传失败');
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:283',message:'Upload success, returning URL',data:{url:result.data?.url?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      return result.data!.url;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dc13414b-64e8-49e0-86aa-2afbb9b33e65',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:286',message:'Upload fetch error caught',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  }
}

export const apiService = new ApiService();


