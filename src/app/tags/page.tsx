'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, TagFormData } from '@/types';
import { storage } from '@/lib/storage';

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    color: DEFAULT_COLORS[0],
    description: ''
  });

  // Load tags and links from storage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tags, links] = await Promise.all([
          storage.getTags(),
          storage.getLinks()
        ]);
        setTags(tags);
        setLinks(links);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();

    // Listen for storage updates from other components
    const handleTagsUpdate = (event: CustomEvent) => {
      setTags(event.detail);
    };
    
    const handleLinksUpdate = (event: CustomEvent) => {
      setLinks(event.detail);
    };

    window.addEventListener('storage-tags-updated', handleTagsUpdate as EventListener);
    window.addEventListener('storage-links-updated', handleLinksUpdate as EventListener);

    return () => {
      window.removeEventListener('storage-tags-updated', handleTagsUpdate as EventListener);
      window.removeEventListener('storage-links-updated', handleLinksUpdate as EventListener);
    };
  }, []);

  // Note: Storage is now handled by the storage utility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      const now = new Date();

      if (editingTag) {
        // Update existing tag
        await storage.updateTag(editingTag.id, formData);
      } else {
        // Create new tag
        const newTag: Tag = {
          id: crypto.randomUUID(),
          ...formData,
          createdAt: now,
          updatedAt: now
        };
        await storage.addTag(newTag);
      }

      // Reset form
      setFormData({ name: '', color: DEFAULT_COLORS[0], description: '' });
      setEditingTag(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving tag:', error);
      alert('Failed to save tag. Please try again.');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 태그를 삭제하시겠습니까?')) {
      try {
        await storage.deleteTag(id);
      } catch (error) {
        console.error('Error deleting tag:', error);
        alert('Failed to delete tag. Please try again.');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
    setFormData({ name: '', color: DEFAULT_COLORS[0], description: '' });
  };

  // Get link count for a tag
  const getLinkCount = (tagName: string) => {
    return links.filter(link => link.tags && link.tags.includes(tagName)).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">태그 관리</h1>
            <p className="text-gray-600 mt-2">링크에 붙일 태그를 관리하세요</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← 홈으로
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              새 태그 추가
            </button>
          </div>
        </div>

        {/* Tags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tags.map(tag => {
            const linkCount = getLinkCount(tag.name);
            return (
              <div
                key={tag.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    ></div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        #{tag.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {linkCount}개 링크
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      수정
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                
                {tag.description && (
                  <p className="text-gray-600 text-xs mb-3">{tag.description}</p>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    {tag.createdAt.toLocaleDateString()}
                  </div>
                  {linkCount > 0 && (
                    <Link
                      href={`/tags/${encodeURIComponent(tag.name)}`}
                      className="text-green-600 hover:text-green-800 text-xs font-medium"
                    >
                      보기 →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {tags.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">등록된 태그가 없습니다</div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              첫 번째 태그 만들기
            </button>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingTag ? '태그 수정' : '새 태그 추가'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    태그 이름
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="예: AI, JavaScript, React"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    색상
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {DEFAULT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 (선택사항)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="태그에 대한 간단한 설명"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {editingTag ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 