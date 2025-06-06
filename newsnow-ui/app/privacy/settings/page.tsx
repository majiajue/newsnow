import { Suspense } from 'react';
import { PrivacySettingsContent } from './settings-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NewsNow - 隐私设置',
  description: '管理您的隐私偏好和Cookie设置',
};

export default function PrivacySettings() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">隐私设置</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3">加载中...</span>
        </div>
      </div>
    }>
      <PrivacySettingsContent />
    </Suspense>
  );
}
