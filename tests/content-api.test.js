/**
 * 内容管理API测试脚本
 * 用于测试内容的创建、获取、更新、删除等功能
 */

// 测试创建内容API
async function testCreateContent() {
  console.log('测试创建内容API...');
  
  const testContent = {
    title: "测试内容标题",
    content: "这是一个测试内容，用于测试内容管理系统的API。这个内容包含足够的文字以便进行分析。",
    source: "测试来源",
    sourceUrl: "https://example.com/test",
    author: "测试作者",
    publishDate: new Date().toISOString(),
    categories: ["测试", "示例"],
    tags: ["测试标签", "API测试"],
    status: "draft"
  };

  try {
    const response = await fetch('/api/content/manage/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContent)
    });
    
    const result = await response.json();
    console.log("创建内容测试结果:", result);
    
    if (result.success) {
      console.log("✅ 创建内容测试通过");
      return result.data.id;
    } else {
      console.error("❌ 创建内容测试失败:", result.error);
      return null;
    }
  } catch (error) {
    console.error("❌ 创建内容测试失败:", error);
    return null;
  }
}

// 测试获取内容API
async function testGetContent(id) {
  console.log(`测试获取内容API (ID: ${id})...`);
  
  if (!id) {
    console.error("❌ 获取内容测试失败: 无效的内容ID");
    return false;
  }
  
  try {
    const response = await fetch(`/api/content/manage/get?id=${id}`);
    const result = await response.json();
    
    console.log("获取内容测试结果:", result);
    
    if (result.success) {
      console.log("✅ 获取内容测试通过");
      return true;
    } else {
      console.error("❌ 获取内容测试失败:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ 获取内容测试失败:", error);
    return false;
  }
}

// 测试更新内容API
async function testUpdateContent(id) {
  console.log(`测试更新内容API (ID: ${id})...`);
  
  if (!id) {
    console.error("❌ 更新内容测试失败: 无效的内容ID");
    return false;
  }
  
  const updates = {
    title: "更新后的测试内容标题",
    content: "这是更新后的测试内容。我们修改了标题和内容来测试更新功能。",
    tags: ["测试标签", "API测试", "更新测试"]
  };
  
  try {
    const response = await fetch('/api/content/manage/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        ...updates
      })
    });
    
    const result = await response.json();
    console.log("更新内容测试结果:", result);
    
    if (result.success) {
      console.log("✅ 更新内容测试通过");
      return true;
    } else {
      console.error("❌ 更新内容测试失败:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ 更新内容测试失败:", error);
    return false;
  }
}

// 测试创建内容版本API
async function testCreateVersion(id) {
  console.log(`测试创建内容版本API (ID: ${id})...`);
  
  if (!id) {
    console.error("❌ 创建内容版本测试失败: 无效的内容ID");
    return false;
  }
  
  const versionData = {
    title: "内容版本2",
    content: "这是内容的第二个版本，用于测试版本管理功能。",
    status: "draft"
  };
  
  try {
    const response = await fetch('/api/content/manage/version', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        ...versionData
      })
    });
    
    const result = await response.json();
    console.log("创建内容版本测试结果:", result);
    
    if (result.success) {
      console.log("✅ 创建内容版本测试通过");
      return true;
    } else {
      console.error("❌ 创建内容版本测试失败:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ 创建内容版本测试失败:", error);
    return false;
  }
}

// 测试获取内容版本列表API
async function testGetVersions(id) {
  console.log(`测试获取内容版本列表API (ID: ${id})...`);
  
  if (!id) {
    console.error("❌ 获取内容版本列表测试失败: 无效的内容ID");
    return false;
  }
  
  try {
    const response = await fetch(`/api/content/manage/versions?id=${id}`);
    const result = await response.json();
    
    console.log("获取内容版本列表测试结果:", result);
    
    if (result.success) {
      console.log("✅ 获取内容版本列表测试通过");
      return true;
    } else {
      console.error("❌ 获取内容版本列表测试失败:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ 获取内容版本列表测试失败:", error);
    return false;
  }
}

// 测试内容分析API
async function testAnalyzeContent() {
  console.log('测试内容分析API...');
  
  const testData = {
    content: "这是一个测试内容，用于测试内容分析功能。这个内容应该足够长，以便进行关键词提取、情感分析和质量评估。这是一个关于人工智能的文章，主要讨论了机器学习和深度学习的应用。",
    title: "人工智能测试文章",
    options: {
      extractKeywords: true,
      analyzeSentiment: true,
      analyzeQuality: true,
      analyzeReadability: true,
      extractTopics: true,
      generateSummary: true
    }
  };
  
  try {
    const response = await fetch('/api/content/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log("内容分析测试结果:", result);
    
    if (result.success) {
      console.log("✅ 内容分析测试通过");
      return true;
    } else {
      console.error("❌ 内容分析测试失败:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ 内容分析测试失败:", error);
    return false;
  }
}

// 测试内容搜索API
async function testSearchContent() {
  console.log('测试内容搜索API...');
  
  const searchParams = {
    keyword: "测试",
    page: 1,
    pageSize: 10
  };
  
  try {
    const response = await fetch('/api/content/manage/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });
    
    const result = await response.json();
    console.log("内容搜索测试结果:", result);
    
    if (result.success) {
      console.log("✅ 内容搜索测试通过");
      return true;
    } else {
      console.error("❌ 内容搜索测试失败:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ 内容搜索测试失败:", error);
    return false;
  }
}

// 测试删除内容API
async function testDeleteContent(id) {
  console.log(`测试删除内容API (ID: ${id})...`);
  
  if (!id) {
    console.error("❌ 删除内容测试失败: 无效的内容ID");
    return false;
  }
  
  try {
    const response = await fetch('/api/content/manage/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });
    
    const result = await response.json();
    console.log("删除内容测试结果:", result);
    
    if (result.success) {
      console.log("✅ 删除内容测试通过");
      return true;
    } else {
      console.error("❌ 删除内容测试失败:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ 删除内容测试失败:", error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log("========== 开始测试内容管理系统API ==========");
  
  // 测试内容分析API
  await testAnalyzeContent();
  
  // 测试创建内容
  const contentId = await testCreateContent();
  if (!contentId) {
    console.error("创建内容测试失败，终止后续测试");
    return;
  }
  
  // 测试获取内容
  await testGetContent(contentId);
  
  // 测试更新内容
  await testUpdateContent(contentId);
  
  // 测试创建内容版本
  await testCreateVersion(contentId);
  
  // 测试获取内容版本列表
  await testGetVersions(contentId);
  
  // 测试内容搜索
  await testSearchContent();
  
  // 测试删除内容
  await testDeleteContent(contentId);
  
  console.log("========== 内容管理系统API测试完成 ==========");
}

// 暴露测试函数，可以在浏览器控制台中调用
window.contentApiTest = {
  runAllTests,
  testCreateContent,
  testGetContent,
  testUpdateContent,
  testCreateVersion,
  testGetVersions,
  testAnalyzeContent,
  testSearchContent,
  testDeleteContent
};

console.log("内容管理API测试脚本已加载，可以通过 contentApiTest.runAllTests() 运行所有测试");
