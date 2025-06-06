'use server';

/**
 * API客户端 - 处理与后端API的通信
 */

// 获取API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * 发送GET请求到API
 * @param endpoint API端点
 * @param params 查询参数
 * @returns 响应数据
 */
export async function apiGet<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  try {
    // 构建URL
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // 添加查询参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    // 发送请求
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 禁用缓存，确保获取最新数据
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    // 解析响应数据
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

/**
 * 发送POST请求到API
 * @param endpoint API端点
 * @param body 请求体
 * @returns 响应数据
 */
export async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  try {
    // 发送请求
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store', // 禁用缓存
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    // 解析响应数据
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}
