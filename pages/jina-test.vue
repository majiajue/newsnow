<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Jina API 测试页面</h1>
    
    <!-- API 选择 -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-2">选择 API</h2>
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="api in apiOptions" 
          :key="api.value"
          @click="selectedApi = api.value"
          :class="[
            'px-4 py-2 rounded-lg transition',
            selectedApi === api.value 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          ]"
        >
          {{ api.label }}
        </button>
      </div>
    </div>
    
    <!-- 输入表单 -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-2">输入参数</h2>
      
      <!-- Reader API 输入 -->
      <div v-if="selectedApi === 'reader'" class="space-y-4">
        <div>
          <label class="block mb-1">URL</label>
          <input 
            v-model="readerParams.url" 
            type="text" 
            class="w-full p-2 border rounded"
            placeholder="https://example.com/article"
          />
        </div>
        <div class="flex gap-4">
          <label class="flex items-center">
            <input v-model="readerParams.extractLinks" type="checkbox" class="mr-2" />
            提取链接
          </label>
          <label class="flex items-center">
            <input v-model="readerParams.extractImages" type="checkbox" class="mr-2" />
            提取图片
          </label>
        </div>
      </div>
      
      <!-- Search API 输入 -->
      <div v-if="selectedApi === 'search'" class="space-y-4">
        <div>
          <label class="block mb-1">搜索查询</label>
          <input 
            v-model="searchParams.query" 
            type="text" 
            class="w-full p-2 border rounded"
            placeholder="人工智能最新进展"
          />
        </div>
        <div>
          <label class="block mb-1">结果数量</label>
          <input 
            v-model.number="searchParams.numResults" 
            type="number" 
            class="w-full p-2 border rounded"
            min="1" max="10"
          />
        </div>
        <div>
          <label class="block mb-1">限制网站 (可选)</label>
          <input 
            v-model="searchParams.site" 
            type="text" 
            class="w-full p-2 border rounded"
            placeholder="example.com"
          />
        </div>
      </div>
      
      <!-- Segment API 输入 -->
      <div v-if="selectedApi === 'segment'" class="space-y-4">
        <div>
          <label class="block mb-1">内容</label>
          <textarea 
            v-model="segmentParams.content" 
            class="w-full p-2 border rounded h-32"
            placeholder="输入需要分段的文本内容..."
          ></textarea>
        </div>
        <div>
          <label class="block mb-1">最大块长度</label>
          <input 
            v-model.number="segmentParams.maxChunkLength" 
            type="number" 
            class="w-full p-2 border rounded"
            min="100" max="2000"
          />
        </div>
      </div>
      
      <!-- Classify API 输入 -->
      <div v-if="selectedApi === 'classify'" class="space-y-4">
        <div>
          <label class="block mb-1">内容</label>
          <textarea 
            v-model="classifyParams.content" 
            class="w-full p-2 border rounded h-32"
            placeholder="输入需要分类的文本内容..."
          ></textarea>
        </div>
        <div>
          <label class="block mb-1">分类类别 (用逗号分隔)</label>
          <input 
            v-model="classifyParams.categoriesInput" 
            type="text" 
            class="w-full p-2 border rounded"
            placeholder="技术,商业,科学,政治,娱乐"
          />
        </div>
      </div>
      
      <!-- Quality API 输入 -->
      <div v-if="selectedApi === 'quality'" class="space-y-4">
        <div>
          <label class="block mb-1">内容</label>
          <textarea 
            v-model="qualityParams.content" 
            class="w-full p-2 border rounded h-32"
            placeholder="输入需要评估质量的文本内容..."
          ></textarea>
        </div>
        <div>
          <label class="block mb-1">标题 (可选)</label>
          <input 
            v-model="qualityParams.title" 
            type="text" 
            class="w-full p-2 border rounded"
            placeholder="文章标题"
          />
        </div>
      </div>
      
      <!-- Enhance API 输入 -->
      <div v-if="selectedApi === 'enhance'" class="space-y-4">
        <div>
          <label class="block mb-1">内容</label>
          <textarea 
            v-model="enhanceParams.content" 
            class="w-full p-2 border rounded h-32"
            placeholder="输入需要增强的文本内容..."
          ></textarea>
        </div>
        <div>
          <label class="block mb-1">标题 (可选)</label>
          <input 
            v-model="enhanceParams.title" 
            type="text" 
            class="w-full p-2 border rounded"
            placeholder="文章标题"
          />
        </div>
        <div class="flex gap-4">
          <label class="flex items-center">
            <input v-model="enhanceParams.addSummary" type="checkbox" class="mr-2" />
            添加摘要
          </label>
          <label class="flex items-center">
            <input v-model="enhanceParams.addRelatedInfo" type="checkbox" class="mr-2" />
            添加相关信息
          </label>
        </div>
      </div>
    </div>
    
    <!-- 提交按钮 -->
    <div class="mb-6">
      <button 
        @click="callApi" 
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        :disabled="loading"
      >
        {{ loading ? '处理中...' : '调用 API' }}
      </button>
    </div>
    
    <!-- 结果展示 -->
    <div v-if="result" class="mb-6">
      <h2 class="text-xl font-semibold mb-2">结果</h2>
      <div class="bg-gray-100 p-4 rounded-lg">
        <div class="mb-2">
          <span class="font-semibold">状态:</span> 
          <span :class="result.success ? 'text-green-600' : 'text-red-600'">
            {{ result.success ? '成功' : '失败' }}
          </span>
        </div>
        
        <div v-if="!result.success" class="text-red-600 mb-4">
          错误: {{ result.error }}
        </div>
        
        <div v-if="selectedApi === 'reader' && result.success" class="space-y-4">
          <div>
            <div class="font-semibold">标题:</div>
            <div>{{ result.title }}</div>
          </div>
          <div>
            <div class="font-semibold">内容:</div>
            <div class="max-h-96 overflow-y-auto">{{ result.content }}</div>
          </div>
          <div v-if="result.images && result.images.count > 0">
            <div class="font-semibold">图片 ({{ result.images.count }}):</div>
            <div class="flex flex-wrap gap-2 mt-2">
              <div v-for="(img, i) in result.images.items" :key="i" class="w-24 h-24">
                <img :src="img.url" class="w-full h-full object-cover rounded" />
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="selectedApi === 'search' && result.success" class="space-y-4">
          <div class="font-semibold">搜索结果 ({{ result.results.length }}):</div>
          <div v-for="(item, i) in result.results" :key="i" class="p-3 bg-white rounded mb-2">
            <div class="font-semibold text-blue-600">{{ item.title }}</div>
            <div class="text-sm text-gray-500">{{ item.url }}</div>
            <div class="mt-1">{{ item.snippet }}</div>
          </div>
        </div>
        
        <div v-if="selectedApi === 'segment' && result.success" class="space-y-4">
          <div class="font-semibold">分段结果 ({{ result.totalChunks }} 个片段):</div>
          <div v-for="(chunk, i) in result.chunks" :key="i" class="p-3 bg-white rounded mb-2">
            <div class="font-semibold">片段 {{ i + 1 }}</div>
            <div>{{ chunk }}</div>
          </div>
        </div>
        
        <div v-if="selectedApi === 'classify' && result.success" class="space-y-4">
          <div class="font-semibold">分类结果:</div>
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="(cat, i) in result.classifications" 
              :key="i"
              class="px-3 py-1 bg-blue-100 rounded-full"
            >
              {{ cat.prediction }} ({{ (cat.score * 100).toFixed(1) }}%)
            </div>
          </div>
        </div>
        
        <div v-if="selectedApi === 'quality' && result.success" class="space-y-4">
          <div>
            <div class="font-semibold">总体评分:</div>
            <div class="text-2xl" :class="getScoreColor(result.score)">
              {{ result.score.toFixed(1) }}/10
            </div>
          </div>
          <div>
            <div class="font-semibold">评估结果:</div>
            <div class="text-lg font-medium" :class="result.pass ? 'text-green-600' : 'text-red-600'">
              {{ result.pass ? '通过' : '未通过' }}
            </div>
          </div>
          <div>
            <div class="font-semibold">详细指标:</div>
            <div class="grid grid-cols-2 gap-2">
              <div>原创性: {{ result.metrics.originality.toFixed(1) }}/10</div>
              <div>深度: {{ result.metrics.depth.toFixed(1) }}/10</div>
              <div>可读性: {{ result.metrics.readability.toFixed(1) }}/10</div>
              <div>合规性: {{ result.metrics.compliance.score.toFixed(1) }}/10</div>
            </div>
          </div>
          <div v-if="result.feedback && result.feedback.length > 0">
            <div class="font-semibold">改进建议:</div>
            <ul class="list-disc pl-5">
              <li v-for="(tip, i) in result.feedback" :key="i">{{ tip }}</li>
            </ul>
          </div>
        </div>
        
        <div v-if="selectedApi === 'enhance' && result.success" class="space-y-4">
          <div v-if="result.summary">
            <div class="font-semibold">摘要:</div>
            <div class="p-3 bg-blue-50 rounded">{{ result.summary }}</div>
          </div>
          <div>
            <div class="font-semibold">增强后内容:</div>
            <div class="max-h-96 overflow-y-auto p-3 bg-white rounded whitespace-pre-line">
              {{ result.enhancedContent }}
            </div>
          </div>
          <div v-if="result.supplementaryInfo && result.supplementaryInfo.length > 0">
            <div class="font-semibold">补充信息:</div>
            <div v-for="(info, i) in result.supplementaryInfo" :key="i" class="p-3 bg-gray-50 rounded mb-2">
              {{ info }}
            </div>
          </div>
        </div>
        
        <div v-if="showRawResult" class="mt-4">
          <div class="font-semibold">原始响应:</div>
          <pre class="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
      
      <div class="mt-2">
        <button 
          @click="showRawResult = !showRawResult" 
          class="text-blue-600 hover:underline"
        >
          {{ showRawResult ? '隐藏' : '显示' }}原始响应
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// API 选项
const apiOptions = [
  { label: '内容读取 (Reader)', value: 'reader' },
  { label: '内容搜索 (Search)', value: 'search' },
  { label: '内容分段 (Segment)', value: 'segment' },
  { label: '内容分类 (Classify)', value: 'classify' },
  { label: '质量评估 (Quality)', value: 'quality' },
  { label: '内容增强 (Enhance)', value: 'enhance' }
]

