import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import AllSourcesNewsList from '../../components/news/AllSourcesNewsList';

export const Route = createFileRoute('/news/all-sources')({
  component: AllSourcesPage,
});

function AllSourcesPage() {
  return (
    <div className="container mx-auto py-4">
      <AllSourcesNewsList />
    </div>
  );
}
