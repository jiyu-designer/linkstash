'use client';

import { storage } from '@/lib/storage';
import { Category, Tag } from '@/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleEditSave = async () => {
    if (!editingId || !editingName.trim()) return;

    try {
      if (activeTab === 'categories') {
        await storage.updateCategory(editingId, { name: editingName.trim() });
      } else {
        await storage.updateTag(editingId, { name: editingName.trim() });
      }
      await loadData();
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-6 sm:px-10 lg:px-[120px] py-8">
        <div className="mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 sm:px-10 lg:px-[120px] py-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white tracking-tight">Manage</h1>
              <p className="text-gray-300 mt-2">Organize your categories and tags</p>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-white/20">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-6 px-6 border-b-2 font-medium text-lg transition-colors ${
                  activeTab === 'categories'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-400'
                }`}
              >
                Categories ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab('tags')}
                className={`py-6 px-6 border-b-2 font-medium text-lg transition-colors ${
                  activeTab === 'tags'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-400'
                }`}
              >
                Tags ({tags.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="section-container p-6 lg:p-8">
          {activeTab === 'categories' ? (
            <div>
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-300">No categories found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingId === category.id ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                              ></div>
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditSave();
                                  if (e.key === 'Escape') handleEditCancel();
                                }}
                                className="flex-1 bg-white/10 rounded-lg px-2 py-1 text-white text-sm border border-white/20 focus:outline-none focus:border-blue-400"
                                autoFocus
                              />
                              <button
                                onClick={handleEditSave}
                                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                title="Save"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div
                              className="sds-chip sds-chip-category cursor-pointer"
                              onClick={() => handleEditStart(category.id, category.name)}
                            >
                              <div className="flex items-center">
                                <div
                                  className="w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: category.color }}
                                ></div>
                                <span>{category.name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {editingId !== category.id && (
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="ml-3 p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete category"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {tags.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-300">No tags found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tags.map((tag) => (
                    <div key={tag.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingId === tag.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 flex-shrink-0">#</span>
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditSave();
                                  if (e.key === 'Escape') handleEditCancel();
                                }}
                                className="flex-1 bg-white/10 rounded-lg px-2 py-1 text-white text-sm border border-white/20 focus:outline-none focus:border-blue-400"
                                autoFocus
                              />
                              <button
                                onClick={handleEditSave}
                                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                title="Save"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div
                              className="sds-chip sds-chip-tag cursor-pointer"
                              onClick={() => handleEditStart(tag.id, tag.name)}
                            >
                              <span>#{tag.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {editingId !== tag.id && (
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="ml-3 p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete tag"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
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