'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import {
  Bookmark as BookmarkIcon,
  FolderPlus,
  Folder,
  Star,
  Eye,
  Trash2,
  FolderOpen,
  StickyNote,
  ArrowRight,
} from 'lucide-react';

interface Collection {
  id: number;
  name: string;
  description: string;
  color: string;
  bookmark_count: number;
  created_at: string;
}

interface BookmarkItem {
  portfolio_id: string;
  note: string;
  created_at: string;
  portfolio: {
    title: string;
    status: string;
    rating_avg: number;
    view_count: number;
    category?: string;
  };
  student: {
    id: string;
    full_name: string;
    student_number: string;
  };
}

interface CollectionsResponse {
  collections: Collection[];
}

interface BookmarksResponse {
  bookmarks: BookmarkItem[];
}

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState<string | null>(null);
  const [newCollection, setNewCollection] = useState({ name: '', description: '', color: '#ef4444' });
  const [dataLoading, setDataLoading] = useState(true);

  const userRole = user?.role?.toLowerCase() || '';
  const isAllowed = userRole === 'employer' || userRole === 'admin';

  useEffect(() => {
    if (!loading && !isAllowed) {
      router.push('/dashboard');
    }
  }, [loading, isAllowed, router]);

  useEffect(() => {
    if (user && isAllowed) {
      fetchData();
    }
  }, [user, isAllowed]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [collectionsRes, bookmarksRes] = await Promise.all([
        api.get<CollectionsResponse>('/bookmarks/collections'),
        api.get<BookmarksResponse>('/bookmarks'),
      ]);
      setCollections(collectionsRes.collections || []);
      setBookmarks(bookmarksRes.bookmarks || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchCollectionBookmarks = async (collectionId: number) => {
    try {
      const res = await api.get<BookmarksResponse>(`/bookmarks/collections/${collectionId}/bookmarks`);
      setBookmarks(res.bookmarks || []);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleSelectCollection = (id: number | null) => {
    setSelectedCollection(id);
    if (id === null) {
      fetchData();
    } else {
      fetchCollectionBookmarks(id);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) return;
    try {
      await api.post('/bookmarks/collections', newCollection);
      setShowCreateModal(false);
      setNewCollection({ name: '', description: '', color: '#ef4444' });
      fetchData();
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    if (!confirm("Kolleksiyani o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/bookmarks/collections/${id}`);
      if (selectedCollection === id) {
        setSelectedCollection(null);
      }
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleMoveBookmark = async (portfolioId: string, collectionId: number | null, notes: string) => {
    try {
      await api.put(`/bookmarks/${portfolioId}/collection`, {
        collection_id: collectionId,
        notes,
      });
      setShowMoveModal(null);
      if (selectedCollection) {
        fetchCollectionBookmarks(selectedCollection);
      } else {
        fetchData();
      }
    } catch (error) {
      console.error('Move error:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex min-h-screen bg-red-50">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <BookmarkIcon className="w-6 h-6 text-red-600" />
                </div>
                Saqlangan portfoliolar
              </h1>
              <p className="text-gray-600 mt-2">Portfoliolarni kolleksiyalarga ajrating</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <FolderPlus className="w-4 h-4" />
              Yangi kolleksiya
            </button>
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* Collections sidebar */}
              <div className="col-span-3">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-gray-600" />
                    Kolleksiyalar
                  </h2>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSelectCollection(null)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        selectedCollection === null 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="w-5 h-5" />
                          <span className="font-medium">Barchasi</span>
                        </div>
                        <span className="text-sm px-2 py-0.5 bg-gray-100 rounded-full">{bookmarks.length}</span>
                      </div>
                    </button>
                    
                    {collections.map((col) => (
                      <div key={col.id} className="group relative">
                        <button
                          onClick={() => handleSelectCollection(col.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition ${
                            selectedCollection === col.id ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: col.color }}
                              ></span>
                              <span className="truncate">{col.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{col.bookmark_count}</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(col.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bookmarks list */}
              <div className="col-span-9">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <BookmarkIcon className="w-5 h-5 text-gray-600" />
                    {selectedCollection 
                      ? collections.find(c => c.id === selectedCollection)?.name 
                      : 'Barcha bookmarklar'}
                  </h2>
                  
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BookmarkIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-600">Hali bookmark yo&apos;q</p>
                      <p className="text-sm text-gray-400 mt-1">Talabalar portfoliolarini saqlang</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookmarks.map((bookmark) => (
                        <div
                          key={bookmark.portfolio_id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">{bookmark.portfolio.title}</h3>
                              <p className="text-gray-600 text-sm">{bookmark.student.full_name}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /> {bookmark.portfolio.rating_avg.toFixed(1)}</span>
                                <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-blue-500" /> {bookmark.portfolio.view_count}</span>
                                {bookmark.portfolio.category && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                                    {bookmark.portfolio.category}
                                  </span>
                                )}
                              </div>
                              {bookmark.note && (
                                <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 flex items-start gap-2">
                                  <StickyNote className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  {bookmark.note}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowMoveModal(bookmark.portfolio_id)}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-all"
                              >
                                <FolderOpen className="w-4 h-4" /> Ko&apos;chirish
                              </button>
                              <button
                                onClick={() => router.push(`/employer?student=${bookmark.student.id}`)}
                                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1.5 transition-all"
                              >
                                Ko&apos;rish <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Create Collection Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Yangi kolleksiya</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                    <input
                      type="text"
                      value={newCollection.name}
                      onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Masalan: Potensial nomzodlar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
                    <textarea
                      value={newCollection.description}
                      onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rang</label>
                    <div className="flex gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewCollection({ ...newCollection, color })}
                          className={`w-8 h-8 rounded-full ${
                            newCollection.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleCreateCollection}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Yaratish
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Move Bookmark Modal */}
          {showMoveModal && (
            <MoveBookmarkModal
              portfolioId={showMoveModal}
              collections={collections}
              onMove={handleMoveBookmark}
              onClose={() => setShowMoveModal(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function MoveBookmarkModal({
  portfolioId,
  collections,
  onMove,
  onClose,
}: {
  portfolioId: string;
  collections: Collection[];
  onMove: (portfolioId: string, collectionId: number | null, notes: string) => void;
  onClose: () => void;
}) {
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Kolleksiyaga ko&apos;chirish</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kolleksiya</label>
            <select
              value={selectedCollection || ''}
              onChange={(e) => setSelectedCollection(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="">Kolleksiyasiz</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qaydlar</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Bu nomzod haqida qaydlar..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => onMove(portfolioId, selectedCollection, notes)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
