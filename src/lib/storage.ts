import { Category, Tag, CategorizedLink } from '@/types';
import { database } from './database';
import { isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  CATEGORIES: 'linkstash-categories',
  TAGS: 'linkstash-tags',
  LINKS: 'linkstash-links'
} as const;

// Local storage helpers
const localStorageHelpers = {
  getCategories: (): Category[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      return parsed.map((cat: any) => ({
        ...cat,
        createdAt: new Date(cat.createdAt),
        updatedAt: new Date(cat.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading categories from localStorage:', error);
      return [];
    }
  },

  setCategories: (categories: Category[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      window.dispatchEvent(new CustomEvent('storage-categories-updated', { detail: categories }));
    } catch (error) {
      console.error('Error saving categories to localStorage:', error);
    }
  },

  getTags: (): Tag[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAGS);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      return parsed.map((tag: any) => ({
        ...tag,
        createdAt: new Date(tag.createdAt),
        updatedAt: new Date(tag.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading tags from localStorage:', error);
      return [];
    }
  },

  setTags: (tags: Tag[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
      window.dispatchEvent(new CustomEvent('storage-tags-updated', { detail: tags }));
    } catch (error) {
      console.error('Error saving tags to localStorage:', error);
    }
  },

  getLinks: (): CategorizedLink[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LINKS);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      const migratedLinks = parsed.map((link: any) => ({
        ...link,
        // Migrate old data: add missing fields
        isRead: link.isRead !== undefined ? link.isRead : false,
        readAt: link.readAt ? new Date(link.readAt) : undefined,
        createdAt: new Date(link.createdAt),
        updatedAt: new Date(link.updatedAt)
      }));
      
      // Save migrated data back to localStorage if there were changes
      const hasChanges = parsed.some((link: any) => link.isRead === undefined);
      if (hasChanges) {
        console.log('Migrating localStorage data to include read status fields');
        localStorageHelpers.setLinks(migratedLinks);
      }
      
      return migratedLinks;
    } catch (error) {
      console.error('Error loading links from localStorage:', error);
      return [];
    }
  },

  setLinks: (links: CategorizedLink[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
      window.dispatchEvent(new CustomEvent('storage-links-updated', { detail: links }));
    } catch (error) {
      console.error('Error saving links to localStorage:', error);
    }
  },

  updateLinkDates: (title: string, createdAt?: string, readAt?: string): void => {
    try {
      const links = localStorageHelpers.getLinks();
      const linkIndex = links.findIndex(link => link.title === title);
      
      if (linkIndex !== -1) {
        if (createdAt) {
          links[linkIndex].createdAt = new Date(createdAt);
        }
        if (readAt) {
          links[linkIndex].readAt = new Date(readAt);
          links[linkIndex].isRead = true;
        }
        localStorageHelpers.setLinks(links);
        console.log(`Updated dates for: ${title}`);
      } else {
        console.log(`Link not found: ${title}`);
      }
    } catch (error) {
      console.error('Error updating link dates:', error);
    }
  },

  updateLink: (linkId: string, updates: Partial<CategorizedLink>): void => {
    try {
      const links = localStorageHelpers.getLinks();
      const updated = links.map(link => 
        link.id === linkId ? { ...link, ...updates, updatedAt: new Date() } : link
      );
      localStorageHelpers.setLinks(updated);
    } catch (error) {
      console.error('Error updating link in localStorage:', error);
    }
  },

  deleteLink: (linkId: string): void => {
    try {
      const links = localStorageHelpers.getLinks();
      const updated = links.filter(link => link.id !== linkId);
      localStorageHelpers.setLinks(updated);
    } catch (error) {
      console.error('Error deleting link in localStorage:', error);
    }
  }
};

// Main storage interface - hybrid system
export const storage = {
  // Categories
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured()) {
      try {
        return await database.categories.getAll();
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    return localStorageHelpers.getCategories();
  },

  async addCategory(category: Category): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.categories.create(category);
        // Trigger update event for UI
        const categories = await this.getCategories();
        window.dispatchEvent(new CustomEvent('storage-categories-updated', { detail: categories }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const categories = localStorageHelpers.getCategories();
    const updated = [...categories, category];
    localStorageHelpers.setCategories(updated);
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.categories.update(id, updates);
        // Trigger update event for UI
        const categories = await this.getCategories();
        window.dispatchEvent(new CustomEvent('storage-categories-updated', { detail: categories }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const categories = localStorageHelpers.getCategories();
    const updated = categories.map(cat => 
      cat.id === id ? { ...cat, ...updates, updatedAt: new Date() } : cat
    );
    localStorageHelpers.setCategories(updated);
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.categories.delete(id);
        // Trigger update event for UI
        const categories = await this.getCategories();
        window.dispatchEvent(new CustomEvent('storage-categories-updated', { detail: categories }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const categories = localStorageHelpers.getCategories();
    const updated = categories.filter(cat => cat.id !== id);
    localStorageHelpers.setCategories(updated);
  },

  // Tags
  async getTags(): Promise<Tag[]> {
    if (isSupabaseConfigured()) {
      try {
        return await database.tags.getAll();
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    return localStorageHelpers.getTags();
  },

  async addTag(tag: Tag): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.tags.create(tag);
        // Trigger update event for UI
        const tags = await this.getTags();
        window.dispatchEvent(new CustomEvent('storage-tags-updated', { detail: tags }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const tags = localStorageHelpers.getTags();
    const updated = [...tags, tag];
    localStorageHelpers.setTags(updated);
  },

  async updateTag(id: string, updates: Partial<Tag>): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.tags.update(id, updates);
        // Trigger update event for UI
        const tags = await this.getTags();
        window.dispatchEvent(new CustomEvent('storage-tags-updated', { detail: tags }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const tags = localStorageHelpers.getTags();
    const updated = tags.map(tag => 
      tag.id === id ? { ...tag, ...updates, updatedAt: new Date() } : tag
    );
    localStorageHelpers.setTags(updated);
  },

  async deleteTag(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.tags.delete(id);
        // Trigger update event for UI
        const tags = await this.getTags();
        window.dispatchEvent(new CustomEvent('storage-tags-updated', { detail: tags }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const tags = localStorageHelpers.getTags();
    const updated = tags.filter(tag => tag.id !== id);
    localStorageHelpers.setTags(updated);
  },

  // Links
  async getLinks(): Promise<CategorizedLink[]> {
    if (isSupabaseConfigured()) {
      try {
        return await database.links.getAll();
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    return localStorageHelpers.getLinks();
  },

  async addLink(link: CategorizedLink): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.links.create(link);
        // Trigger update event for UI
        const links = await this.getLinks();
        window.dispatchEvent(new CustomEvent('storage-links-updated', { detail: links }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const links = localStorageHelpers.getLinks();
    const updated = [link, ...links];
    localStorageHelpers.setLinks(updated);
  },

  async updateLink(id: string, updates: Partial<CategorizedLink>): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.links.update(id, updates);
        // Trigger update event for UI
        const links = await this.getLinks();
        window.dispatchEvent(new CustomEvent('storage-links-updated', { detail: links }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    localStorageHelpers.updateLink(id, updates);
  },

  async deleteLink(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.links.delete(id);
        // Trigger update event for UI
        const links = await this.getLinks();
        window.dispatchEvent(new CustomEvent('storage-links-updated', { detail: links }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const links = localStorageHelpers.getLinks();
    const updated = links.filter(link => link.id !== id);
    localStorageHelpers.setLinks(updated);
  },

  // Auto-create category and tags
  async autoCreateCategoryAndTags(categoryName: string, tagNames: string[]): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await database.autoCreateCategoryAndTags(categoryName, tagNames);
        // Trigger update events for UI
        const [categories, tags] = await Promise.all([
          this.getCategories(),
          this.getTags()
        ]);
        window.dispatchEvent(new CustomEvent('storage-categories-updated', { detail: categories }));
        window.dispatchEvent(new CustomEvent('storage-tags-updated', { detail: tags }));
        return;
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const now = new Date();
    
    // Auto-create category if it doesn't exist
    const categories = localStorageHelpers.getCategories();
    if (!categories.find(cat => cat.name === categoryName)) {
      const newCategory: Category = {
        id: crypto.randomUUID(),
        name: categoryName,
        color: '#3B82F6',
        userId: 'local-user',
        createdAt: now,
        updatedAt: now
      };
      const updatedCategories = [...categories, newCategory];
      localStorageHelpers.setCategories(updatedCategories);
    }

    // Auto-create tags if they don't exist
    const tags = localStorageHelpers.getTags();
    const newTags = tagNames.filter(tagName => 
      !tags.find(tag => tag.name === tagName)
    ).map(tagName => ({
      id: crypto.randomUUID(),
      name: tagName,
      color: '#10B981',
      userId: 'local-user',
      createdAt: now,
      updatedAt: now
    }));

    if (newTags.length > 0) {
      const updatedTags = [...tags, ...newTags];
      localStorageHelpers.setTags(updatedTags);
    }
  },

  // Get filtered data
  async getLinksByCategory(category: string): Promise<CategorizedLink[]> {
    if (isSupabaseConfigured()) {
      try {
        return await database.links.getByCategory(category);
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const links = localStorageHelpers.getLinks();
    return links.filter(link => link.category === category);
  },

  async getLinksByTag(tag: string): Promise<CategorizedLink[]> {
    if (isSupabaseConfigured()) {
      try {
        return await database.links.getByTag(tag);
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const links = localStorageHelpers.getLinks();
    return links.filter(link => link.tags.includes(tag));
  },

  // Toggle read status
  async toggleReadStatus(linkId: string): Promise<CategorizedLink> {
    if (isSupabaseConfigured()) {
      try {
        return await database.links.toggleReadStatus(linkId);
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const links = localStorageHelpers.getLinks();
    const linkIndex = links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) {
      console.error('Available link IDs:', links.map(l => l.id));
      console.error('Requested link ID:', linkId);
      throw new Error(`Link not found with ID: ${linkId}`);
    }

    const link = links[linkIndex];
    const newReadStatus = !link.isRead;
    const updatedLink: CategorizedLink = {
      ...link,
      isRead: newReadStatus,
      readAt: newReadStatus ? new Date() : undefined,
      updatedAt: new Date()
    };

    // Update the specific link in the array
    links[linkIndex] = updatedLink;
    localStorageHelpers.setLinks(links);
    
    return updatedLink;
  },

  // Get read links by date
  async getReadLinksByDate(date: Date): Promise<CategorizedLink[]> {
    if (isSupabaseConfigured()) {
      try {
        return await database.links.getReadLinksByDate(date);
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const links = localStorageHelpers.getLinks();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return links.filter(link => 
      link.isRead && 
      link.readAt && 
      link.readAt >= startOfDay && 
      link.readAt <= endOfDay
    );
  },

  // Get read links by date range
  async getReadLinksByDateRange(startDate: Date, endDate: Date): Promise<CategorizedLink[]> {
    if (isSupabaseConfigured()) {
      try {
        return await database.links.getReadLinksByDateRange(startDate, endDate);
      } catch (error) {
        console.error('Database error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const links = localStorageHelpers.getLinks();
    return links.filter(link => 
      link.isRead && 
      link.readAt && 
      link.readAt >= startDate && 
      link.readAt <= endDate
    );
  }
}; 