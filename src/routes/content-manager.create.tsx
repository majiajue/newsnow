import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { myFetch } from '~/utils'

// 定义内容类型接口
interface ContentData {
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  author: string;
  publishDate: string;
  status: string;
  topics?: Array<{name: string; score: number}>;
  keywords?: Array<{name: string; score: number}>;
}

// 定义分析结果接口
interface AnalysisResult {
  topics?: Array<{topic: string; confidence: number}>;
  keywords?: string[];
  sentiment?: {
    label: string;
    score: number;
  };
  quality?: {
    score: number;
    pass: boolean;
  };
  readability?: {
    score: number;
    level: string;
    wordCount: number;
    avgSentenceLength: number;
  };
  summary?: string;
}

// 内容创建页面
export function ContentManagerCreatePage() {
  // 内容数据
  const [content, setContent] = useState<ContentData>({
    title: '',
    content: '',
    source: '',
    sourceUrl: '',
    author: '',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'draft'
  })

  // 分类和标签
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')

  // 分析结果
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)

  // 添加分类
  const addCategory = () => {
    if (newCategory && !selectedCategories.includes(newCategory)) {
      setSelectedCategories([...selectedCategories, newCategory])
      setNewCategory('')
    }
  }

  // 移除分类
  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category))
  }

  // 添加标签
  const addTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag])
      setNewTag('')
    }
  }

  // 移除标签
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  // 分析内容
  const analyzeContent = async () => {
    if (!content.content) {
      alert('内容不能为空')
      return
    }

    setAnalyzing(true)
    setAnalysisResult(null)
    
    try {
      const response = await myFetch('content/analyze', {
        method: 'POST',
        body: {
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
        }
      }) as AnalysisResult
      
      const topics = response.topics || []
      const keywords = response.keywords || []
      
      setAnalysisResult(response)
      
      // 自动填充分析结果
      if (topics.length > 0) {
        setContent(prev => ({
          ...prev,
          topics: topics.map((topic) => ({
            name: topic.topic,
            score: topic.confidence
          }))
        }))
      }
      
      if (keywords.length > 0) {
        setContent(prev => ({
          ...prev,
          keywords: keywords.map((keyword) => ({
            name: keyword,
            score: 1.0
          }))
        }))
      }
      
    } catch (error: any) {
      console.error('分析内容失败:', error)
      alert(`分析失败: ${error.message || '未知错误'}`)
    } finally {
      setAnalyzing(false)
    }
  }

  // 应用分析结果
  const applyAnalysis = () => {
    if (!analysisResult) return
    
    // 应用分类
    if (analysisResult.topics && analysisResult.topics.length > 0) {
      const newCategories = [...selectedCategories]
      analysisResult.topics.forEach(topic => {
        if (topic.confidence > 0.5 && !newCategories.includes(topic.topic)) {
          newCategories.push(topic.topic)
        }
      })
      setSelectedCategories(newCategories)
    }
    
    // 应用关键词作为标签
    if (analysisResult.keywords && analysisResult.keywords.length > 0) {
      const newTags = [...selectedTags]
      analysisResult.keywords.forEach(keyword => {
        if (!newTags.includes(keyword)) {
          newTags.push(keyword)
        }
      })
      setSelectedTags(newTags)
    }
  }

  // 保存内容
  const saveContent = async () => {
    if (!content.title || !content.content) {
      alert('标题和内容不能为空')
      return
    }

    try {
      setSaving(true)
      const response = await myFetch('content/manage/create', {
        method: 'POST',
        body: {
          ...content,
          categories: selectedCategories,
          tags: selectedTags
        }
      })
      
      alert('内容保存成功')
      goBack()
    } catch (error: any) {
      console.error('保存内容失败:', error)
      alert(`保存失败: ${error.message || '未知错误'}`)
    } finally {
      setSaving(false)
    }
  }

  // 返回列表页
  const goBack = () => {
    window.history.back()
  }

  // 获取情感分析样式
  const getSentimentClass = (sentiment: string) => {
    switch (sentiment) {
      case '积极': return 'bg-green-100 text-green-800'
      case '消极': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取情感分析进度条样式
  const getSentimentBarClass = (sentiment: string) => {
    switch (sentiment) {
      case '积极': return 'bg-green-500'
      case '消极': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // 获取质量评分颜色
  const getQualityColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 处理内容字段变化
  const handleContentChange = (field: keyof ContentData, value: any) => {
    setContent({ ...content, [field]: value })
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">创建新内容</h1>
        <div className="flex space-x-2">
          <button 
            onClick={goBack} 
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            返回
          </button>
          <button 
            onClick={saveContent} 
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {saving ? '保存中...' : '保存内容'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block mb-2 font-semibold">标题</label>
          <input 
            type="text" 
            value={content.title} 
            onChange={(e) => handleContentChange('title', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="输入内容标题"
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold">来源</label>
          <input 
            type="text" 
            value={content.source} 
            onChange={(e) => handleContentChange('source', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="内容来源（如网站名称）"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block mb-2 font-semibold">来源链接</label>
          <input 
            type="text" 
            value={content.sourceUrl} 
            onChange={(e) => handleContentChange('sourceUrl', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="http://example.com/article"
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold">作者</label>
          <input 
            type="text" 
            value={content.author} 
            onChange={(e) => handleContentChange('author', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="作者姓名"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block mb-2 font-semibold">发布日期</label>
          <input 
            type="date" 
            value={content.publishDate} 
            onChange={(e) => handleContentChange('publishDate', e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold">状态</label>
          <select 
            value={content.status} 
            onChange={(e) => handleContentChange('status', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 font-semibold">内容</label>
        <textarea 
          value={content.content} 
          onChange={(e) => handleContentChange('content', e.target.value)}
          className="w-full p-2 border rounded h-64"
          placeholder="输入内容正文"
        ></textarea>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block mb-2 font-semibold">分类</label>
          <div className="flex mb-2">
            <input 
              type="text" 
              value={newCategory} 
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 p-2 border rounded-l"
              placeholder="添加分类"
            />
            <button 
              onClick={addCategory} 
              className="px-4 py-2 bg-blue-600 text-white rounded-r"
            >
              添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 rounded-full text-sm flex items-center"
              >
                {category}
                <button 
                  onClick={() => removeCategory(category)} 
                  className="ml-1 text-red-500 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-2 font-semibold">标签</label>
          <div className="flex mb-2">
            <input 
              type="text" 
              value={newTag} 
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 p-2 border rounded-l"
              placeholder="添加标签"
            />
            <button 
              onClick={addTag} 
              className="px-4 py-2 bg-blue-600 text-white rounded-r"
            >
              添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-green-100 rounded-full text-sm flex items-center"
              >
                {tag}
                <button 
                  onClick={() => removeTag(tag)} 
                  className="ml-1 text-red-500 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <button 
          onClick={analyzeContent} 
          disabled={analyzing || !content.content}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300"
        >
          {analyzing ? '分析中...' : '分析内容'}
        </button>
        <span className="ml-2 text-sm text-gray-500">
          分析内容可以自动提取关键词、主题和情感
        </span>
      </div>
      
      {analysisResult && (
        <div className="border p-4 rounded bg-gray-50 mb-6">
          <h2 className="text-xl font-bold mb-4">内容分析结果</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">关键词</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.keywords?.map((keyword, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">主题分类</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.topics?.map((topic, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-green-100 rounded-full text-sm"
                  >
                    {topic.topic} ({(topic.confidence * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">情感分析</h3>
              <div className="flex items-center">
                <span 
                  className={`px-2 py-1 rounded-full text-sm ${getSentimentClass(analysisResult.sentiment?.label || '未知')}`}
                >
                  {analysisResult.sentiment?.label || '未知'}
                </span>
                <div className="ml-2 flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getSentimentBarClass(analysisResult.sentiment?.label || '未知')}`}
                    style={{width: `${(analysisResult.sentiment?.score || 0) * 100}%`}}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">质量评分</h3>
              <div className="flex items-center">
                <span 
                  className={`text-lg font-bold ${getQualityColor(analysisResult.quality?.score || 0)}`}
                >
                  {analysisResult.quality?.score?.toFixed(1) || '0.0'}/10
                </span>
                <span className="ml-2">
                  {analysisResult.quality?.pass ? '通过' : '未通过'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">可读性分析</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-600">可读性评分</span>
                <div className="text-lg font-semibold">{analysisResult.readability?.score?.toFixed(1) || '0.0'}/10</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">难度级别</span>
                <div className="text-lg font-semibold">{analysisResult.readability?.level || '未知'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">字数</span>
                <div className="text-lg font-semibold">{analysisResult.readability?.wordCount || 0}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">平均句长</span>
                <div className="text-lg font-semibold">{analysisResult.readability?.avgSentenceLength?.toFixed(1) || '0.0'}</div>
              </div>
            </div>
          </div>
          
          {analysisResult.summary && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">内容摘要</h3>
              <div className="p-3 bg-gray-50 rounded">
                {analysisResult.summary}
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button 
              onClick={applyAnalysis} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              应用分析结果
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 定义路由
export const Route = createFileRoute('/content-manager/create')({
  component: ContentManagerCreatePage
})
