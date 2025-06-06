import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PrivacyPolicyContent } from './privacy-client';

export const metadata: Metadata = {
  title: 'NewsNow - 隐私政策',
  description: '了解NewsNow如何收集、使用和保护您的个人信息',
};

export default function PrivacyPolicy() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3">加载中...</span>
        </div>
      </div>
    }>
      <PrivacyPolicyContent />
    </Suspense>
  );
}