// 当前选择的 API
const selectedApi = ref('reader')

// 各 API 参数
const readerParams = ref({
  url: 'https://www.theverge.com/tech',
  extractLinks: true,
  extractImages: true
})

const searchParams = ref({
  query: '人工智能最新技术',
  numResults: 5,
  site: ''
})

const segmentParams = ref({
  content: '人工智能(AI)正在迅速改变我们的世界。从自动驾驶汽车到智能助手，AI技术已经融入了我们日常生活的方方面面。机器学习作为AI的一个重要分支，使计算机能够从数据中学习并做出决策，而无需明确编程。深度学习则进一步推动了AI的发展，通过模仿人脑神经网络的结构，实现了更复杂的模式识别和决策能力。随着技术的不断进步，我们可以期待AI在医疗、金融、教育等领域带来更多创新和变革。',
  maxChunkLength: 500
})

const classifyParams = ref({
  content: '人工智能(AI)正在迅速改变我们的世界。从自动驾驶汽车到智能助手，AI技术已经融入了我们日常生活的方方面面。',
  categoriesInput: '技术,商业,科学,政治,娱乐'
})

const qualityParams = ref({
  content: '人工智能(AI)正在迅速改变我们的世界。从自动驾驶汽车到智能助手，AI技术已经融入了我们日常生活的方方面面。机器学习作为AI的一个重要分支，使计算机能够从数据中学习并做出决策，而无需明确编程。深度学习则进一步推动了AI的发展，通过模仿人脑神经网络的结构，实现了更复杂的模式识别和决策能力。随着技术的不断进步，我们可以期待AI在医疗、金融、教育等领域带来更多创新和变革。',
  title: '人工智能的发展与应用'
})

