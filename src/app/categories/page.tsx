'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category, CategoryFormData } from '@/types';
import { storage } from '@/lib/storage';

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    color: DEFAULT_COLORS[0],
    description: ''
  });

  // Load categories and links from storage on component mount
  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const [categories, links] = await Promise.all([
          storage.getCategories(),
          storage.getLinks()
        ]);
        setCategories(categories);
        setLinks(links);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();

    // Listen for storage updates from other components
    const handleCategoriesUpdate = (event: CustomEvent) => {
      setCategories(event.detail);
    };
    
    const handleLinksUpdate = (event: CustomEvent) => {
      setLinks(event.detail);
    };

    window.addEventListener('storage-categories-updated', handleCategoriesUpdate as EventListener);
    window.addEventListener('storage-links-updated', handleLinksUpdate as EventListener);

    return () => {
      window.removeEventListener('storage-categories-updated', handleCategoriesUpdate as EventListener);
      window.removeEventListener('storage-links-updated', handleLinksUpdate as EventListener);
    };
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Note: Storage is now handled by the storage utility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      const now = new Date();

      if (editingCategory) {
        // Update existing category
        await storage.updateCategory(editingCategory.id, formData);
      } else {
        // Create new category
        const newCategory: Category = {
          id: crypto.randomUUID(),
          ...formData,
          userId: 'temp-user', // This will be replaced by storage layer
          createdAt: now,
          updatedAt: now
        };
        await storage.addCategory(newCategory);
      }

      // Reset form
      setFormData({ name: '', color: DEFAULT_COLORS[0], description: '' });
      setEditingCategory(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category. Please try again.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      description: category.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
      try {
        await storage.deleteCategory(id);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', color: DEFAULT_COLORS[0], description: '' });
  };

  // Get link count for a category
  const getLinkCount = (categoryName: string) => {
    return links.filter(link => link.category === categoryName).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">카테고리 관리</h1>
            <p className="text-gray-600 mt-2">링크를 분류할 카테고리를 관리하세요</p>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              새 카테고리 추가
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => {
            const linkCount = getLinkCount(category.name);
            return (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {linkCount}개의 링크
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    생성일: {category.createdAt.toLocaleDateString()}
                  </div>
                  {linkCount > 0 && (
                    <Link
                      href={`/categories/${encodeURIComponent(category.name)}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      링크 보기 →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">등록된 카테고리가 없습니다</div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              첫 번째 카테고리 만들기
            </button>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 이름
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: Technology, Design"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="카테고리에 대한 간단한 설명"
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingCategory ? '수정' : '추가'}
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