#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试改进版AI内容分析服务的JSON输出功能
"""

import os
import json
import time
from datetime import datetime
from utils.improved_ai_service import FinanceAnalyzer

def print_separator(title):
    """打印分隔线"""
    print("\n" + "=" * 50)
    print(f" {title} ")
    print("=" * 50)

def print_json(data):
    """美化打印JSON数据"""
    if isinstance(data, dict):
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print(data)

def test_market_news_analysis():
    """测试市场新闻分析JSON输出"""
    print_separator("测试市场新闻分析JSON输出")
    
    # 测试文本
    test_title = "美联储宣布维持利率不变，暗示年内仍有可能降息"
    test_content = """
    美联储在最新的货币政策会议上决定维持基准利率在5.25%-5.50%区间不变，
    符合市场预期。美联储主席鲍威尔在会后新闻发布会上表示，尽管通胀有所
    放缓，但仍高于2%的目标，需要谨慎对待降息。不过，他也暗示如果经济数据
    继续向好，年内仍有可能实施降息。此消息公布后，美股小幅上涨，10年期
    国债收益率略有下降。
    """
    
    # 分析内容
    analyzer = FinanceAnalyzer(api_key=os.environ.get("DEEPSEEK_API_KEY"))
    result = analyzer.analyze_market_news(test_content, test_title)
    
    # 打印结果
    print("分析结果：")
    print_json(result)
    
    # 验证JSON结构
    if isinstance(result, dict):
        print("\n✅ 成功返回JSON结构")
        
        # 检查关键字段
        expected_fields = ["market_summary", "impact_analysis", "affected_industries", 
                          "investment_advice", "sentiment"]
        missing_fields = [field for field in expected_fields if field not in result]
        
        if missing_fields:
            print(f"⚠️ 缺少以下字段: {', '.join(missing_fields)}")
        else:
            print("✅ 所有预期字段都存在")
    else:
        print(f"❌ 没有返回JSON结构: {type(result)}")
    
    return result

def test_economic_data_analysis():
    """测试经济数据分析JSON输出"""
    print_separator("测试经济数据分析JSON输出")
    
    # 测试文本
    test_data = """
    最新数据显示，中国4月份CPI同比上涨0.3%，较3月份上涨0.2个百分点；
    PPI同比下降2.5%，降幅比上月收窄0.1个百分点。与此同时，4月社会融资规模
    增量为1.9万亿元，比上年同期少7825亿元；M2货币供应量同比增长8.3%，
    增速比上月末低0.6个百分点。
    """
    
    # 分析内容
    analyzer = FinanceAnalyzer(api_key=os.environ.get("DEEPSEEK_API_KEY"))
    result = analyzer.analyze_economic_data(test_data, "宏观经济指标")
    
    # 打印结果
    print("分析结果：")
    print_json(result)
    
    # 验证JSON结构
    if isinstance(result, dict):
        print("\n✅ 成功返回JSON结构")
        
        # 检查关键字段
        expected_fields = ["data_summary", "trend_analysis", "economic_impact", 
                          "policy_implications"]
        missing_fields = [field for field in expected_fields if field not in result]
        
        if missing_fields:
            print(f"⚠️ 缺少以下字段: {', '.join(missing_fields)}")
        else:
            print("✅ 所有预期字段都存在")
    else:
        print(f"❌ 没有返回JSON结构: {type(result)}")
    
    return result

def test_company_report_analysis():
    """测试公司财报分析JSON输出"""
    print_separator("测试公司财报分析JSON输出")
    
    # 测试文本
    test_report = """
    腾讯控股(00700)发布2023年第四季度及全年业绩。财报显示，腾讯2023年全年
    营收为6045.64亿元，同比增长10%；净利润为1151.12亿元，同比增长39%。
    其中，游戏业务收入为1906.68亿元，同比增长5%；网络广告收入为962.19亿元，
    同比增长20%；金融科技及企业服务收入为2013.58亿元，同比增长14%。
    公司宣布每股派发年度股息2.4港元。
    """
    
    # 分析内容
    analyzer = FinanceAnalyzer(api_key=os.environ.get("DEEPSEEK_API_KEY"))
    result = analyzer.analyze_company_report(test_report, "腾讯控股")
    
    # 打印结果
    print("分析结果：")
    print_json(result)
    
    # 验证JSON结构
    if isinstance(result, dict):
        print("\n✅ 成功返回JSON结构")
        
        # 检查关键字段
        expected_fields = ["performance_summary", "financial_analysis", "growth_assessment", 
                          "investment_advice"]
        missing_fields = [field for field in expected_fields if field not in result]
        
        if missing_fields:
            print(f"⚠️ 缺少以下字段: {', '.join(missing_fields)}")
        else:
            print("✅ 所有预期字段都存在")
    else:
        print(f"❌ 没有返回JSON结构: {type(result)}")
    
    return result

def test_market_summary_generation():
    """测试市场综述生成JSON输出"""
    print_separator("测试市场综述生成JSON输出")
    
    # 测试数据
    test_news = [
        {"title": "美股三大指数集体收涨，道指涨超300点", "pubDate": "2023-05-18"},
        {"title": "欧佩克+宣布延长减产计划，国际油价上涨", "pubDate": "2023-05-18"},
        {"title": "美国4月零售销售环比持平，低于预期的0.2%增长", "pubDate": "2023-05-18"},
        {"title": "科技股领涨大盘，英伟达涨幅超7%", "pubDate": "2023-05-18"},
        {"title": "中国4月工业增加值同比增长5.6%，高于预期", "pubDate": "2023-05-18"}
    ]
    
    # 生成综述
    analyzer = FinanceAnalyzer(api_key=os.environ.get("DEEPSEEK_API_KEY"))
    result = analyzer.generate_market_summary(test_news, "全球金融市场")
    
    # 打印结果
    print("分析结果：")
    print_json(result)
    
    # 验证JSON结构
    if isinstance(result, dict):
        print("\n✅ 成功返回JSON结构")
        
        # 检查关键字段
        expected_fields = ["market_type", "market_overview", "industry_highlights", 
                          "key_events", "outlook"]
        missing_fields = [field for field in expected_fields if field not in result]
        
        if missing_fields:
            print(f"⚠️ 缺少以下字段: {', '.join(missing_fields)}")
        else:
            print("✅ 所有预期字段都存在")
    else:
        print(f"❌ 没有返回JSON结构: {type(result)}")
    
    return result

def run_all_tests():
    """运行所有测试"""
    # 检查API密钥
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("警告: 未设置DEEPSEEK_API_KEY环境变量，测试将会失败")
        return
    
    start_time = time.time()
    print(f"开始测试JSON输出功能... {datetime.now()}")
    
    try:
        # 运行测试
        market_news_result = test_market_news_analysis()
        economic_data_result = test_economic_data_analysis()
        company_report_result = test_company_report_analysis()
        market_summary_result = test_market_summary_generation()
        
        # 总结
        print_separator("测试总结")
        tests = [
            ("市场新闻分析", isinstance(market_news_result, dict)),
            ("经济数据分析", isinstance(economic_data_result, dict)),
            ("公司财报分析", isinstance(company_report_result, dict)),
            ("市场综述生成", isinstance(market_summary_result, dict))
        ]
        
        for name, success in tests:
            status = "✅ 通过" if success else "❌ 失败"
            print(f"{name}: {status}")
        
        success_count = sum(1 for _, success in tests if success)
        print(f"\n总计: {success_count}/{len(tests)} 测试通过")
        print(f"总耗时: {time.time() - start_time:.2f}秒")
    
    except Exception as e:
        import traceback
        print(f"测试过程中发生错误: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()
