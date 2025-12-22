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
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API Error: ${response.statusText}`);
    }

    const result: ApiResponse<T> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '请求失败');
    }

    return result.data as T;
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
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    
    const response = await fetch(`${API_BASE_URL}/upload/image?type=${type}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `上传失败: ${response.statusText}`);
    }

    const result: ApiResponse<{ url: string }> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '图片上传失败');
    }

    return result.data!.url;
  }
}

export const apiService = new ApiService();