const enhanceParams = ref({
  content: '人工智能(AI)正在迅速改变我们的世界。从自动驾驶汽车到智能助手，AI技术已经融入了我们日常生活的方方面面。',
  title: '人工智能的影响',
  addSummary: true,
  addRelatedInfo: true
})

// 计算分类类别数组
const categories = computed(() => {
  return classifyParams.value.categoriesInput
    .split(',')
    .map(cat => cat.trim())
    .filter(cat => cat)
})

// 结果和加载状态
const result = ref(null)
const loading = ref(false)
const showRawResult = ref(false)

// 调用 API
async function callApi() {
  loading.value = true
  result.value = null
  showRawResult.value = false
  
  try {
    let apiUrl = ''
    let payload = {}
    
    // 根据选择的 API 构建请求
    switch (selectedApi.value) {
      case 'reader':
        apiUrl = '/api/jina/content'
        payload = {
          action: 'read',
          url: readerParams.value.url,
          options: {
            extractLinks: readerParams.value.extractLinks,
            extractImages: readerParams.value.extractImages
          }
        }
        break
        
      case 'search':
        apiUrl = '/api/jina/content'
        payload = {
          action: 'search',
          query: searchParams.value.query,
          options: {
            numResults: searchParams.value.numResults
          }
        }
        if (searchParams.value.site) {
          payload.options.site = searchParams.value.site
        }
        break
        
      case 'segment':
        apiUrl = '/api/jina/content'
        payload = {
          action: 'segment',
          content: segmentParams.value.content,
          options: {
            maxChunkLength: segmentParams.value.maxChunkLength
          }
        }
        break
        
      case 'classify':
        apiUrl = '/api/jina/content'
        payload = {
          action: 'classify',
          content: classifyParams.value.content,
          categories: categories.value
        }
        break
        
      case 'quality':
        apiUrl = '/api/content/quality'
        payload = {
          content: qualityParams.value.content,
          title: qualityParams.value.title
        }
        break
        
      case 'enhance':
        apiUrl = '/api/content/enhance'
        payload = {
          content: enhanceParams.value.content,
          title: enhanceParams.value.title,
          options: {
            addSummary: enhanceParams.value.addSummary,
            addRelatedInfo: enhanceParams.value.addRelatedInfo
          }
        }
        break
    }
    
    // 发送请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    result.value = await response.json()
  } catch (error) {
    result.value = {
      success: false,
      error: `请求失败: ${error.message}`
    }
  } finally {
    loading.value = false
  }
}

// 根据分数获取颜色类名
function getScoreColor(score) {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-blue-600'
  if (score >= 4) return 'text-yellow-600'
  return 'text-red-600'
}
</script>
