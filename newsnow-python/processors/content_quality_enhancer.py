# -*- coding: utf-8 -*-

"""
内容质量增强处理器 - 专门为提升AdSense内容质量而设计
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.improved_ai_service import FinanceAnalyzer
from db.sqlite_client import SQLiteClient

logger = logging.getLogger(__name__)

class ContentQualityEnhancer:
    """内容质量增强器 - 专门提升AdSense内容质量"""
    
    def __init__(self, db_path=None):
        """
        初始化内容质量增强器
        
        Args:
            db_path (str, optional): 数据库路径
        """
        self.db_client = SQLiteClient(db_path)
        
        # 初始化AI分析器
        api_key = os.environ.get("DEEPSEEK_API_KEY")
        if api_key:
            self.finance_analyzer = FinanceAnalyzer(api_key=api_key)
            self.ai_enabled = True
            logger.info("内容质量增强器初始化成功，AI功能已启用")
        else:
            self.finance_analyzer = None
            self.ai_enabled = False
            logger.warning("未找到 DEEPSEEK_API_KEY，内容质量增强器将以有限模式运行（仅数据库操作）")
    
    def enhance_article_quality(self, article_id: str, source: str = None) -> Dict:
        """
        增强单篇文章的质量
        
        Args:
            article_id (str): 文章ID
            source (str, optional): 文章来源
            
        Returns:
            Dict: 增强后的文章数据
        """
        try:
            # 获取原文章
            article = self.db_client.get_article_by_id(article_id, source)
            if not article:
                logger.error(f"未找到文章 ID: {article_id}")
                return None
            
            logger.info(f"开始增强文章质量: {article.get('title', '')}")
            
            # 1. 生成深度分析内容
            if self.ai_enabled:
                enhanced_analysis = self.finance_analyzer.analyze_article(article)
            else:
                enhanced_analysis = {}
            
            # 2. 生成SEO优化内容
            if self.ai_enabled:
                seo_content = self.finance_analyzer.generate_seo_content(article)
            else:
                seo_content = {}
            
            # 3. 整合增强内容
            enhanced_article = self._integrate_enhanced_content(
                article, enhanced_analysis, seo_content
            )
            
            # 4. 保存增强后的文章
            self._save_enhanced_article(enhanced_article)
            
            logger.info(f"文章质量增强完成: {article_id}")
            return enhanced_article
            
        except Exception as e:
            logger.error(f"增强文章质量失败 {article_id}: {str(e)}")
            return None
    
    def batch_enhance_articles(self, limit: int = 10, source: str = None) -> List[Dict]:
        """
        批量增强文章质量
        
        Args:
            limit (int): 处理文章数量限制
            source (str, optional): 指定来源
            
        Returns:
            List[Dict]: 增强后的文章列表
        """
        try:
            # 获取需要增强的文章（优先选择未增强的）
            articles = self.db_client.get_articles_for_enhancement(limit, source)
            
            enhanced_articles = []
            for article in articles:
                enhanced = self.enhance_article_quality(
                    article.get('id'), article.get('source')
                )
                if enhanced:
                    enhanced_articles.append(enhanced)
            
            logger.info(f"批量增强完成，处理了 {len(enhanced_articles)} 篇文章")
            return enhanced_articles
            
        except Exception as e:
            logger.error(f"批量增强文章失败: {str(e)}")
            return []
    
    def _integrate_enhanced_content(self, original_article: Dict, 
                                   analysis: Dict, seo_content: Dict) -> Dict:
        """
        整合增强内容
        
        Args:
            original_article (Dict): 原文章
            analysis (Dict): AI分析结果
            seo_content (Dict): SEO优化内容
            
        Returns:
            Dict: 整合后的文章
        """
        enhanced = original_article.copy()
        
        # 更新标题（使用SEO优化的标题）
        if seo_content and seo_content.get('seo_title'):
            enhanced['enhanced_title'] = seo_content['seo_title']
            enhanced['meta_description'] = seo_content.get('meta_description', '')
        
        # 添加深度分析内容
        if analysis and not analysis.get('error'):
            enhanced['quality_analysis'] = analysis
            enhanced['executive_summary'] = analysis.get('executive_summary', '')
            enhanced['key_insights'] = analysis.get('key_insights', [])
            enhanced['expert_opinion'] = analysis.get('expert_opinion', {})
            enhanced['actionable_advice'] = analysis.get('actionable_advice', [])
            enhanced['seo_keywords'] = analysis.get('seo_keywords', [])
            
            # 计算内容质量评分
            quality_score = analysis.get('content_quality_score', '0')
            try:
                enhanced['quality_score'] = int(quality_score) if isinstance(quality_score, str) else quality_score
            except:
                enhanced['quality_score'] = 7  # 默认评分
            
            # 原创度评估
            originality = analysis.get('originality_percentage', '80%')
            enhanced['originality_percentage'] = originality
        
        # 添加SEO优化内容
        if seo_content and not seo_content.get('error'):
            enhanced['seo_optimization'] = seo_content
            enhanced['h1_heading'] = seo_content.get('h1_heading', '')
            enhanced['h2_headings'] = seo_content.get('h2_headings', [])
            enhanced['suggested_tags'] = seo_content.get('suggested_tags', [])
            enhanced['internal_links'] = seo_content.get('internal_links', [])
        
        # 添加增强标记
        enhanced['quality_enhanced'] = True
        enhanced['enhancement_date'] = datetime.now().isoformat()
        enhanced['enhancement_version'] = '1.0'
        
        return enhanced
    
    def _save_enhanced_article(self, enhanced_article: Dict) -> bool:
        """
        保存增强后的文章
        
        Args:
            enhanced_article (Dict): 增强后的文章
            
        Returns:
            bool: 保存是否成功
        """
        try:
            # 更新数据库中的文章
            success = self.db_client.update_article_quality(enhanced_article)
            
            if success:
                logger.info(f"增强文章已保存: {enhanced_article.get('id')}")
            else:
                logger.error(f"保存增强文章失败: {enhanced_article.get('id')}")
            
            return success
            
        except Exception as e:
            logger.error(f"保存增强文章异常: {str(e)}")
            return False
    
    def generate_content_strategy(self, topic: str, days: int = 7) -> Dict:
        """
        生成内容策略，提高网站整体质量
        
        Args:
            topic (str): 主题
            days (int): 天数
            
        Returns:
            Dict: 内容策略
        """
        try:
            # 创建内容系列
            if self.ai_enabled:
                content_series = self.finance_analyzer.create_content_series(topic, days)
            else:
                # 在没有AI时提供基本的内容策略
                content_series = {
                    'topic': topic,
                    'days': days,
                    'basic_strategy': f'针对"{topic}"主题的{days}天内容策略',
                    'recommendations': [
                        '定期发布相关主题内容',
                        '关注行业热点和趋势',
                        '提供深度分析和见解',
                        '保持内容质量和一致性'
                    ]
                }
            
            if content_series and not content_series.get('error'):
                # 保存内容策略到数据库
                strategy_data = {
                    'topic': topic,
                    'series_data': content_series,
                    'created_date': datetime.now().isoformat(),
                    'status': 'planned'
                }
                
                # 这里可以扩展保存到专门的策略表
                logger.info(f"内容策略生成成功: {topic}")
                return strategy_data
            else:
                logger.error(f"内容策略生成失败: {topic}")
                return None
                
        except Exception as e:
            logger.error(f"生成内容策略异常: {str(e)}")
            return None
    
    def analyze_content_performance(self, days: int = 30) -> Dict:
        """
        分析内容表现，为优化提供数据支持
        
        Args:
            days (int): 分析天数
            
        Returns:
            Dict: 内容表现分析
        """
        try:
            # 获取最近的文章数据
            recent_articles = self.db_client.get_recent_articles(days)
            
            if not recent_articles:
                return {"error": "没有足够的数据进行分析"}
            
            # 统计分析
            total_articles = len(recent_articles)
            enhanced_articles = len([a for a in recent_articles if a.get('quality_enhanced')])
            avg_quality_score = sum([a.get('quality_score', 0) for a in recent_articles]) / total_articles
            
            # 来源分析
            source_stats = {}
            for article in recent_articles:
                source = article.get('source', 'unknown')
                if source not in source_stats:
                    source_stats[source] = {'count': 0, 'avg_quality': 0}
                source_stats[source]['count'] += 1
                source_stats[source]['avg_quality'] += article.get('quality_score', 0)
            
            # 计算平均质量
            for source in source_stats:
                if source_stats[source]['count'] > 0:
                    source_stats[source]['avg_quality'] /= source_stats[source]['count']
            
            performance_data = {
                'analysis_period_days': days,
                'total_articles': total_articles,
                'enhanced_articles': enhanced_articles,
                'enhancement_rate': enhanced_articles / total_articles if total_articles > 0 else 0,
                'average_quality_score': avg_quality_score,
                'source_performance': source_stats,
                'recommendations': self._generate_improvement_recommendations(
                    avg_quality_score, source_stats
                )
            }
            
            logger.info(f"内容表现分析完成，分析了 {total_articles} 篇文章")
            return performance_data
            
        except Exception as e:
            logger.error(f"分析内容表现异常: {str(e)}")
            return {"error": str(e)}
    
    def _generate_improvement_recommendations(self, avg_quality: float, 
                                           source_stats: Dict) -> List[str]:
        """
        生成改进建议
        
        Args:
            avg_quality (float): 平均质量评分
            source_stats (Dict): 来源统计
            
        Returns:
            List[str]: 改进建议列表
        """
        recommendations = []
        
        if avg_quality < 6:
            recommendations.append("整体内容质量偏低，建议加强AI分析深度和原创性")
        
        if avg_quality < 8:
            recommendations.append("可以通过增加更多行业专家观点来提升内容权威性")
        
        # 分析来源表现
        low_quality_sources = [
            source for source, stats in source_stats.items() 
            if stats['avg_quality'] < 6
        ]
        
        if low_quality_sources:
            recommendations.append(f"以下来源内容质量需要改进: {', '.join(low_quality_sources)}")
        
        recommendations.append("建议定期更新SEO关键词策略，提高搜索排名")
        recommendations.append("增加内链建设，提高用户停留时间")
        
        return recommendations

# 测试代码
if __name__ == "__main__":
    enhancer = ContentQualityEnhancer()
    
    # 测试内容表现分析
    performance = enhancer.analyze_content_performance(7)
    print("内容表现分析:")
    print(json.dumps(performance, ensure_ascii=False, indent=2))
