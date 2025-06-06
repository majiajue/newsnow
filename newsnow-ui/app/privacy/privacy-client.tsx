'use client';

import { useSearchParams } from 'next/navigation';

export function PrivacyPolicyContent() {
  // 显式使用useSearchParams以确保它被包装在Suspense中
  const searchParams = useSearchParams();
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-500 mb-8">最后更新日期：2025年6月1日</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">概述</h2>
          <p>
            欢迎访问NewsNow（"我们"、"我们的"或"本网站"）。我们重视您的隐私，并致力于保护您的个人信息。
            本隐私政策旨在向您说明我们如何收集、使用、披露和保护您的个人信息。
          </p>
          <p>
            使用本网站即表示您同意本隐私政策中描述的做法。如果您不同意本政策的任何部分，请不要使用我们的网站。
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">我们收集的信息</h2>
          <h3 className="text-xl font-medium mt-6 mb-3">自动收集的信息</h3>
          <p>
            当您访问我们的网站时，我们可能会自动收集某些信息，包括：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>设备信息（如设备类型、操作系统、浏览器类型）</li>
            <li>IP地址和地理位置信息</li>
            <li>访问时间和日期</li>
            <li>访问的页面和停留时间</li>
            <li>引荐网站或来源</li>
            <li>点击和浏览行为</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Cookie和类似技术</h3>
          <p>
            我们使用Cookie和类似技术来收集和存储信息。Cookie是存储在您设备上的小型文本文件，
            用于记住您的偏好和提供个性化体验。我们使用以下类型的Cookie：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>必要Cookie</strong>：这些Cookie对于网站的基本功能是必需的，无法禁用。</li>
            <li><strong>分析Cookie</strong>：帮助我们了解用户如何使用我们的网站，以便我们改进用户体验。</li>
            <li><strong>广告Cookie</strong>：用于向您展示相关广告，并衡量广告活动的效果。</li>
            <li><strong>功能Cookie</strong>：记住您的偏好设置，提供个性化功能。</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">我们如何使用您的信息</h2>
          <p>
            我们使用收集的信息用于以下目的：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>提供、维护和改进我们的网站和服务</li>
            <li>分析网站流量和用户行为，以优化用户体验</li>
            <li>个性化内容和推荐</li>
            <li>提供相关广告</li>
            <li>防止欺诈和滥用</li>
            <li>与您沟通，回应您的问题和请求</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第三方服务</h2>
          <p>
            我们使用以下第三方服务来帮助我们运营网站和提供服务：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Google Analytics</strong>：用于分析网站流量和用户行为。</li>
            <li><strong>Google AdSense</strong>：用于在网站上展示广告。</li>
          </ul>
          <p>
            这些第三方服务可能会收集和处理您的个人信息。我们建议您查阅这些服务的隐私政策，
            以了解他们如何处理您的信息。
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">您的隐私选择和权利</h2>
          <p>
            您可以通过以下方式控制我们如何收集和使用您的信息：
          </p>
          <h3 className="text-xl font-medium mt-6 mb-3">Cookie设置</h3>
          <p>
            您可以通过我们网站上的Cookie同意横幅来管理您的Cookie偏好。您可以选择：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>接受所有Cookie</strong>：允许所有类型的Cookie。</li>
            <li><strong>仅必要Cookie</strong>：仅允许网站基本功能所需的Cookie。</li>
          </ul>
          <p>
            您也可以通过浏览器设置来管理或删除Cookie。请注意，禁用某些Cookie可能会影响网站的功能。
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">不跟踪请求</h3>
          <p>
            某些浏览器提供"请勿跟踪"（DNT）功能。我们尊重DNT信号，当检测到DNT信号时，
            我们不会跟踪、植入Cookie或使用广告。
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">您的数据权利</h3>
          <p>
            根据适用的隐私法律，您可能拥有以下权利：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>访问我们收集的关于您的个人信息</li>
            <li>更正不准确或不完整的个人信息</li>
            <li>删除您的个人信息</li>
            <li>限制或反对我们处理您的个人信息</li>
            <li>数据可携带性（以结构化、常用和机器可读的格式接收您的数据）</li>
            <li>撤回您的同意</li>
          </ul>
          <p>
            如果您想行使这些权利，请通过以下联系方式与我们联系。
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">数据安全</h2>
          <p>
            我们采取合理的技术和组织措施来保护您的个人信息不被未经授权的访问、使用或披露。
            然而，没有任何互联网传输或电子存储方法是100%安全的。因此，虽然我们努力保护您的个人信息，
            但我们不能保证其绝对安全。
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">儿童隐私</h2>
          <p>
            我们的网站不面向13岁以下的儿童。我们不会故意收集13岁以下儿童的个人信息。
            如果您发现我们可能收集了13岁以下儿童的个人信息，请立即联系我们，我们将采取措施删除这些信息。
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">隐私政策的变更</h2>
          <p>
            我们可能会不时更新本隐私政策。我们会在网站上发布更新后的政策，并更新"最后更新日期"。
            继续使用我们的网站即表示您接受这些更改。我们建议您定期查看本政策，以了解我们如何保护您的信息。
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">联系我们</h2>
          <p>
            如果您对本隐私政策有任何疑问或顾虑，或者想行使您的数据权利，请通过以下方式联系我们：
          </p>
          <p className="mt-4">
            <strong>电子邮件：</strong> privacy@shishixinwen.news
          </p>
          <p>
            <strong>地址：</strong> 中国上海市浦东新区张江高科技园区
          </p>
        </section>
      </div>
    </div>
  );
}
