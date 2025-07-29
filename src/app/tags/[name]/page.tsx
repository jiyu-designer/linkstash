'use client';

import { storage } from '@/lib/storage';
import { CategorizedLink, Category, Tag } from '@/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TagDetailPage() {
  const params = useParams();
  const tagName = params.name as string;
  
  const [links, setLinks] = useState<CategorizedLink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load data function
  const loadData = async () => {
    try {
      const [tagLinks, categories, tags] = await Promise.all([
        storage.getLinksByTag(tagName),
        storage.getCategories(),
        storage.getTags()
      ]);
      setLinks(tagLinks);
      setCategories(categories);
      setTags(tags);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    // Load data from storage
    loadData();
  }, [tagName]);

  // Apply search filter (links are already filtered by tag)
  const filteredLinks = links.filter(link =>
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (link.memo && link.memo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Apply sorting
  const sortedLinks = [...filteredLinks].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      comparison = a.createdAt.getTime() - b.createdAt.getTime();
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Get tag details
  const tag = tags.find(t => t.name === tagName);

  // Get category details for color mapping
  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || '#3B82F6';
  };

  // Get tag details for color mapping
  const getTagColor = (tagName: string) => {
    const tag = tags.find(t => t.name === tagName);
    return tag?.color || '#10B981';
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('정말로 이 링크를 삭제하시겠습니까?')) {
      try {
        await storage.deleteLink(linkId);
        // Refresh the data
        await loadData();
      } catch (error) {
        console.error('Error deleting link:', error);
        alert('링크 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/tags"
              className="text-gray-600 hover:text-gray-800"
            >
              ← 태그 관리
            </Link>
            <span className="text-gray-400">|</span>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-800"
            >
              홈으로
            </Link>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {tag && (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: tag.color }}
                >
                  #
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">태그: #{tagName}</h1>
                <p className="text-gray-600">
                  {links.length}개의 링크에 사용되었습니다
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link
                href="/tags"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                태그 관리
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                홈으로
              </Link>
            </div>
          </div>

          {tag?.description && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">설명</h3>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{tag.description}</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{links.length}</div>
              <div className="text-sm text-blue-800">관련 링크 수</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {Array.from(new Set(links.map(link => link.category))).length}
              </div>
              <div className="text-sm text-green-800">관련 카테고리 수</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {links.filter(link => link.memo).length}
              </div>
              <div className="text-sm text-purple-800">메모가 있는 링크</div>
            </div>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                placeholder="링크, 제목, 메모, 카테고리로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="date">날짜순</option>
                <option value="title">제목순</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Links Table */}
        {sortedLinks.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                링크 목록 ({sortedLinks.length}개)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목 & 태그
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      메모
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/categories/${encodeURIComponent(link.category)}`}
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {link.category}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium mb-1">
                          {link.title}
                        </div>
                        {link.tags && link.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {link.tags.map((t, tagIndex) => (
                              <Link
                                key={tagIndex}
                                href={`/tags/${encodeURIComponent(t)}`}
                                className={`text-sm transition-colors ${
                                  t === tagName 
                                    ? 'text-green-700 font-semibold' 
                                    : 'text-green-600 hover:text-green-800'
                                }`}
                              >
                                #{t}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {link.memo ? (
                          <div className="text-sm text-gray-600 max-w-xs">
                            {link.memo}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {link.createdAt.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm truncate block max-w-xs"
                        >
                          {link.url}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-lg mb-4">
              {searchTerm ? '검색 결과가 없습니다' : '이 태그가 사용된 링크가 없습니다'}
            </div>
            <Link
              href="/"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              새 링크 추가하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 