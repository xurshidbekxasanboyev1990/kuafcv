// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { getFileUrl } from '@/lib/config';
import {
  BarChart3,
  Bookmark,
  ChevronDown, ChevronUp,
  Download,
  Edit2,
  Eye,
  Lock,
  MessageCircle,
  Reply,
  Send,
  Star,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

interface PortfolioStats {
  total_views: number;
  unique_views: number;
  rating_avg: number;
  rating_count: number;
  comment_count: number;
  bookmark_count: number;
  views_trend: { date: string; views: number }[];
}

interface Rating {
  rating: number;
  review: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    role: string;
    profile_image?: string;
  };
}

interface Comment {
  id: number;
  content: string;
  parent_id: number | null;
  is_private: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    role: string;
    profile_image?: string;
  };
  can_edit: boolean;
  replies?: Comment[];
}

// Stats Card Component
export function PortfolioStatsCard({ portfolioId, isOwner = false }: { portfolioId: string; isOwner?: boolean }) {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [portfolioId]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-red-600" />
          Portfolio Statistikasi
        </h3>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <Eye className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{stats.total_views}</p>
              <p className="text-xs text-blue-600">Ko'rishlar</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <Star className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-700">
                {stats.rating_avg.toFixed(1)}
              </p>
              <p className="text-xs text-yellow-600">{stats.rating_count} baho</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <MessageCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{stats.comment_count}</p>
              <p className="text-xs text-green-600">Izohlar</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <Bookmark className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-700">{stats.bookmark_count}</p>
              <p className="text-xs text-purple-600">Saqlangan</p>
            </div>
          </div>

          {/* Views Trend */}
          {stats.views_trend && stats.views_trend.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Oxirgi 7 kun
              </h4>
              <div className="flex items-end gap-1 h-16">
                {stats.views_trend.map((day, i) => {
                  const maxViews = Math.max(...stats.views_trend.map(d => d.views), 1);
                  const height = (day.views / maxViews) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-red-500 rounded-t"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${day.date}: ${day.views} ko'rish`}
                      />
                      <span className="text-[10px] text-gray-400 mt-1">
                        {new Date(day.date).toLocaleDateString('uz', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Rating Component
export function PortfolioRating({
  portfolioId,
  canRate = false,
  onRated
}: {
  portfolioId: string;
  canRate?: boolean;
  onRated?: () => void;
}) {
  const [ratings, setRatings] = useState<{
    avg_rating: number;
    rating_count: number;
    distribution: number[];
    reviews: Rating[];
    user_rating: number | null;
    user_review: string | null;
  } | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [portfolioId]);

  const fetchRatings = async () => {
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/ratings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRatings(data);
        if (data.user_rating) {
          setMyRating(data.user_rating);
          setMyReview(data.user_review || '');
        }
      }
    } catch (err) {
      console.error('Ratings fetch error:', err);
    }
  };

  const submitRating = async () => {
    if (myRating === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating: myRating, review: myReview })
      });

      if (res.ok) {
        fetchRatings();
        setShowReviewForm(false);
        onRated?.();
      }
    } catch (err) {
      console.error('Rating submit error:', err);
    }
    setSubmitting(false);
  };

  if (!ratings) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" />
        Reytinglar va Sharhlar
      </h3>

      {/* Average Rating Display */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-800">{ratings.avg_rating.toFixed(1)}</p>
          <div className="flex gap-0.5 justify-center my-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.round(ratings.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">{ratings.rating_count} ta baho</p>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map(star => {
            const count = ratings.distribution[star - 1] || 0;
            const percent = ratings.rating_count > 0 ? (count / ratings.rating_count) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-gray-600">{star}</span>
                <Star className="w-3 h-3 text-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 text-gray-500 text-xs">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rate Button */}
      {canRate && (
        <div className="border-t pt-4">
          {showReviewForm ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sizning bahongiz:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMyRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      aria-label={`${star} yulduz`}
                      title={`${star} yulduz`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${star <= (hoveredStar || myRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={myReview}
                onChange={(e) => setMyReview(e.target.value)}
                placeholder="Sharh qoldiring (ixtiyoriy)..."
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={submitRating}
                  disabled={myRating === 0 || submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Saqlanmoqda...' : ratings.user_rating ? 'Yangilash' : 'Baholash'}
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full py-2 border-2 border-dashed border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              {ratings.user_rating ? '⭐ Bahoni o\'zgartirish' : '⭐ Baholash'}
            </button>
          )}
        </div>
      )}

      {/* Reviews */}
      {ratings.reviews && ratings.reviews.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-medium text-gray-700">Sharhlar</h4>
          {ratings.reviews.map((review, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {review.user.profile_image ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                    <img
                      src={getFileUrl(review.user.profile_image)}
                      alt={review.user.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-medium text-sm">
                      {review.user.full_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{review.user.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {review.user.role === 'EMPLOYER' ? 'Ish beruvchi' : review.user.role}
                  </p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700">{review.review}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(review.created_at).toLocaleDateString('uz')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Comments Component
export function PortfolioComments({
  portfolioId,
  currentUserId
}: {
  portfolioId: string;
  currentUserId?: string;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [portfolioId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/comments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Comments fetch error:', err);
    }
  };

  const submitComment = async (parentId?: number) => {
    const content = parentId ? newComment : newComment;
    if (!content.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: content.trim(),
          parent_id: parentId || null,
          is_private: isPrivate
        })
      });

      if (res.ok) {
        setNewComment('');
        setReplyingTo(null);
        setIsPrivate(false);
        fetchComments();
      }
    } catch (err) {
      console.error('Comment submit error:', err);
    }
    setSubmitting(false);
  };

  const updateComment = async (id: number) => {
    if (!editContent.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/portfolio/comments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: editContent.trim() })
      });

      if (res.ok) {
        setEditingId(null);
        setEditContent('');
        fetchComments();
      }
    } catch (err) {
      console.error('Comment update error:', err);
    }
    setSubmitting(false);
  };

  const deleteComment = async (id: number) => {
    if (!confirm("Izohni o'chirishni tasdiqlaysizmi?")) return;

    try {
      const res = await fetch(`/api/portfolio/comments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error('Comment delete error:', err);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div
      key={comment.id}
      className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}
    >
      <div className={`p-3 rounded-lg ${comment.is_private ? 'bg-yellow-50' : 'bg-gray-50'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {comment.user.profile_image ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                <img
                  src={getFileUrl(comment.user.profile_image)}
                  alt={comment.user.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium text-sm">
                  {comment.user.full_name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{comment.user.full_name}</p>
              <p className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleDateString('uz')}
                {comment.is_edited && <span className="ml-1">(tahrirlangan)</span>}
              </p>
            </div>
            {comment.is_private && (
              <span title="Maxfiy izoh">
                <Lock className="w-4 h-4 text-yellow-600" />
              </span>
            )}
          </div>
          {comment.can_edit && (
            <div className="flex gap-1">
              <button
                onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                className="p-1 hover:bg-gray-200 rounded"
                aria-label="Tahrirlash"
                title="Tahrirlash"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => deleteComment(comment.id)}
                className="p-1 hover:bg-red-100 rounded"
                aria-label="O'chirish"
                title="O'chirish"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {editingId === comment.id ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded text-sm resize-none"
              rows={2}
              aria-label="Izoh matnini tahrirlash"
              placeholder="Izoh matnini tahrirlash..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateComment(comment.id)}
                disabled={submitting}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Saqlash
              </button>
              <button
                onClick={() => { setEditingId(null); setEditContent(''); }}
                className="px-3 py-1 border text-sm rounded hover:bg-gray-50"
              >
                Bekor
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-700 mt-2">{comment.content}</p>
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs text-red-600 hover:text-red-700 mt-2 flex items-center gap-1"
            >
              <Reply className="w-3 h-3" /> Javob berish
            </button>
          </>
        )}
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="mt-2 ml-8 flex gap-2">
          {user && (
            user.profile_image ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                <img
                  src={getFileUrl(user.profile_image)}
                  alt="Me"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-medium text-xs">
                  {user.full_name.charAt(0)}
                </span>
              </div>
            )
          )}
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Javob yozing..."
              className="w-full p-3 border rounded-lg pr-10 focus:ring-2 focus:ring-red-500"
              aria-label="Javob yozish"
            />
            <button
              onClick={() => submitComment(comment.id)}
              disabled={submitting || !newComment.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              aria-label="Javobni yuborish"
              title="Javobni yuborish"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Render replies */}
      {comment.replies && comment.replies.map(reply => renderComment(reply, depth + 1))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-green-600" />
        Izohlar ({comments.length})
      </h3>

      {/* New Comment Form */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Izoh yozing..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={() => submitComment()}
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Yuborish
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded text-red-600"
          />
          <Lock className="w-4 h-4" />
          Maxfiy izoh (faqat portfolio egasi ko'radi)
        </label>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Hali izohlar yo'q</p>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}

// Bookmark Button
export function BookmarkButton({
  portfolioId,
  initialBookmarked = false,
  onToggle
}: {
  portfolioId: string;
  initialBookmarked?: boolean;
  onToggle?: (bookmarked: boolean) => void;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
        onToggle?.(data.bookmarked);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${bookmarked
          ? 'bg-purple-100 text-purple-600'
          : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
        }`}
      title={bookmarked ? "Saqlangan" : "Saqlash"}
    >
      <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
    </button>
  );
}

// View Counter (Call when portfolio is viewed)
export function usePortfolioView(portfolioId: string) {
  useEffect(() => {
    if (!portfolioId) return;

    const recordView = async () => {
      try {
        await fetch(`/api/portfolio/${portfolioId}/view`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } catch (err) {
        // Silent fail
      }
    };

    // Record view after 3 seconds (to filter quick bounces)
    const timer = setTimeout(recordView, 3000);
    return () => clearTimeout(timer);
  }, [portfolioId]);
}

// PDF Export Component
export function ExportPDFButton({ portfolioId }: { portfolioId: string }) {
  const [loading, setLoading] = useState(false);

  const exportPDF = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/export/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        const data = await res.json();

        // Generate PDF using browser
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${data.portfolio.title} - Portfolio</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
                h1 { color: #DC2626; border-bottom: 2px solid #DC2626; padding-bottom: 10px; }
                h2 { color: #374151; margin-top: 30px; }
                .info { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
                .stat { text-align: center; padding: 15px; background: #FEF2F2; border-radius: 8px; }
                .stat-value { font-size: 24px; font-weight: bold; color: #DC2626; }
                .review { background: #F9FAFB; padding: 15px; border-radius: 8px; margin: 10px 0; }
                .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 12px; }
              </style>
            </head>
            <body>
              <h1>${data.portfolio.title}</h1>
              
              <div class="info">
                <p><strong>Talaba:</strong> ${data.student.full_name}</p>
                <p><strong>Email:</strong> ${data.student.email}</p>
                ${data.student.student_id ? `<p><strong>ID:</strong> ${data.student.student_id}</p>` : ''}
                <p><strong>Status:</strong> ${data.portfolio.status}</p>
                <p><strong>Yaratilgan:</strong> ${new Date(data.portfolio.created_at).toLocaleDateString('uz')}</p>
              </div>

              ${data.portfolio.description ? `
                <h2>Tavsif</h2>
                <p>${data.portfolio.description}</p>
              ` : ''}

              <h2>Statistika</h2>
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${data.portfolio.view_count}</div>
                  <div>Ko'rishlar</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${data.portfolio.rating_avg.toFixed(1)}</div>
                  <div>Reyting (${data.portfolio.rating_count} baho)</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${data.reviews?.length || 0}</div>
                  <div>Sharhlar</div>
                </div>
              </div>

              ${data.reviews && data.reviews.length > 0 ? `
                <h2>Sharhlar</h2>
                ${data.reviews.map((r: any) => `
                  <div class="review">
                    <p><strong>${r.reviewer}</strong> - ${'⭐'.repeat(r.rating)}</p>
                    <p>${r.review}</p>
                    <small>${new Date(r.created_at).toLocaleDateString('uz')}</small>
                  </div>
                `).join('')}
              ` : ''}

              <div class="footer">
                <p>KUAFCV Portfolio System - ${new Date().toLocaleDateString('uz')}</p>
              </div>
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (err) {
      console.error('PDF export error:', err);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={exportPDF}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? (
        <>Yuklanmoqda...</>
      ) : (
        <>
          <Download className="w-4 h-4" />
          PDF yuklab olish
        </>
      )}
    </button>
  );
}
