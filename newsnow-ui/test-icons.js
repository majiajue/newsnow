// 测试lucide-react导入
try {
  const { Search, X, Filter, RefreshCw, ChevronDown, ChevronUp, ArrowUpDown, SearchX } = require('lucide-react');
  console.log('✅ 所有图标导入成功');
  console.log('Search:', typeof Search);
  console.log('X:', typeof X);
  console.log('Filter:', typeof Filter);
  console.log('RefreshCw:', typeof RefreshCw);
  console.log('ChevronDown:', typeof ChevronDown);
  console.log('ChevronUp:', typeof ChevronUp);
  console.log('ArrowUpDown:', typeof ArrowUpDown);
  console.log('SearchX:', typeof SearchX);
} catch (error) {
  console.error('❌ 导入失败:', error.message);
}
