<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">编辑内容</h1>
      <button 
        @click="goBack" 
        class="px-4 py-2 border rounded hover:bg-gray-100"
      >
        返回列表
      </button>
    </div>
    
    <div v-if="loading" class="bg-white p-6 rounded-lg shadow flex justify-center items-center h-64">
      <p class="text-lg">加载中...</p>
    </div>
    
    <div v-else-if="error" class="bg-white p-6 rounded-lg shadow">
      <p class="text-red-600">{{ error }}</p>
      <button 
        @click="goBack" 
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        返回列表
      </button>
    </div>
    
    <template v-else>
      <!-- 版本控制 -->
      <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">版本控制</h2>
          <div class="flex items-center gap-2">
            <select 
              v-model="selectedVersion" 
              class="p-2 border rounded"
              @change="loadVersion"
            >
              <option 
                v-for="version in versions" 
                :key="version.versionId" 
                :value="version.versionId"
              >
                {{ formatDate(version.createdAt) }} ({{ version.versionNumber }})
              </option>
            </select>
            <button 
              @click="createNewVersion" 
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              :disabled="saving"
            >
              {{ saving ? '保存中...' : '创建新版本' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- 内容表单 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block mb-1">标题 <span class="text-red-600">*</span></label>
            <input 
              v-model="content.title" 
              type="text" 
              class="w-full p-2 border rounded"
              placeholder="输入内容标题"
            />
          </div>
          <div>
            <label class="block mb-1">状态</label>
            <select v-model="content.status" class="w-full p-2 border rounded">
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block mb-1">来源</label>
            <input 
              v-model="content.source" 
              type="text" 
              class="w-full p-2 border rounded"
              placeholder="内容来源"
            />
          </div>
          <div>
            <label class="block mb-1">来源URL</label>
            <input 
              v-model="content.sourceUrl" 
              type="text" 
              class="w-full p-2 border rounded"
              placeholder="https://example.com/article"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block mb-1">作者</label>
            <input 
              v-model="content.author" 
              type="text" 
              class="w-full p-2 border rounded"
              placeholder="作者姓名"
            />
          </div>
          <div>
            <label class="block mb-1">发布日期</label>
            <input 
              v-model="content.publishDate" 
              type="date" 
              class="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div class="mb-6">
          <label class="block mb-1">分类</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <div 
              v-for="category in selectedCategories" 
              :key="category"
              class="px-3 py-1 bg-blue-100 rounded-full flex items-center"
            >
              <span>{{ category }}</span>
              <button 
                @click="removeCategory(category)" 
                class="ml-2 text-blue-600 hover:text-blue-800"
              >
                &times;
              </button>
            </div>
          </div>
          <div class="flex gap-2">
            <input 
              v-model="newCategory" 
              type="text" 
              class="flex-1 p-2 border rounded"
              placeholder="添加分类"
              @keyup.enter="addCategory"
            />
            <button 
              @click="addCategory" 
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              添加
            </button>
          </div>
        </div>
        
        <div class="mb-6">
          <label class="block mb-1">标签</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <div 
              v-for="tag in selectedTags" 
              :key="tag"
              class="px-3 py-1 bg-green-100 rounded-full flex items-center"
            >
              <span>{{ tag }}</span>
              <button 
                @click="removeTag(tag)" 
                class="ml-2 text-green-600 hover:text-green-800"
              >
                &times;
              </button>
            </div>
          </div>
          <div class="flex gap-2">
            <input 
              v-model="newTag" 
              type="text" 
              class="flex-1 p-2 border rounded"
              placeholder="添加标签"
              @keyup.enter="addTag"
            />
            <button 
              @click="addTag" 
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              添加
            </button>
          </div>
        </div>
        
        <div class="mb-6">
          <label class="block mb-1">内容 <span class="text-red-600">*</span></label>
          <textarea 
            v-model="content.content" 
            class="w-full p-2 border rounded h-64"
            placeholder="输入内容正文..."
          ></textarea>
        </div>
        
        <div class="flex justify-between">
          <button 
            @click="goBack" 
            class="px-4 py-2 border rounded hover:bg-gray-100"
          >
            取消
          </button>
          <div class="flex gap-2">
            <button 
              @click="analyzeContent" 
              class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              :disabled="!content.content || analyzing"
            >
              {{ analyzing ? '分析中...' : '分析内容' }}
            </button>
            <button 
              @click="updateContent" 
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              :disabled="!content.title || !content.content || saving"
            >
              {{ saving ? '保存中...' : '更新内容' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- 分析结果 -->
      <div v-if="analysisResult" class="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">内容分析结果</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="font-semibold mb-2">关键词</h3>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="(keyword, index) in analysisResult.keywords" 
                :key="index"
                class="px-2 py-1 bg-blue-100 rounded-full text-sm"
              >
                {{ keyword }}
              </span>
            </div>
          </div>
          
          <div>
            <h3 class="font-semibold mb-2">主题分类</h3>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="(topic, index) in analysisResult.topics" 
                :key="index"
                class="px-2 py-1 bg-green-100 rounded-full text-sm"
              >
                {{ topic.topic }} ({{ (topic.confidence * 100).toFixed(0) }}%)
              </span>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="font-semibold mb-2">情感分析</h3>
            <div class="flex items-center">
              <span 
                class="px-2 py-1 rounded-full text-sm"
                :class="getSentimentClass(analysisResult.sentiment?.label)"
              >
                {{ analysisResult.sentiment?.label || '未知' }}
              </span>
              <div class="ml-2 flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  class="h-full"
                  :class="getSentimentBarClass(analysisResult.sentiment?.label)"
                  :style="`width: ${analysisResult.sentiment?.score * 100}%`"
                ></div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 class="font-semibold mb-2">质量评分</h3>
            <div class="flex items-center">
              <span 
                class="text-lg font-bold"
                :class="getQualityColor(analysisResult.quality?.score)"
              >
                {{ analysisResult.quality?.score?.toFixed(1) || '0.0' }}/10
              </span>
              <span class="ml-2">
                {{ analysisResult.quality?.pass ? '通过' : '未通过' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="mb-6">
          <h3 class="font-semibold mb-2">可读性分析</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span class="text-sm text-gray-600">可读性评分</span>
              <div class="text-lg font-semibold">{{ analysisResult.readability?.score?.toFixed(1) || '0.0' }}/10</div>
            </div>
            <div>
              <span class="text-sm text-gray-600">难度级别</span>
              <div class="text-lg font-semibold">{{ analysisResult.readability?.level || '未知' }}</div>
            </div>
            <div>
              <span class="text-sm text-gray-600">字数</span>
              <div class="text-lg font-semibold">{{ analysisResult.readability?.wordCount || 0 }}</div>
            </div>
            <div>
              <span class="text-sm text-gray-600">平均句长</span>
              <div class="text-lg font-semibold">{{ analysisResult.readability?.avgSentenceLength?.toFixed(1) || '0.0' }}</div>
            </div>
          </div>
        </div>
        
        <div v-if="analysisResult.summary" class="mb-6">
          <h3 class="font-semibold mb-2">内容摘要</h3>
          <div class="p-3 bg-gray-50 rounded">
            {{ analysisResult.summary }}
          </div>
        </div>
        
        <div class="flex justify-end">
          <button 
            @click="applyAnalysis" 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            应用分析结果
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const contentId = route.params.id

// 内容数据
const content = reactive({
  id: '',
  title: '',
  content: '',
  source: '',
  sourceUrl: '',
  author: '',
  publishDate: '',
  status: 'draft'
})

// 分类和标签
const selectedCategories = ref([])
const selectedTags = ref([])
const newCategory = ref('')
const newTag = ref('')

// 版本控制
const versions = ref([])
const selectedVersion = ref('')

// 状态
const loading = ref(true)
const error = ref(null)
const analysisResult = ref(null)
const analyzing = ref(false)
const saving = ref(false)

// 初始化
onMounted(async () => {
  await loadContent()
  await loadVersions()
})

// 加载内容
async function loadContent() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`/api/content/manage/get?id=${contentId}`)
    const result = await response.json()
    
    if (result.success) {
      const contentData = result.data
      
      // 更新内容数据
      Object.keys(content).forEach(key => {
        if (key in contentData) {
          if (key === 'publishDate' && contentData[key]) {
            content[key] = new Date(contentData[key]).toISOString().split('T')[0]
          } else {
            content[key] = contentData[key]
          }
        }
      })
      
      // 更新分类和标签
      selectedCategories.value = contentData.categories || []
      selectedTags.value = contentData.tags || []
    } else {
      error.value = `加载内容失败: ${result.error}`
    }
  } catch (error) {
    console.error('加载内容失败:', error)
    error.value = `加载内容失败: ${error.message}`
  } finally {
    loading.value = false
  }
}

// 加载版本列表
async function loadVersions() {
  try {
    const response = await fetch(`/api/content/manage/versions?id=${contentId}`)
    const result = await response.json()
    
    if (result.success) {
      versions.value = result.data
      if (versions.value.length > 0) {
        selectedVersion.value = versions.value[0].versionId
      }
    } else {
      console.error('加载版本列表失败:', result.error)
    }
  } catch (error) {
    console.error('加载版本列表失败:', error)
  }
}

// 加载特定版本
async function loadVersion() {
  if (!selectedVersion.value) return
  
  loading.value = true
  
  try {
    const versionId = selectedVersion.value
    const version = versions.value.find(v => v.versionId === versionId)
    
    if (version) {
      // 更新内容数据
      Object.keys(content).forEach(key => {
        if (key in version) {
          if (key === 'publishDate' && version[key]) {
            content[key] = new Date(version[key]).toISOString().split('T')[0]
          } else {
            content[key] = version[key]
          }
        }
      })
      
      // 更新分类和标签
      selectedCategories.value = version.categories || []
      selectedTags.value = version.tags || []
    }
  } catch (error) {
    console.error('加载版本失败:', error)
    alert(`加载版本失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 创建新版本
async function createNewVersion() {
  if (!content.title || !content.content) {
    alert('标题和内容不能为空')
    return
  }
  
  saving.value = true
  
  try {
    const response = await fetch('/api/content/manage/version', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: contentId,
        title: content.title,
        content: content.content,
        source: content.source,
        sourceUrl: content.sourceUrl,
        author: content.author,
        publishDate: content.publishDate,
        categories: selectedCategories.value,
        tags: selectedTags.value,
        status: content.status
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert('新版本创建成功')
      await loadVersions()
    } else {
      console.error('创建新版本失败:', result.error)
      alert(`创建新版本失败: ${result.error}`)
    }
  } catch (error) {
    console.error('创建新版本失败:', error)
    alert(`创建新版本失败: ${error.message}`)
  } finally {
    saving.value = false
  }
}

// 更新内容
async function updateContent() {
  if (!content.title || !content.content) {
    alert('标题和内容不能为空')
    return
  }
  
  saving.value = true
  
  try {
    const response = await fetch('/api/content/manage/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: contentId,
        title: content.title,
        content: content.content,
        source: content.source,
        sourceUrl: content.sourceUrl,
        author: content.author,
        publishDate: content.publishDate,
        categories: selectedCategories.value,
        tags: selectedTags.value,
        status: content.status
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert('内容更新成功')
      await loadContent()
      await loadVersions()
    } else {
      console.error('更新内容失败:', result.error)
      alert(`更新失败: ${result.error}`)
    }
  } catch (error) {
    console.error('更新内容失败:', error)
    alert(`更新失败: ${error.message}`)
  } finally {
    saving.value = false
  }
}

// 分析内容
async function analyzeContent() {
  if (!content.content) return
  
  analyzing.value = true
  analysisResult.value = null
  
  try {
    const response = await fetch('/api/content/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content.content,
        title: content.title,
        options: {
          extractKeywords: true,
          analyzeSentiment: true,
          analyzeQuality: true,
          analyzeReadability: true,
          extractTopics: true,
          generateSummary: true
        }
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      analysisResult.value = result
    } else {
      console.error('分析内容失败:', result.error)
      alert(`分析失败: ${result.error}`)
    }
  } catch (error) {
    console.error('分析内容失败:', error)
    alert(`分析失败: ${error.message}`)
  } finally {
    analyzing.value = false
  }
}

// 应用分析结果
function applyAnalysis() {
  if (!analysisResult.value) return
  
  // 应用分类
  if (analysisResult.value.topics) {
    analysisResult.value.topics.forEach(topic => {
      if (topic.confidence > 0.5 && !selectedCategories.value.includes(topic.topic)) {
        selectedCategories.value.push(topic.topic)
      }
    })
  }
  
  // 应用关键词作为标签
  if (analysisResult.value.keywords) {
    analysisResult.value.keywords.forEach(keyword => {
      if (!selectedTags.value.includes(keyword)) {
        selectedTags.value.push(keyword)
      }
    })
  }
}

// 添加分类
function addCategory() {
  if (newCategory.value && !selectedCategories.value.includes(newCategory.value)) {
    selectedCategories.value.push(newCategory.value)
    newCategory.value = ''
  }
}

// 移除分类
function removeCategory(category) {
  selectedCategories.value = selectedCategories.value.filter(c => c !== category)
}

// 添加标签
function addTag() {
  if (newTag.value && !selectedTags.value.includes(newTag.value)) {
    selectedTags.value.push(newTag.value)
    newTag.value = ''
  }
}

// 移除标签
function removeTag(tag) {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

// 返回列表页
function goBack() {
  router.push('/content-manager')
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

// 获取情感分析样式
function getSentimentClass(sentiment) {
  switch (sentiment) {
    case '积极': return 'bg-green-100 text-green-800'
    case '消极': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// 获取情感分析进度条样式
function getSentimentBarClass(sentiment) {
  switch (sentiment) {
    case '积极': return 'bg-green-600'
    case '消极': return 'bg-red-600'
    default: return 'bg-gray-600'
  }
}

// 获取质量评分颜色
function getQualityColor(score) {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-blue-600'
  if (score >= 4) return 'text-yellow-600'
  return 'text-red-600'
}
</script>
