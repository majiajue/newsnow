import type { NewsItem } from "@shared/types";

// 模拟 HackerNews 数据
const mockHackerNewsData: NewsItem[] = [
  {
    id: "hn1",
    title: "OpenAI 发布 GPT-5",
    url: "https://news.ycombinator.com/item?id=12345",
    externalUrl: "https://openai.com/blog/gpt-5",
    extra: { info: "500 points" },
    aiSummary: "OpenAI 发布了最新的大型语言模型 GPT-5，性能大幅提升，支持更多模态输入。"
  },
  {
    id: "hn2",
    title: "苹果发布 M4 芯片",
    url: "https://news.ycombinator.com/item?id=23456",
    externalUrl: "https://www.apple.com/newsroom/2024/04/apple-announces-m4-chip/",
    extra: { info: "450 points" },
    aiSummary: "苹果发布新一代 M4 芯片，性能提升 40%，能效提高 30%，支持更强大的 AI 功能。"
  },
  {
    id: "hn3",
    title: "谷歌推出新一代量子计算机",
    url: "https://news.ycombinator.com/item?id=34567",
    externalUrl: "https://blog.google/technology/ai/google-quantum-computer-2024/",
    extra: { info: "400 points" },
    aiSummary: "谷歌宣布其新一代量子计算机达到量子优势里程碑，解决了传统超级计算机需要数年才能解决的问题。"
  },
  {
    id: "hn4",
    title: "GitHub Copilot 新增代码审查功能",
    url: "https://news.ycombinator.com/item?id=45678",
    externalUrl: "https://github.blog/2024-04-06-github-copilot-code-review/",
    extra: { info: "350 points" },
    aiSummary: "GitHub Copilot 新增代码审查功能，可自动检测潜在问题并提供改进建议，提高代码质量。"
  },
  {
    id: "hn5",
    title: "特斯拉发布全自动驾驶 Beta v12",
    url: "https://news.ycombinator.com/item?id=56789",
    externalUrl: "https://www.tesla.com/blog/full-self-driving-beta-v12",
    extra: { info: "300 points" },
    aiSummary: "特斯拉发布全自动驾驶 Beta v12，采用端到端神经网络，减少人工干预，提高安全性。"
  },
  {
    id: "hn6",
    title: "微软推出 Windows 12",
    url: "https://news.ycombinator.com/item?id=67890",
    externalUrl: "https://blogs.windows.com/windowsexperience/2024/04/windows-12/",
    extra: { info: "280 points" },
    aiSummary: "微软发布 Windows 12，全新设计语言，内置 AI 助手，优化性能和安全性。"
  },
  {
    id: "hn7",
    title: "Meta 发布新一代 VR 头显",
    url: "https://news.ycombinator.com/item?id=78901",
    externalUrl: "https://about.meta.com/news/quest-pro-2/",
    extra: { info: "250 points" },
    aiSummary: "Meta 发布 Quest Pro 2 VR 头显，分辨率提升，减轻重量，电池续航更长，支持混合现实。"
  },
  {
    id: "hn8",
    title: "亚马逊推出家用机器人 Astro 2",
    url: "https://news.ycombinator.com/item?id=89012",
    externalUrl: "https://www.aboutamazon.com/news/devices/amazon-astro-2",
    extra: { info: "230 points" },
    aiSummary: "亚马逊推出第二代家用机器人 Astro，增强导航能力，支持更多智能家居集成，提供家庭安全监控。"
  },
  {
    id: "hn9",
    title: "SpaceX 星舰完成首次轨道飞行",
    url: "https://news.ycombinator.com/item?id=90123",
    externalUrl: "https://www.spacex.com/updates/starship-orbit-flight/",
    extra: { info: "220 points" },
    aiSummary: "SpaceX 星舰成功完成首次轨道飞行，发射和着陆均成功，为火星任务奠定基础。"
  },
  {
    id: "hn10",
    title: "英特尔发布 Meteor Lake 处理器",
    url: "https://news.ycombinator.com/item?id=01234",
    externalUrl: "https://www.intel.com/content/www/us/en/newsroom/news/intel-meteor-lake-processors.html",
    extra: { info: "200 points" },
    aiSummary: "英特尔发布 Meteor Lake 处理器，采用全新架构，集成 AI 加速器，性能和能效大幅提升。"
  }
];

// 导出模拟数据源
export default defineSource(async () => {
  console.log("返回 HackerNews 模拟数据，共 10 条");
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockHackerNewsData;
});
