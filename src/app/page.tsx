'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategorizedLink, Category, Tag } from '@/types';
import { storage } from '@/lib/storage';

export default function Home() {
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<CategorizedLink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [editingLink, setEditingLink] = useState<CategorizedLink | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load data from storage (database or localStorage)
  useEffect(() => {
    setIsClient(true);
    
    const loadData = async () => {
      try {
        const [links, categories, tags] = await Promise.all([
          storage.getLinks(),
          storage.getCategories(),
          storage.getTags()
        ]);
        setResults(links);
        setCategories(categories);
        setTags(tags);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();

    // Listen for storage updates from other components
    const handleLinksUpdate = (event: CustomEvent) => {
      setResults(event.detail);
    };
    
    const handleCategoriesUpdate = (event: CustomEvent) => {
      setCategories(event.detail);
    };
    
    const handleTagsUpdate = (event: CustomEvent) => {
      setTags(event.detail);
    };

    window.addEventListener('storage-links-updated', handleLinksUpdate as EventListener);
    window.addEventListener('storage-categories-updated', handleCategoriesUpdate as EventListener);
    window.addEventListener('storage-tags-updated', handleTagsUpdate as EventListener);

    return () => {
      window.removeEventListener('storage-links-updated', handleLinksUpdate as EventListener);
      window.removeEventListener('storage-categories-updated', handleCategoriesUpdate as EventListener);
      window.removeEventListener('storage-tags-updated', handleTagsUpdate as EventListener);
    };
  }, []);

  // Edit link function
  const handleEditLink = (link: CategorizedLink) => {
    setEditingLink(link);
    setShowEditModal(true);
  };

  // Delete link function
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('이 링크를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await storage.deleteLink(linkId);
      // Refresh the results
      const updatedLinks = await storage.getLinks();
      setResults(updatedLinks);
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('링크 삭제에 실패했습니다.');
    }
  };

  // Save edited link
  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLink) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const memo = formData.get('memo') as string;
    const category = formData.get('category') as string;
    const tagsInput = formData.get('tags') as string;
    
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
      await storage.updateLink(editingLink.id, {
        title: title.trim(),
        memo: memo.trim() || undefined,
        category: category,
        tags: tags
      });

      // Auto-create category and tags if they don't exist
      await storage.autoCreateCategoryAndTags(category, tags);

      // Refresh data
      const [updatedLinks, updatedCategories, updatedTags] = await Promise.all([
        storage.getLinks(),
        storage.getCategories(),
        storage.getTags()
      ]);
      
      setResults(updatedLinks);
      setCategories(updatedCategories);
      setTags(updatedTags);
      
      setShowEditModal(false);
      setEditingLink(null);
    } catch (error) {
      console.error('Error updating link:', error);
      alert('링크 업데이트에 실패했습니다.');
    }
  };

  // Note: Storage is now handled by the storage utility

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return urlString.startsWith('http://') || urlString.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // URL 유효성 검사
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setIsLoading(true);

    try {
      // 실제 API 호출
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Categorization failed');
      }

      // Create new link object with memo and auto-generated tags
      const now = new Date();
      const newLink: CategorizedLink = {
        id: crypto.randomUUID(),
        url: data.url,
        title: data.title,
        description: data.description,
        category: data.category,
        tags: Array.isArray(data.tags) ? data.tags : [],
        memo: memo.trim() || undefined,
        createdAt: now,
        updatedAt: now
      };

      // Auto-create category and tags using storage utility
      await storage.autoCreateCategoryAndTags(data.category, data.tags || []);

      // Add the new link
      await storage.addLink(newLink);
      setUrl(''); // 입력 필드 초기화
      setMemo(''); // 메모 필드 초기화
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Categorization service is temporarily unavailable. Please try again later.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LinkStash
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Automatically categorize your URLs with AI. Paste any link and get instant categorization.
          </p>
          <div className="flex justify-center gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">카테고리</h3>
                  <Link
                    href="/categories"
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                  >
                    관리 ({categories.length})
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${encodeURIComponent(category.name)}`}
                      className="flex items-center px-3 py-1 rounded-full text-sm hover:scale-105 transition-transform"
                      style={{ 
                        backgroundColor: category.color + '20',
                        color: category.color,
                        border: `1px solid ${category.color}40`
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      {category.name}
                    </Link>
                  ))}
                  {categories.length > 6 && (
                    <Link
                      href="/categories"
                      className="px-3 py-1 text-gray-500 text-sm hover:text-gray-700"
                    >
                      +{categories.length - 6}개 더
                    </Link>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">태그</h3>
                  <Link
                    href="/tags"
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                  >
                    관리 ({tags.length})
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 8).map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${encodeURIComponent(tag.name)}`}
                      className="flex items-center px-2 py-1 rounded-full text-sm hover:scale-105 transition-transform"
                      style={{ 
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        border: `1px solid ${tag.color}40`
                      }}
                    >
                      #{tag.name}
                    </Link>
                  ))}
                  {tags.length > 8 && (
                    <Link
                      href="/tags"
                      className="px-2 py-1 text-gray-500 text-sm hover:text-gray-700"
                    >
                      +{tags.length - 8}개 더
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug info - 개발 중에만 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              현재 상태: {categories.length}개 카테고리, {tags.length}개 태그, {results.length}개 링크
            </div>
          )}
        </header>

        {/* URL Input Form */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-8 border border-blue-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">새 링크 추가</h2>
            <p className="text-gray-600">URL을 입력하면 AI가 자동으로 분류해드려요</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  🔗 URL 주소
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    disabled={isLoading}
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-2">
                  📝 개인 메모 (선택사항)
                </label>
                <textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="이 링크에 대한 개인적인 메모를 남겨보세요..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm resize-none"
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    AI가 분석중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    🤖 AI로 분류하기
                  </span>
                )}
              </button>
              
              {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Categorized Links
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title & Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Memo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/categories/${encodeURIComponent(result.category)}`}
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
        >
                          {result.category}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium mb-1">
                          {result.title}
                        </div>
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.tags.map((tag, tagIndex) => (
                              <Link
                                key={tagIndex}
                                href={`/tags/${encodeURIComponent(tag)}`}
                                className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer"
                              >
                                #{tag}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {result.memo ? (
                          <div className="text-sm text-gray-600 max-w-xs">
                            {result.memo}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm truncate block max-w-xs"
                        >
                          {result.url}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditLink(result)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            ✏️ 편집
                          </button>
                          <button
                            onClick={() => handleDeleteLink(result.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            🗑️ 삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingLink && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">링크 편집</h3>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    defaultValue={editingLink.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    id="edit-category"
                    name="category"
                    defaultValue={editingLink.category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Technology">Technology</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Other">Other</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-2">
                    태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    id="edit-tags"
                    name="tags"
                    defaultValue={editingLink.tags.join(', ')}
                    placeholder="react, javascript, tutorial"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-memo" className="block text-sm font-medium text-gray-700 mb-2">
                    메모
                  </label>
                  <textarea
                    id="edit-memo"
                    name="memo"
                    defaultValue={editingLink.memo || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="개인적인 메모를 남겨보세요..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingLink(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Tired of organizing bookmarks?{' '}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
              This page was built with LinkStash. Find out more.
            </a>
          </p>
      </footer>
      </div>
    </div>
  );
}
