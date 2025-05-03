<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">内容管理系统</h1>
    
    <!-- 搜索和筛选 -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block mb-1 text-sm">关键词搜索</label>
          <input 
            v-model="searchParams.keyword" 
            type="text" 
            class="w-full p-2 border rounded"
            placeholder="搜索标题或内容..."
          />
        </div>
        <div>
          <label class="block mb-1 text-sm">分类</label>
          <select v-model="searchParams.category" class="w-full p-2 border rounded">
            <option value="">全部分类</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <div>
          <label class="block mb-1 text-sm">状态</label>
          <select v-model="searchParams.status" class="w-full p-2 border rounded">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </div>
      <div class="flex justify-between">
        <button 
          @click="searchContent" 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          :disabled="loading"
        >
          {{ loading ? '搜索中...' : '搜索' }}
        </button>
        <button 
          @click="navigateToCreate" 
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          创建内容
        </button>
      </div>
    </div>
    
    <!-- 内容列表 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">质量评分</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading" class="text-center">
            <td colspan="6" class="px-6 py-4">加载中...</td>
          </tr>
          <tr v-else-if="!contents.length" class="text-center">
            <td colspan="6" class="px-6 py-4">暂无内容</td>
          </tr>
          <tr v-for="content in contents" :key="content.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ content.title }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex flex-wrap gap-1">
                <span 
                  v-for="(category, index) in content.categories" 
                  :key="index"
                  class="px-2 py-1 text-xs bg-blue-100 rounded-full"
                >
                  {{ category }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div 
                class="text-sm font-medium" 
                :class="getQualityColor(content.quality)"
              >
                {{ content.quality.toFixed(1) }}/10
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="px-2 py-1 text-xs rounded-full" 
                :class="getStatusClass(content.status)"
              >
                {{ getStatusText(content.status) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">
                {{ formatDate(content.updatedAt) }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-2">
                <button 
                  @click="viewContent(content.id)" 
                  class="text-blue-600 hover:text-blue-900"
                >
                  查看
                </button>
                <button 
                  @click="editContent(content.id)" 
                  class="text-green-600 hover:text-green-900"
                >
                  编辑
                </button>
                <button 
                  @click="confirmDelete(content)" 
                  class="text-red-600 hover:text-red-900"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 分页 -->
    <div class="mt-4 flex justify-between items-center">
      <div class="text-sm text-gray-700">
        显示 {{ pagination.total }} 条结果中的 
        {{ (pagination.page - 1) * pagination.pageSize + 1 }} - 
        {{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} 条
      </div>
      <div class="flex space-x-2">
        <button 
          @click="prevPage" 
          class="px-3 py-1 border rounded" 
          :disabled="pagination.page <= 1"
          :class="pagination.page <= 1 ? 'opacity-50 cursor-not-allowed' : ''"
        >
          上一页
        </button>
        <span class="px-3 py-1">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button 
          @click="nextPage" 
          class="px-3 py-1 border rounded" 
          :disabled="pagination.page >= pagination.totalPages"
          :class="pagination.page >= pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''"
        >
          下一页
        </button>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">确认删除</h3>
        <p class="mb-4">确定要删除"{{ contentToDelete?.title }}"吗？此操作无法撤销。</p>
        <div class="flex justify-end space-x-2">
          <button 
            @click="showDeleteModal = false" 
            class="px-4 py-2 border rounded"
          >
            取消
          </button>
          <button 
            @click="deleteContent" 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            :disabled="deleting"
          >
            {{ deleting ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 内容列表
const contents = ref([])
const loading = ref(false)
const categories = ref([])
const tags = ref([])

// 搜索参数
const searchParams = reactive({
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
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
})

// 删除相关
const showDeleteModal = ref(false)
const contentToDelete = ref(null)
const deleting = ref(false)

// 初始化
onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchTags()
  ])
  await searchContent()
})

// 获取所有分类
async function fetchCategories() {
  try {
    const response = await fetch('/api/content/manage/categories')
    const result = await response.json()
    
    if (result.success) {
      categories.value = result.data
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 获取所有标签
async function fetchTags() {
  try {
    const response = await fetch('/api/content/manage/tags')
    const result = await response.json()
    
    if (result.success) {
      tags.value = result.data
    }
  } catch (error) {
    console.error('获取标签失败:', error)
  }
}

// 搜索内容
async function searchContent() {
  loading.value = true
  contents.value = []
  
  try {
    const response = await fetch('/api/content/manage/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...searchParams,
        page: pagination.page,
        pageSize: pagination.pageSize
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      contents.value = result.data.items
      pagination.total = result.data.total
      pagination.totalPages = result.data.totalPages
      pagination.page = result.data.page
      pagination.pageSize = result.data.pageSize
    } else {
      console.error('搜索内容失败:', result.error)
    }
  } catch (error) {
    console.error('搜索内容失败:', error)
  } finally {
    loading.value = false
  }
}

// 上一页
function prevPage() {
  if (pagination.page > 1) {
    pagination.page--
    searchContent()
  }
}

// 下一页
function nextPage() {
  if (pagination.page < pagination.totalPages) {
    pagination.page++
    searchContent()
  }
}

// 查看内容
function viewContent(id) {
  router.push(`/content-manager/view/${id}`)
}

// 编辑内容
function editContent(id) {
  router.push(`/content-manager/edit/${id}`)
}

// 确认删除
function confirmDelete(content) {
  contentToDelete.value = content
  showDeleteModal.value = true
}

// 删除内容
async function deleteContent() {
  if (!contentToDelete.value) return
  
  deleting.value = true
  
  try {
    const response = await fetch('/api/content/manage/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: contentToDelete.value.id
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      // 删除成功，关闭对话框并刷新列表
      showDeleteModal.value = false
      contentToDelete.value = null
      await searchContent()
    } else {
      console.error('删除内容失败:', result.error)
      alert(`删除失败: ${result.error}`)
    }
  } catch (error) {
    console.error('删除内容失败:', error)
    alert(`删除失败: ${error.message}`)
  } finally {
    deleting.value = false
  }
}

// 跳转到创建页面
function navigateToCreate() {
  router.push('/content-manager/create')
}

// 格式化日期
function formatDate(dateString) {
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
function getQualityColor(score) {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-blue-600'
  if (score >= 4) return 'text-yellow-600'
  return 'text-red-600'
}

// 获取状态样式
function getStatusClass(status) {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800'
    case 'draft': return 'bg-yellow-100 text-yellow-800'
    case 'archived': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// 获取状态文本
function getStatusText(status) {
  switch (status) {
    case 'published': return '已发布'
    case 'draft': return '草稿'
    case 'archived': return '已归档'
    default: return status
  }
}
</script>
