'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category, Tag } from '@/types';
import { storage } from '@/lib/storage';
import { Button, ButtonDanger } from '@/components/sds';

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, tagsData] = await Promise.all([
        storage.getCategories(),
        storage.getTags()
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await storage.deleteCategory(categoryId);
        await loadData();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      try {
        await storage.deleteTag(tagId);
        await loadData();
      } catch (error) {
        console.error('Error deleting tag:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage</h1>
              <p className="text-gray-600 mt-2">Organize your categories and tags</p>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Categories ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab('tags')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tags'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tags ({tags.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'categories' ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
                <p className="text-sm text-gray-500">{categories.length} total categories</p>
              </div>
              
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No categories found</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="sds-chip sds-chip-category relative group cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span>{category.name}</span>
                      </div>
                      
                      {/* Delete button - only visible on hover */}
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                        title="Delete category"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Tags</h2>
                <p className="text-sm text-gray-500">{tags.length} total tags</p>
              </div>
              
              {tags.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No tags found</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="sds-chip sds-chip-tag relative group cursor-pointer"
                    >
                      <span>#{tag.name}</span>
                      
                      {/* Delete button - only visible on hover */}
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                        title="Delete tag"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 