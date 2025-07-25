export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategorizedLink {
  id: string;
  url: string;
  title: string;
  description?: string;
  category: string; // Category name
  tags: string[]; // Array of tag names
  memo?: string; // User's personal memo
  isRead: boolean; // Whether the link has been read
  readAt?: Date; // When the link was read
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiCategorizeResponse {
  category: string;
  tags: string[];
  title: string;
  description?: string;
  url: string;
}

// Form interfaces
export interface CategoryFormData {
  name: string;
  color: string;
  description?: string;
}

export interface TagFormData {
  name: string;
  color: string;
  description?: string;
}

export interface LinkFormData {
  url: string;
  memo?: string;
} 