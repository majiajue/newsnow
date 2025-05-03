import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { myFetch } from '~/utils'

// 内容编辑页面
export function ContentManagerEditPage() {
  const { id } = Route.useParams()

  // 内容数据
  const [content, setContent] = useState({
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
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')

  // 版本控制
  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState('')

  // 状态
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)

  // 初始化
  useEffect(() => {
    const fetchData = async () => {
      await loadContent()
      await loadVersions()
    }
    fetchData()
  }, [id])

  // 加载内容
  const loadContent = async () => {
    try {
      setLoading(true)
      const response = await myFetch(`content/manage/get?id=${id}`)
      
      setContent(response)
      setSelectedCategories(response.categories || [])
      setSelectedTags(response.tags || [])
    } catch (error: any) {
      console.error('加载内容失败:', error)
      setError(error.message || '加载内容失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 加载版本列表
  const loadVersions = async () => {
    try {
      const response = await myFetch(`content/manage/versions?id=${id}`)
      
      setVersions(response || [])
    } catch (error: any) {
      console.error('加载版本列表失败:', error)
      setVersions([])
    }
  }

  // 创建新版本
  const createVersion = async () => {
    if (!content.title || !content.content) {
      alert('标题和内容不能为空')
      return
    }

    try {
      setSaving(true)
      const response = await myFetch('content/manage/version', {
        method: 'POST',
        body: {
          id,
          title: content.title,
          content: content.content,
          source: content.source,
          sourceUrl: content.sourceUrl,
          author: content.author,
          publishDate: content.publishDate,
          categories: selectedCategories,
          tags: selectedTags,
          status: content.status
        }
      })
      
      alert('版本创建成功')
      loadVersions()
    } catch (error: any) {
      console.error('创建版本失败:', error)
      alert(`创建版本失败: ${error.message || '未知错误'}`)
    } finally {
      setSaving(false)
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
      const response = await myFetch('content/manage/update', {
        method: 'POST',
        body: {
          id,
          title: content.title,
          content: content.content,
          source: content.source,
          sourceUrl: content.sourceUrl,
          author: content.author,
          publishDate: content.publishDate,
          categories: selectedCategories,
          tags: selectedTags,
          status: content.status
        }
      })
      
      alert('保存成功')
      // navigate({ to: '/content-manager' })
    } catch (error: any) {
      console.error('保存内容失败:', error)
      alert(`保存失败: ${error.message || '未知错误'}`)
    } finally {
      setSaving(false)
    }
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
      })
      
      setAnalysisResult(response)
      
      // 自动填充分析结果
      if (response.topics && response.topics.length > 0) {
        setContent(prev => ({
          ...prev,
          topics: response.topics.map(topic => ({
            name: topic.name,
            score: topic.score
          }))
        }))
      }
      
      if (response.keywords && response.keywords.length > 0) {
        setContent(prev => ({
          ...prev,
          keywords: response.keywords.map(keyword => ({
            name: keyword.name,
            score: keyword.score
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

  // 加载特定版本
  const loadVersion = async () => {
    if (!selectedVersion) return
    
    setLoading(true)
    
    try {
      const versionId = selectedVersion
      const version = versions.find(v => v.versionId === versionId)
      
      if (version) {
        // 更新内容数据
        const updatedContent = { ...content }
        Object.keys(updatedContent).forEach(key => {
          if (key in version) {
            if (key === 'publishDate' && version[key]) {
              updatedContent[key] = new Date(version[key]).toISOString().split('T')[0]
            } else {
              updatedContent[key] = version[key]
            }
          }
        })
        setContent(updatedContent)
        
        // 更新分类和标签
        setSelectedCategories(version.categories || [])
        setSelectedTags(version.tags || [])
      }
    } catch (error: any) {
      console.error('加载版本失败:', error)
      alert(`加载版本失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 应用分析结果
  const applyAnalysis = () => {
    if (!analysisResult) return
    
    // 应用分类
    if (analysisResult.topics) {
      const newCategories = [...selectedCategories]
      analysisResult.topics.forEach(topic => {
        if (topic.confidence > 0.5 && !newCategories.includes(topic.topic)) {
          newCategories.push(topic.topic)
        }
      })
      setSelectedCategories(newCategories)
    }
    
    // 应用关键词作为标签
    if (analysisResult.keywords) {
      const newTags = [...selectedTags]
      analysisResult.keywords.forEach(keyword => {
        if (!newTags.includes(keyword)) {
          newTags.push(keyword)
        }
      })
      setSelectedTags(newTags)
    }
  }

  // 添加分类
  const addCategory = () => {
    if (newCategory && !selectedCategories.includes(newCategory)) {
      setSelectedCategories([...selectedCategories, newCategory])
      setNewCategory('')
    }
  }

  // 移除分类
  const removeCategory = (category) => {
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
  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  // 返回列表页
  const goBack = () => {
    window.location.href = '/content-manager'
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

  // 获取情感分析样式
  const getSentimentClass = (sentiment) => {
    switch (sentiment) {
      case '积极': return 'bg-green-100 text-green-800'
      case '消极': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取情感分析进度条样式
  const getSentimentBarClass = (sentiment) => {
    switch (sentiment) {
      case '积极': return 'bg-green-600'
      case '消极': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  // 获取质量评分颜色
  const getQualityColor = (score) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 处理内容字段变化
  const handleContentChange = (field, value) => {
    setContent(prev => ({ ...prev, [field]: value }))
  }

  // 处理版本选择变化
  const handleVersionChange = (e) => {
    setSelectedVersion(e.target.value)
    loadVersion()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">编辑内容</h1>
        <button 
          onClick={goBack} 
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          返回列表
        </button>
      </div>
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow flex justify-center items-center h-64">
          <p className="text-lg">加载中...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={goBack} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回列表
          </button>
        </div>
      ) : (
        <>
          {/* 版本控制 */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">版本控制</h2>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedVersion}
                  onChange={handleVersionChange}
                  className="p-2 border rounded"
                >
                  {versions.map(version => (
                    <option 
                      key={version.versionId} 
                      value={version.versionId}
                    >
                      {formatDate(version.createdAt)} (版本 {version.versionNumber})
                    </option>
                  ))}
                </select>
                <button 
                  onClick={createVersion} 
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={saving}
                >
                  {saving ? '保存中...' : '创建新版本'}
                </button>
              </div>
            </div>
          </div>
          
          {/* 内容表单 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-1">标题 <span className="text-red-600">*</span></label>
                <input 
                  value={content.title}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  type="text" 
                  className="w-full p-2 border rounded"
                  placeholder="输入内容标题"
                />
              </div>
              <div>
                <label className="block mb-1">状态</label>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-1">来源</label>
                <input 
                  value={content.source}
                  onChange={(e) => handleContentChange('source', e.target.value)}
                  type="text" 
                  className="w-full p-2 border rounded"
                  placeholder="内容来源"
                />
              </div>
              <div>
                <label className="block mb-1">来源URL</label>
                <input 
                  value={content.sourceUrl}
                  onChange={(e) => handleContentChange('sourceUrl', e.target.value)}
                  type="text" 
                  className="w-full p-2 border rounded"
                  placeholder="https://example.com/article"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-1">作者</label>
                <input 
                  value={content.author}
                  onChange={(e) => handleContentChange('author', e.target.value)}
                  type="text" 
                  className="w-full p-2 border rounded"
                  placeholder="作者姓名"
                />
              </div>
              <div>
                <label className="block mb-1">发布日期</label>
                <input 
                  value={content.publishDate}
                  onChange={(e) => handleContentChange('publishDate', e.target.value)}
                  type="date" 
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block mb-1">分类</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedCategories.map(category => (
                  <div 
                    key={category}
                    className="px-3 py-1 bg-blue-100 rounded-full flex items-center"
                  >
                    <span>{category}</span>
                    <button 
                      onClick={() => removeCategory(category)} 
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  type="text" 
                  className="flex-1 p-2 border rounded"
                  placeholder="添加分类"
                  onKeyUp={(e) => e.key === 'Enter' && addCategory()}
                />
                <button 
                  onClick={addCategory} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block mb-1">标签</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map(tag => (
                  <div 
                    key={tag}
                    className="px-3 py-1 bg-green-100 rounded-full flex items-center"
                  >
                    <span>{tag}</span>
                    <button 
                      onClick={() => removeTag(tag)} 
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  type="text" 
                  className="flex-1 p-2 border rounded"
                  placeholder="添加标签"
                  onKeyUp={(e) => e.key === 'Enter' && addTag()}
                />
                <button 
                  onClick={addTag} 
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  添加
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block mb-1">内容 <span className="text-red-600">*</span></label>
              <textarea 
                value={content.content}
                onChange={(e) => handleContentChange('content', e.target.value)}
                className="w-full p-2 border rounded h-64"
                placeholder="输入内容正文..."
              ></textarea>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={goBack} 
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={analyzeContent} 
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  disabled={!content.content || analyzing}
                >
                  {analyzing ? '分析中...' : '分析内容'}
                </button>
                <button 
                  onClick={saveContent} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!content.title || !content.content || saving}
                >
                  {saving ? '保存中...' : '保存内容'}
                </button>
              </div>
            </div>
          </div>
          
          {/* 分析结果 */}
          {analysisResult && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
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
                      className={`px-2 py-1 rounded-full text-sm ${getSentimentClass(analysisResult.sentiment?.label)}`}
                    >
                      {analysisResult.sentiment?.label || '未知'}
                    </span>
                    <div className="ml-2 flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getSentimentBarClass(analysisResult.sentiment?.label)}`}
                        style={{width: `${analysisResult.sentiment?.score * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">质量评分</h3>
                  <div className="flex items-center">
                    <span 
                      className={`text-lg font-bold ${getQualityColor(analysisResult.quality?.score)}`}
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
        </>
      )}
    </div>
  )
}

// 定义路由
export const Route = createFileRoute('/content-manager/edit/$id')({
  component: ContentManagerEditPage
})
