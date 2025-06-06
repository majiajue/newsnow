import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PrivacyTestContent } from './privacy-test-client';

export const metadata: Metadata = {
  title: 'NewsNow - 隐私设置测试',
  description: '测试NewsNow隐私设置和Cookie同意功能',
};

export default function PrivacyTest() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">隐私设置测试</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3">加载中...</span>
        </div>
      </div>
    }>
      <PrivacyTestContent />
    </Suspense>
  );
}
