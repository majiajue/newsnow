import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { myFetch } from '~/utils'

// 定义分类和标签的接口
interface Category {
  id: number | string;
  name: string;
}

interface Tag {
  id: number | string;
  name: string;
}

// 内容管理列表页面
export function ContentManagerPage() {
  // 内容列表
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  // 搜索参数
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    category: '',
    tag: '',
    status: '',
    minQuality: 0,
    page: 1,
    pageSize: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })

  // 分页信息
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  })

  // 删除相关
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [contentToDelete, setContentToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // 初始化
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchCategories(),
        fetchTags()
      ])
      await searchContent()
    }
    fetchData()
  }, [])

  // 获取所有分类
  const fetchCategories = async () => {
    try {
      const response = await myFetch('content/manage/categories')
      // 确保 categories 是一个数组，并且符合 Category 接口
      if (Array.isArray(response)) {
        // 确保每个元素都有 id 和 name 属性
        const formattedCategories = response.map(item => {
          if (typeof item === 'string') {
            // 如果是字符串，将其转换为 Category 对象
            return { id: item, name: item };
          } else if (typeof item === 'object' && item !== null) {
            // 如果是对象，确保有 id 和 name 属性
            return {
              id: item.id || item._id || item.name || item,
              name: item.name || item.title || item.id || item._id || item
            };
          }
          // 默认返回一个空对象
          return { id: String(Math.random()), name: '未知分类' };
        });
        setCategories(formattedCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('获取分类失败:', error)
      setCategories([])
    }
  }

  // 获取所有标签
  const fetchTags = async () => {
    try {
      const response = await myFetch('content/manage/tags')
      // 确保 tags 是一个数组，并且符合 Tag 接口
      if (Array.isArray(response)) {
        // 确保每个元素都有 id 和 name 属性
        const formattedTags = response.map(item => {
          if (typeof item === 'string') {
            // 如果是字符串，将其转换为 Tag 对象
            return { id: item, name: item };
          } else if (typeof item === 'object' && item !== null) {
            // 如果是对象，确保有 id 和 name 属性
            return {
              id: item.id || item._id || item.name || item,
              name: item.name || item.title || item.id || item._id || item
            };
          }
          // 默认返回一个空对象
          return { id: String(Math.random()), name: '未知标签' };
        });
        setTags(formattedTags);
      } else {
        setTags([]);
      }
    } catch (error) {
      console.error('获取标签失败:', error)
      setTags([])
    }
  }

  // 搜索内容
  const searchContent = async () => {
    try {
      setLoading(true)
      const response = await myFetch('content/manage/search', {
        method: 'POST',
        body: {
          ...searchParams,
          page: pagination.page,
          pageSize: pagination.pageSize
        }
      })
      setContents(response.data.items || [])
      setPagination({
        total: response.data.total,
        totalPages: response.data.totalPages,
        page: response.data.page,
        pageSize: response.data.pageSize
      })
    } catch (error) {
      console.error('搜索内容失败:', error)
      setContents([])
      setPagination({
        total: 0,
        totalPages: 1,
        page: 1,
        pageSize: 10
      })
    } finally {
      setLoading(false)
    }
  }

  // 上一页
  const prevPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
      searchContent()
    }
  }

  // 下一页
  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
      searchContent()
    }
  }

  // 查看内容
  const viewContent = (id) => {
    window.location.href = `/content-manager/view/${id}`
  }

  // 编辑内容
  const editContent = (id) => {
    window.location.href = `/content-manager/edit/${id}`
  }

  // 确认删除
  const confirmDelete = (content) => {
    setContentToDelete(content)
    setShowDeleteModal(true)
  }

  // 删除内容
  const deleteContent = async () => {
    if (!contentToDelete) return
    
    setDeleting(true)
    
    try {
      const response = await myFetch('content/manage/delete', {
        method: 'POST',
        body: {
          id: contentToDelete.id
        }
      })
      
      if (response.success) {
        // 删除成功，关闭对话框并刷新列表
        setShowDeleteModal(false)
        setContentToDelete(null)
        await searchContent()
      } else {
        console.error('删除内容失败:', response.error)
        alert(`删除失败: ${response.error}`)
      }
    } catch (error) {
      console.error('删除内容失败:', error)
      alert(`删除失败: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // 跳转到创建页面
  const navigateToCreate = () => {
    window.location.href = '/content-manager/create'
  }

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取质量评分颜色
  const getQualityColor = (score) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 获取状态样式
  const getStatusClass = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'published': return '已发布'
      case 'draft': return '草稿'
      case 'archived': return '已归档'
      default: return status
    }
  }

  // 更新搜索参数
  const handleSearchParamChange = (key, value) => {
    setSearchParams(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">内容管理系统</h1>
      
      {/* 搜索和筛选 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm">关键词搜索</label>
            <input 
              value={searchParams.keyword}
              onChange={(e) => handleSearchParamChange('keyword', e.target.value)}
              type="text" 
              className="w-full p-2 border rounded"
              placeholder="搜索标题或内容..."
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">分类</label>
            <select 
              value={searchParams.category}
              onChange={(e) => handleSearchParamChange('category', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">全部分类</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm">状态</label>
            <select 
              value={searchParams.status}
              onChange={(e) => handleSearchParamChange('status', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between">
          <button 
            onClick={searchContent} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
          <button 
            onClick={navigateToCreate} 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            创建内容
          </button>
        </div>
      </div>
      
      {/* 内容列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">质量评分</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr className="text-center">
                <td colSpan={6} className="px-6 py-4">加载中...</td>
              </tr>
            ) : !contents.length ? (
              <tr className="text-center">
                <td colSpan={6} className="px-6 py-4">暂无内容</td>
              </tr>
            ) : (
              contents.map(content => (
                <tr key={content.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{content.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {content.categories.map((category, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 rounded-full"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className={`text-sm font-medium ${getQualityColor(content.quality)}`}
                    >
                      {content.quality.toFixed(1)}/10
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 py-1 text-xs rounded-full ${getStatusClass(content.status)}`}
                    >
                      {getStatusText(content.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(content.updatedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => viewContent(content.id)} 
                        className="text-blue-600 hover:text-blue-900"
                      >
                        查看
                      </button>
                      <button 
                        onClick={() => editContent(content.id)} 
                        className="text-green-600 hover:text-green-900"
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => confirmDelete(content)} 
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* 分页 */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          显示 {pagination.total} 条结果中的 
          {(pagination.page - 1) * pagination.pageSize + 1} - 
          {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={prevPage} 
            className="px-3 py-1 border rounded" 
            disabled={pagination.page <= 1}
            style={{ opacity: pagination.page <= 1 ? 0.5 : 1, cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            上一页
          </button>
          <span className="px-3 py-1">{pagination.page} / {pagination.totalPages}</span>
          <button 
            onClick={nextPage} 
            className="px-3 py-1 border rounded" 
            disabled={pagination.page >= pagination.totalPages}
            style={{ opacity: pagination.page >= pagination.totalPages ? 0.5 : 1, cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer' }}
          >
            下一页
          </button>
        </div>
      </div>
      
      {/* 删除确认对话框 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">确认删除</h3>
            <p className="mb-4">确定要删除"{contentToDelete?.title}"吗？此操作无法撤销。</p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="px-4 py-2 border rounded"
              >
                取消
              </button>
              <button 
                onClick={deleteContent} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 定义路由
export const Route = createFileRoute('/content-manager')({
  component: ContentManagerPage
})
