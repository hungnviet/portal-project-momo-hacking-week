'use client';

import { Comment, apiService, type ApiResponse } from '@/service';
import { useState, useEffect } from 'react';

interface ProjectCommentsProps {
  projectId: string;
}

export default function ProjectComments({ projectId }: ProjectCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments on component mount and when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchComments();
    }
  }, [projectId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Comment[]> = await apiService.getComments(projectId);

      if (apiService.isSuccess(response)) {
        // Sort comments by creation date (newest first)
        const sortedComments = response.data.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setComments(sortedComments);
      } else {
        setError(apiService.getErrorMessage(response));
      }
    } catch (err) {
      setError('Failed to fetch comments. Please try again later.');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiService.addComment(projectId, {
        content: newComment.trim(),
      });

      if (apiService.isSuccess(response)) {
        // Clear the input
        setNewComment('');
        // Refresh comments to show the new one
        await fetchComments();
      } else {
        setError(apiService.getErrorMessage(response));
      }
    } catch (err) {
      setError('Failed to add comment. Please try again.');
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-gray-400 text-gray-900"
          rows={3}
          disabled={submitting}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {submitting ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          // Loading state
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading comments...</p>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment: Comment) => (
            <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-900">Admin</span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{comment.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
