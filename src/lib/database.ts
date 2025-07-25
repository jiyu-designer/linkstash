import { supabase } from './supabase';
import { Category, Tag, CategorizedLink } from '@/types';

// Helper function to convert database row to Category
const dbToCategory = (row: any): Category => ({
  id: row.id,
  name: row.name,
  color: row.color,
  description: row.description || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// Helper function to convert database row to Tag
const dbToTag = (row: any): Tag => ({
  id: row.id,
  name: row.name,
  color: row.color,
  description: row.description || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// Helper function to convert database row to CategorizedLink
const dbToLink = (row: any): CategorizedLink => ({
  id: row.id,
  url: row.url,
  title: row.title,
  description: row.description || undefined,
  category: row.category,
  tags: row.tags || [],
  memo: row.memo || undefined,
  isRead: row.is_read || false,
  readAt: row.read_at ? new Date(row.read_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

export const database = {
  // Categories
  categories: {
    async getAll(): Promise<Category[]> {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw new Error('Failed to fetch categories');
      }
      
      return data.map(dbToCategory);
    },

    async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          color: category.color,
          description: category.description || null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating category:', error);
        throw new Error('Failed to create category');
      }
      
      return dbToCategory(data);
    },

    async update(id: string, updates: Partial<Category>): Promise<Category> {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      
      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating category:', error);
        throw new Error('Failed to update category');
      }
      
      return dbToCategory(data);
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting category:', error);
        throw new Error('Failed to delete category');
      }
    },

    async findByName(name: string): Promise<Category | null> {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('name', name)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error finding category by name:', error);
        throw new Error('Failed to find category');
      }
      
      return dbToCategory(data);
    }
  },

  // Tags
  tags: {
    async getAll(): Promise<Tag[]> {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tags:', error);
        throw new Error('Failed to fetch tags');
      }
      
      return data.map(dbToTag);
    },

    async create(tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: tag.name,
          color: tag.color,
          description: tag.description || null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating tag:', error);
        throw new Error('Failed to create tag');
      }
      
      return dbToTag(data);
    },

    async update(id: string, updates: Partial<Tag>): Promise<Tag> {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      
      const { data, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating tag:', error);
        throw new Error('Failed to update tag');
      }
      
      return dbToTag(data);
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting tag:', error);
        throw new Error('Failed to delete tag');
      }
    },

    async findByName(name: string): Promise<Tag | null> {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('name', name)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error finding tag by name:', error);
        throw new Error('Failed to find tag');
      }
      
      return dbToTag(data);
    }
  },

  // Links
  links: {
    async getAll(): Promise<CategorizedLink[]> {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching links:', error);
        throw new Error('Failed to fetch links');
      }
      
      return data.map(dbToLink);
    },

    async create(link: Omit<CategorizedLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategorizedLink> {
      const { data, error } = await supabase
        .from('links')
        .insert({
          url: link.url,
          title: link.title,
          description: link.description || null,
          category: link.category,
          tags: link.tags || [],
          memo: link.memo || null,
          is_read: link.isRead || false,
          read_at: link.readAt || null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating link:', error);
        throw new Error('Failed to create link');
      }
      
      return dbToLink(data);
    },

    async update(id: string, updates: Partial<CategorizedLink>): Promise<CategorizedLink> {
      const updateData: any = {};
      
      if (updates.url !== undefined) updateData.url = updates.url;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.memo !== undefined) updateData.memo = updates.memo || null;
      if (updates.isRead !== undefined) updateData.is_read = updates.isRead;
      if (updates.readAt !== undefined) updateData.read_at = updates.readAt;
      
      const { data, error } = await supabase
        .from('links')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating link:', error);
        throw new Error('Failed to update link');
      }
      
      return dbToLink(data);
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting link:', error);
        throw new Error('Failed to delete link');
      }
    },

    async getByCategory(category: string): Promise<CategorizedLink[]> {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching links by category:', error);
        throw new Error('Failed to fetch links by category');
      }
      
      return data.map(dbToLink);
    },

    async getByTag(tag: string): Promise<CategorizedLink[]> {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .contains('tags', [tag])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching links by tag:', error);
        throw new Error('Failed to fetch links by tag');
      }
      
      return data.map(dbToLink);
    },

    async toggleReadStatus(id: string): Promise<CategorizedLink> {
      // First get the current link to check its read status
      const { data: currentLink, error: fetchError } = await supabase
        .from('links')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching link:', fetchError);
        throw new Error('Failed to fetch link');
      }

      const newReadStatus = !currentLink.is_read;
      const updateData: any = {
        is_read: newReadStatus,
        read_at: newReadStatus ? new Date().toISOString() : null
      };

      const { data, error } = await supabase
        .from('links')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling read status:', error);
        throw new Error('Failed to toggle read status');
      }

      return dbToLink(data);
    },

    async getReadLinksByDateRange(startDate: Date, endDate: Date): Promise<CategorizedLink[]> {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('is_read', true)
        .gte('read_at', startDate.toISOString())
        .lte('read_at', endDate.toISOString())
        .order('read_at', { ascending: false });

      if (error) {
        console.error('Error fetching read links by date range:', error);
        throw new Error('Failed to fetch read links by date range');
      }

      return data.map(dbToLink);
    },

    async getReadLinksByDate(date: Date): Promise<CategorizedLink[]> {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return this.getReadLinksByDateRange(startOfDay, endOfDay);
    }
  },

  // Auto-create categories and tags
  async autoCreateCategoryAndTags(categoryName: string, tagNames: string[]): Promise<void> {
    try {
      // Check and create category if it doesn't exist
      const existingCategory = await this.categories.findByName(categoryName);
      if (!existingCategory) {
        await this.categories.create({
          name: categoryName,
          color: '#3B82F6'
        });
      }

      // Check and create tags if they don't exist
      for (const tagName of tagNames) {
        const existingTag = await this.tags.findByName(tagName);
        if (!existingTag) {
          await this.tags.create({
            name: tagName,
            color: '#10B981'
          });
        }
      }
    } catch (error) {
      console.error('Error auto-creating category and tags:', error);
      // Don't throw here, as this is a secondary operation
    }
  }
}; 