import { CategorizedLink, Category, Tag, User, UserProfile, UserStats } from '@/types';
import { getCurrentUserId } from './auth';
import { supabase } from './supabase';

// Helper function to convert database row to User
const dbToUser = (row: any): User => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name || undefined,
  avatarUrl: row.avatar_url || undefined,
  preferences: row.preferences || {},
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// Helper function to convert database row to Category
const dbToCategory = (row: any): Category => ({
  id: row.id,
  name: row.name,
  color: row.color,
  description: row.description || undefined,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// Helper function to convert database row to Tag
const dbToTag = (row: any): Tag => ({
  id: row.id,
  name: row.name,
  color: row.color,
  description: row.description || undefined,
  userId: row.user_id,
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
  userId: row.user_id,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

export const database = {
  // Categories
  categories: {
    async getAll(): Promise<Category[]> {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('No authenticated user, returning empty categories');
        return [];
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw new Error('Failed to fetch categories');
      }
      
      return data.map(dbToCategory);
    },

    async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to create categories');
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          color: category.color,
          description: category.description || null,
          user_id: userId
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
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to update categories');
      }

      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      
      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
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
      const userId = await getCurrentUserId();
      if (!userId) {
        return null; // No user, no category can be found
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('name', name)
        .eq('user_id', userId)
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
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('No authenticated user, returning empty tags');
        return [];
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tags:', error);
        throw new Error('Failed to fetch tags');
      }
      
      return data.map(dbToTag);
    },

    async create(tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to create tags');
      }

      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: tag.name,
          color: tag.color,
          description: tag.description || null,
          user_id: userId
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
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to update tags');
      }

      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      
      const { data, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
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
      const userId = await getCurrentUserId();
      if (!userId) {
        return null; // No user, no tag can be found
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('name', name)
        .eq('user_id', userId)
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
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('No authenticated user, returning empty links');
        return [];
      }

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching links:', error);
        throw new Error('Failed to fetch links');
      }
      
      return data.map(dbToLink);
    },

    async create(link: Omit<CategorizedLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategorizedLink> {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to create links');
      }

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
          read_at: link.readAt || null,
          user_id: userId
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
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to update links');
      }

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
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating link:', error);
        throw new Error('Failed to update link');
      }
      
      return dbToLink(data);
    },

    async delete(id: string): Promise<void> {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to delete links');
      }

      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error deleting link:', error);
        throw new Error('Failed to delete link');
      }
    },

    async getByCategory(category: string): Promise<CategorizedLink[]> {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('No authenticated user, returning empty links');
        return [];
      }

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('category', category)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching links by category:', error);
        throw new Error('Failed to fetch links by category');
      }
      
      return data.map(dbToLink);
    },

    async getByTag(tag: string): Promise<CategorizedLink[]> {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('No authenticated user, returning empty links');
        return [];
      }

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .contains('tags', [tag])
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching links by tag:', error);
        throw new Error('Failed to fetch links by tag');
      }
      
      return data.map(dbToLink);
    },

    async toggleReadStatus(id: string): Promise<CategorizedLink> {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to toggle read status');
      }

      // First get the current link to check its read status
      const { data: currentLink, error: fetchError } = await supabase
        .from('links')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
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
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling read status:', error);
        throw new Error('Failed to toggle read status');
      }

      return dbToLink(data);
    },

    async getReadLinksByDateRange(startDate: Date, endDate: Date): Promise<CategorizedLink[]> {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('No authenticated user, returning empty links');
        return [];
      }

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('is_read', true)
        .eq('user_id', userId)
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
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('Cannot auto-create categories/tags: user not authenticated');
        return;
      }

      // Check and create category if it doesn't exist
      const existingCategory = await this.categories.findByName(categoryName);
      if (!existingCategory) {
        await this.categories.create({
          name: categoryName,
          color: '#3B82F6',
          userId
        });
      }

      // Check and create tags if they don't exist
      for (const tagName of tagNames) {
        const existingTag = await this.tags.findByName(tagName);
        if (!existingTag) {
          await this.tags.create({
            name: tagName,
            color: '#10B981',
            userId
          });
        }
      }
    } catch (error) {
      console.error('Error auto-creating category and tags:', error);
      // Don't throw here, as this is a secondary operation
    }
  },

  // Users management
  users: {
    async getProfile(userId?: string): Promise<UserProfile | null> {
      const targetUserId = userId || await getCurrentUserId();
      if (!targetUserId) {
        return null;
      }

      const { data, error } = await supabase
        .rpc('get_user_profile', { user_uuid: targetUserId });

      if (error) {
        console.error('Error getting user profile:', error);
        throw new Error('Failed to get user profile');
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        preferences: data.preferences,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        stats: {
          totalLinks: data.stats.total_links,
          readLinks: data.stats.read_links,
          unreadLinks: data.stats.unread_links,
          totalCategories: data.stats.total_categories,
          totalTags: data.stats.total_tags,
          readingStreakDays: data.stats.reading_streak_days
        }
      };
    },

    async updateProfile(updates: Partial<User>): Promise<User> {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to update profile');
      }

      const updateData: any = {};
      if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
      if (updates.preferences !== undefined) updateData.preferences = updates.preferences;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw new Error('Failed to update user profile');
      }

      return dbToUser(data);
    },

    async getStats(userId?: string): Promise<UserStats> {
      const targetUserId = userId || await getCurrentUserId();
      if (!targetUserId) {
        throw new Error('User ID required for stats');
      }

      const { data, error } = await supabase
        .rpc('get_user_stats', { user_uuid: targetUserId });

      if (error) {
        console.error('Error getting user stats:', error);
        throw new Error('Failed to get user stats');
      }

      return {
        totalLinks: data.total_links,
        readLinks: data.read_links,
        unreadLinks: data.unread_links,
        totalCategories: data.total_categories,
        totalTags: data.total_tags,
        readingStreakDays: data.reading_streak_days
      };
    }
  },

  // AI Limits management
  aiLimits: {
    async getUserLimit(userEmail: string): Promise<any> {
      const { data, error } = await supabase
        .rpc('get_user_ai_limit', { user_email: userEmail });

      if (error) {
        console.error('Error getting user AI limit:', error);
        throw new Error('Failed to get user AI limit');
      }

      return data;
    },

    async incrementUsage(userEmail: string): Promise<boolean> {
      const { data, error } = await supabase
        .rpc('increment_user_ai_usage', { user_email: userEmail });

      if (error) {
        console.error('Error incrementing AI usage:', error);
        throw new Error('Failed to increment AI usage');
      }

      return data;
    },

    async resetUsage(userEmail: string): Promise<boolean> {
      const { data, error } = await supabase
        .rpc('reset_user_ai_usage', { user_email: userEmail });

      if (error) {
        console.error('Error resetting AI usage:', error);
        throw new Error('Failed to reset AI usage');
      }

      return data;
    },

    async setExempt(userEmail: string, exempt: boolean): Promise<boolean> {
      const { data, error } = await supabase
        .rpc('set_user_exempt', { user_email: userEmail, exempt_status: exempt });

      if (error) {
        console.error('Error setting user exempt status:', error);
        throw new Error('Failed to set user exempt status');
      }

      return data;
    },

    async setTodayDailyLimit(userEmail: string, limit: number): Promise<boolean> {
      const { data, error } = await supabase
        .rpc('set_today_daily_limit', { user_email: userEmail, new_limit: limit });

      if (error) {
        console.error('Error setting today daily limit:', error);
        throw new Error('Failed to set today daily limit');
      }

      return data;
    },

    async setCanResetToday(userEmail: string, canReset: boolean): Promise<boolean> {
      const { data, error } = await supabase
        .rpc('set_can_reset_today', { user_email: userEmail, can_reset: canReset });

      if (error) {
        console.error('Error setting can reset today:', error);
        throw new Error('Failed to set can reset today');
      }

      return data;
    }
  }
}; 