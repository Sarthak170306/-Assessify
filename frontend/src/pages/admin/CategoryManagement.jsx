import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  FolderPlus, 
  FolderTree, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  RefreshCw, 
  AlertTriangle, 
  X, 
  Sparkles, 
  BookOpen, 
  Tag, 
  CheckCircle2 
} from 'lucide-react';

export default function CategoryManagement() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/categories`, { headers });
      if (!res.ok) throw new Error(`Failed to fetch categories (${res.status})`);

      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, getToken, API_BASE_URL]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filtered Categories
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setFormError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setFormError(null);
    setModalOpen(true);
  };

  // Form Submit (Create / Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = {
        'Content-Type': 'application/json',
        'x-clerk-user-id': user?.id || ''
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = editingCategory 
        ? `${API_BASE_URL}/categories/${editingCategory.id}`
        : `${API_BASE_URL}/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description ? formData.description.trim() : null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save category.');
      }

      if (data.success && data.category) {
        if (editingCategory) {
          setCategories(prev => prev.map(c => c.id === editingCategory.id ? data.category : c));
        } else {
          setCategories(prev => [data.category, ...prev]);
        }
        setModalOpen(false);
      }
    } catch (err) {
      console.error('Save category error:', err);
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category Confirm
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
        setCategoryToDelete(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Delete category error:', err);
      alert('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
              <FolderTree className="w-7 h-7 text-indigo-400" /> Category Directory & Domains
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {isLoading ? '...' : `${categories.length} Categories`}
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Organize quiz knowledge domains, topics, and skill assessment categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCategories}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Category</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          /* Skeleton Cards */
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 animate-pulse shadow-xl">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="w-20 h-5 rounded-full bg-slate-800" />
              </div>
              <div className="w-32 h-5 rounded bg-slate-800" />
              <div className="w-48 h-3 rounded bg-slate-800/60" />
            </div>
          ))
        ) : filteredCategories.length === 0 ? (
          /* Empty State */
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">No categories found</h3>
              <p className="text-xs text-slate-400">
                {searchTerm ? 'No category matched your search criteria.' : 'Create your first topic category to classify quizzes.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Category
              </button>
            </div>
          </div>
        ) : (
          /* Category Cards */
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                    <Tag className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {cat.quizzesCount || 0} Quizzes Linked
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {cat.description || 'No detailed description provided for this knowledge domain.'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-4">
                <span className="text-[11px] text-slate-500 font-mono">
                  ID: {cat.id.substring(0, 8)}...
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(cat)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(cat)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & DevOps"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Summarize the core topics covered in this knowledge category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Delete Category Confirmation</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              Are you sure you want to delete <strong className="text-slate-100">{categoryToDelete.name}</strong>?
              {categoryToDelete.quizzesCount > 0 && (
                <span className="block text-amber-400 mt-1 font-semibold">
                  ⚠️ Note: There are currently {categoryToDelete.quizzesCount} quizzes linked to this category.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
