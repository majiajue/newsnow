'use client';

import Script from 'next/script';

export default function SchemaOrg() {
  // 组织信息
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NewsNow",
    "url": "https://shishixinwen.news",
    "logo": "https://shishixinwen.news/logo.png",
    "description": "专业的实时新闻聚合阅读器，提供AI智能分析和优雅的阅读体验",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "contact@shishixinwen.news",
      "availableLanguage": ["Chinese", "English"]
    },
    "sameAs": [
      "https://twitter.com/NewsNowApp",
      "https://github.com/NewsNow"
    ]
  };

  // 网站信息
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "NewsNow",
    "alternateName": "实时新闻",
    "url": "https://shishixinwen.news",
    "description": "实时新闻聚合阅读器，汇集全球热点新闻，提供AI智能分析和优雅的阅读体验",
    "inLanguage": "zh-CN",
    "isAccessibleForFree": true,
    "publisher": {
      "@type": "Organization",
      "name": "NewsNow"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://shishixinwen.news/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // 新闻媒体组织
  const newsMediaOrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "NewsNow",
    "url": "https://shishixinwen.news",
    "logo": "https://shishixinwen.news/logo.png",
    "description": "专业的新闻聚合平台，提供实时新闻和AI分析",
    "foundingDate": "2024",
    "diversityPolicy": "https://shishixinwen.news/diversity-policy",
    "ethicsPolicy": "https://shishixinwen.news/ethics-policy",
    "masthead": "https://shishixinwen.news/about",
    "missionCoveragePrioritiesPolicy": "https://shishixinwen.news/mission",
    "verificationFactCheckingPolicy": "https://shishixinwen.news/fact-checking"
  };

  // 面包屑导航
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "首页",
        "item": "https://shishixinwen.news"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "财经新闻",
        "item": "https://shishixinwen.news/news"
      }
    ]
  };

  // 合并所有结构化数据
  const allSchemas = [
    organizationSchema,
    websiteSchema,
    newsMediaOrganizationSchema,
    breadcrumbSchema
  ];

  return (
    <>
      {allSchemas.map((schema, index) => (
        <Script
          key={index}
          id={`schema-org-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
