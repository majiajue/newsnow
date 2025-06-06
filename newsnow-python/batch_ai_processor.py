#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量AI分析处理器
处理数据库中未分析的文章
"""

import os
import sys
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.enhanced_ai_service import EnhancedFinanceAnalyzer
from db.sqlite_client import SQLiteClient

class BatchAIProcessor:
    """批量AI分析处理器"""
    
    def __init__(self):
        self.analyzer = EnhancedFinanceAnalyzer()
        self.db_client = SQLiteClient()
    
    def process_unanalyzed_articles(self, batch_size=5, delay_between_batches=120):
        """
        批量处理未分析的文章
        
        Args:
            batch_size (int): 每批处理的文章数量
            delay_between_batches (int): 批次间延迟时间（秒）
        """
        print(f"🚀 开始批量AI分析处理...")
        print(f"📊 批次大小: {batch_size}, 批次间延迟: {delay_between_batches}秒")
        
        try:
            # 获取未分析的文章
            unanalyzed_articles = self.db_client.get_unprocessed_articles(limit=100)
            
            if not unanalyzed_articles:
                print("✅ 没有需要分析的文章")
                return
            
            print(f"📝 找到 {len(unanalyzed_articles)} 篇未分析的文章")
            
            # 分批处理
            total_processed = 0
            total_success = 0
            
            for i in range(0, len(unanalyzed_articles), batch_size):
                batch = unanalyzed_articles[i:i + batch_size]
                batch_num = (i // batch_size) + 1
                
                print(f"\n📦 处理第 {batch_num} 批 ({len(batch)} 篇文章)...")
                
                batch_success = 0
                for article in batch:
                    try:
                        article_id = article.get('id')
                        title = article.get('title', '')
                        content = article.get('content', '')
                        
                        print(f"🔍 分析文章: {title[:50]}...")
                        
                        # 执行AI分析
                        analysis_result = self.analyzer.generate_comprehensive_analysis(
                            title=title,
                            content=content,
                            search_results=[]
                        )
                        
                        if analysis_result:
                            # 更新数据库
                            success = self.db_client.update_article_analysis(article_id, analysis_result)
                            if success:
                                print(f"✅ 分析完成: {title[:30]}...")
                                batch_success += 1
                                total_success += 1
                            else:
                                print(f"❌ 保存失败: {title[:30]}...")
                        else:
                            print(f"⚠️ 分析失败: {title[:30]}...")
                        
                        total_processed += 1
                        
                        # 文章间短暂延迟
                        time.sleep(5)
                        
                    except Exception as e:
                        print(f"❌ 处理文章异常: {e}")
                        continue
                
                print(f"📊 第 {batch_num} 批完成: {batch_success}/{len(batch)} 成功")
                
                # 批次间延迟（除了最后一批）
                if i + batch_size < len(unanalyzed_articles):
                    print(f"⏰ 等待 {delay_between_batches} 秒后处理下一批...")
                    time.sleep(delay_between_batches)
            
            print(f"\n🎉 批量处理完成!")
            print(f"📊 总计处理: {total_processed} 篇")
            print(f"✅ 成功分析: {total_success} 篇")
            print(f"📈 成功率: {(total_success/total_processed*100):.1f}%")
            
        except Exception as e:
            print(f"❌ 批量处理异常: {e}")

def main():
    """主函数"""
    processor = BatchAIProcessor()
    processor.process_unanalyzed_articles(
        batch_size=3,  # 每批3篇文章
        delay_between_batches=90  # 批次间等待90秒
    )

if __name__ == "__main__":
    # 手动加载环境变量
    env_file = ".env"
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    
    main()
