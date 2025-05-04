/**
 * 文章详情页面 - 支持所有来源（财联社、FastBull、WallStreet、Jin10、Gelonghui）
 */
import { createFileRoute } from '@tanstack/react-router';
import ArticleDetail from '../../components/news/ArticleDetail';

export const Route = createFileRoute('/news/article/$id')({
  component: ArticleDetail,
});
