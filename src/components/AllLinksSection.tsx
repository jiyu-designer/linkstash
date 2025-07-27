import { CategorizedLink, Category, Tag } from '@/types';

interface AllLinksSectionProps {
  results: CategorizedLink[];
  categories: Category[];
  tags: Tag[];
  selectedCategory: string;
  selectedTag: string;
  readFilter: string;
  sortBy: string;
  onCategoryChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onReadFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onToggleReadStatus: (linkId: string) => void;
  onEditLink: (link: CategorizedLink) => void;
  onDeleteLink: (linkId: string) => void;
  getCategoryColor: (category: string) => string;
  getTagColor: (tag: string) => string;
  showManageButton?: boolean;
}

export default function AllLinksSection({
  results,
  categories,
  tags,
  selectedCategory,
  selectedTag,
  readFilter,
  sortBy,
  onCategoryChange,
  onTagChange,
  onReadFilterChange,
  onSortByChange,
  onToggleReadStatus,
  onEditLink,
  onDeleteLink,
  getCategoryColor,
  getTagColor,
  showManageButton = true
}: AllLinksSectionProps) {
  return (
    <div className="section-container p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white tracking-tight" style={{ fontSize: 'calc(1.25rem + 1px)' }}>All Links</h2>
      </div>
      
      {/* Filters with Add button */}
      <div className="mb-8">
        <div className="flex items-end justify-between gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 flex-1">
            {/* Category Filter */}
            <div>
              <label className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Category
                {selectedCategory !== 'all' && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full ml-3 shadow-sm"></div>
                )}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full h-11 px-4 pr-10 glass-input rounded-xl text-sm font-normal focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center] transition-all duration-200"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <label className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Tag
                {selectedTag !== 'all' && (
                  <div className="w-2 h-2 bg-green-400 rounded-full ml-3 shadow-sm"></div>
                )}
              </label>
              <select
                value={selectedTag}
                onChange={(e) => onTagChange(e.target.value)}
                className="w-full h-11 px-4 pr-10 glass-input rounded-xl text-sm font-normal focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center] transition-all duration-200"
              >
                <option value="all">All Tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.name}>
                    #{tag.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Read Status Filter */}
            <div>
              <label className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Read Status
                {readFilter !== 'all' && (
                  <div className="w-2 h-2 bg-purple-400 rounded-full ml-3 shadow-sm"></div>
                )}
              </label>
              <select
                value={readFilter}
                onChange={(e) => onReadFilterChange(e.target.value)}
                className="w-full h-11 px-4 pr-10 glass-input rounded-xl text-sm font-normal focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center] transition-all duration-200"
              >
                <option value="all">All</option>
                <option value="read">Read Only</option>
                <option value="unread">Unread Only</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Sort By
                {sortBy !== 'newest-added' && (
                  <div className="w-2 h-2 bg-amber-400 rounded-full ml-3 shadow-sm"></div>
                )}
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="w-full h-11 px-4 pr-10 glass-input rounded-xl text-sm font-normal focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center] transition-all duration-200"
              >
                <option value="newest-added">Newest Added</option>
                <option value="oldest-added">Oldest Added</option>
                <option value="newest">Newest Read</option>
                <option value="oldest">Oldest Read</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>
         
          {/* Manage Button */}
          {showManageButton && (
            <div className="flex items-end">
              <button
                onClick={() => window.location.href = '/manage'}
                className="h-11 w-11 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
                title="Manage Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-white/10 mb-6"></div>

      {/* Links List */}
      {results.length > 0 ? (
        <>
          <table className="w-full">
            <tbody>
              {results.map((link) => (
                <tr key={link.id} className="sds-table-row group">
                  <td className="sds-table-cell w-12">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onToggleReadStatus(link.id)}
                        className="custom-toggle-button"
                        title={!link.isRead ? 'Mark as read' : 'Mark as unread'}
                        data-checked={link.isRead}
                      >
                        <div className="toggle-circle">
                          {link.isRead && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                  </td>
                  <td className="sds-table-cell">
                    <div className="space-y-2">
                      <div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium text-base leading-relaxed line-clamp-2 hover:text-blue-300 transition-colors duration-200"
                        >
                          {link.title}
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <span
                          onClick={() => onCategoryChange(link.category)}
                          className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(link.category)}`}
                        >
                          {link.category}
                        </span>
                        {link.tags.map((tag, index) => (
                          <span
                            key={index}
                            onClick={() => onTagChange(tag)}
                            className={`inline-flex px-2 py-1 text-xs rounded border font-medium ${getTagColor(tag)}`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {link.memo && (
                        <div className="text-gray-400 text-sm leading-relaxed line-clamp-2 italic">
                          {link.memo}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="sds-table-cell w-24">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => onEditLink(link)}
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-white transition-all duration-200 rounded-lg hover:bg-white/10 hover:scale-110"
                        title="Edit link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 18.549 2.8a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteLink(link.id)}
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-red-400 transition-all duration-200 rounded-lg hover:bg-red-500/10 hover:scale-110"
                        title="Delete link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H7.862a2.25 2.25 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500">
            No saved links yet. Start by adding your first link above!
          </div>
        </div>
      )}
    </div>
  );
} 