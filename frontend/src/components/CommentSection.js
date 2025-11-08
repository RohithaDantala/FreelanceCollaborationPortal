import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

const CommentSection = ({ projectId, taskId = null, fileId = null }) => {
  const { user } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ useCallback to memoize the function
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (projectId) params.append('project', projectId);
      if (taskId) params.append('task', taskId);
      if (fileId) params.append('file', fileId);

      const response = await api.get(`/comments?${params.toString()}`);
      setComments(response.data.data.comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, taskId, fileId]); // dependencies

  // ✅ useEffect now depends only on fetchComments
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post('/comments', {
        content: newComment,
        project: projectId,
        task: taskId,
        file: fileId,
        parentComment: replyTo,
      });
      setNewComment('');
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      alert('Failed to post comment');
    }
  };

  const handleUpdate = async (commentId) => {
    try {
      await api.put(`/comments/${commentId}`, { content: editContent });
      setEditingComment(null);
      setEditContent('');
      fetchComments();
    } catch (error) {
      alert('Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await api.delete(`/comments/${commentId}`);
        fetchComments();
      } catch (error) {
        alert('Failed to delete comment');
      }
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentComment);
  const getReplies = (commentId) => comments.filter((c) => c.parentComment?._id === commentId);

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`${isReply ? 'ml-8 mt-3' : 'mb-4'} p-4 bg-gray-50 rounded-lg`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 text-xs font-semibold">
              {comment.author?.firstName?.charAt(0)}
              {comment.author?.lastName?.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-800">
              {comment.author?.firstName} {comment.author?.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
              {comment.isEdited && <span className="ml-2">(edited)</span>}
            </p>
          </div>
        </div>
        {comment.author?._id === user.id && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingComment(comment._id);
                setEditContent(comment.content);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(comment._id)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editingComment === comment._id ? (
        <div className="mt-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="3"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleUpdate(comment._id)}
              className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingComment(null);
                setEditContent('');
              }}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          {!isReply && (
            <button
              onClick={() => setReplyTo(comment._id)}
              className="text-primary-600 hover:text-primary-700 text-sm mt-2"
            >
              Reply
            </button>
          )}
        </>
      )}

      {!isReply && getReplies(comment._id).map((reply) => (
        <CommentItem key={reply._id} comment={reply} isReply={true} />
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        💬 Comments ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        {replyTo && (
          <div className="mb-2 p-2 bg-blue-50 rounded flex items-center justify-between">
            <span className="text-sm text-blue-800">Replying to comment...</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          rows="3"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          Post Comment
        </button>
      </form>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : topLevelComments.length > 0 ? (
        <div>
          {topLevelComments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
};

export default CommentSection;
