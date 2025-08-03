<template>
  <div class="comment-system">
    <div class="comments-header">
      <h3>Comments ({{ totalComments }})</h3>
      <div class="sort-options">
        <select v-model="sortBy" @change="fetchComments(true)" class="sort-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most_liked">Most Liked</option>
        </select>
      </div>
    </div>

    <!-- Add Comment Form -->
    <div class="comment-form" v-if="canComment">
      <div class="comment-input-container">
        <textarea 
          v-model="newComment"
          placeholder="Write a comment..."
          class="comment-input"
          rows="3"
          maxlength="1000"
          @keydown.ctrl.enter="submitComment"
        ></textarea>
        <div class="comment-actions">
          <span class="char-count">{{ newComment.length }}/1000</span>
          <button 
            @click="submitComment" 
            :disabled="!newComment.trim() || submitting"
            class="submit-btn"
          >
            {{ submitting ? 'Posting...' : 'Post Comment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Comments List -->
    <div class="comments-list" v-if="comments.length > 0">
      <div 
        v-for="comment in comments" 
        :key="comment.id" 
        class="comment-item"
        :class="{ highlighted: highlightedCommentId === comment.id }"
      >
        <div class="comment-avatar">
          <img :src="comment.avatar || '/default-avatar.png'" :alt="comment.username">
        </div>
        
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-author">{{ comment.username }}</span>
            <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
            <span v-if="comment.updated_at !== comment.created_at" class="comment-edited">
              (edited {{ formatDate(comment.updated_at) }})
            </span>
          </div>
          
          <div class="comment-body">
            <p v-if="editingCommentId !== comment.id">{{ comment.content }}</p>
            <div v-else class="edit-form">
              <textarea 
                v-model="editContent"
                class="edit-input"
                rows="3"
                maxlength="1000"
              ></textarea>
              <div class="edit-actions">
                <button @click="cancelEdit" class="cancel-btn">Cancel</button>
                <button @click="saveEdit(comment.id)" class="save-btn">Save</button>
              </div>
            </div>
          </div>

          <div class="comment-footer">
            <div class="comment-interactions">
              <button 
                @click="toggleLike(comment.id)"
                :class="['like-btn', { liked: comment.user_liked }]"
                :disabled="!canInteract"
              >
                <i class="fas fa-heart"></i>
                {{ comment.likes_count || 0 }}
              </button>
              
              <button 
                @click="toggleReplyForm(comment.id)"
                class="reply-btn"
                v-if="canComment"
              >
                <i class="fas fa-reply"></i>
                Reply
              </button>
            </div>

            <div class="comment-actions" v-if="canModerateComment(comment) || isOwnComment(comment)">
              <button 
                v-if="isOwnComment(comment)"
                @click="startEdit(comment)"
                class="edit-btn"
              >
                <i class="fas fa-edit"></i>
              </button>
              
              <button 
                @click="deleteComment(comment.id)"
                class="delete-btn"
              >
                <i class="fas fa-trash"></i>
              </button>
              
              <button 
                v-if="canModerateComment(comment) && !isOwnComment(comment)"
                @click="reportComment(comment.id)"
                class="report-btn"
              >
                <i class="fas fa-flag"></i>
              </button>
            </div>
          </div>

          <!-- Reply Form -->
          <div v-if="replyingToId === comment.id" class="reply-form">
            <textarea 
              v-model="replyContent"
              placeholder="Write a reply..."
              class="reply-input"
              rows="2"
              maxlength="1000"
            ></textarea>
            <div class="reply-actions">
              <button @click="cancelReply" class="cancel-btn">Cancel</button>
              <button 
                @click="submitReply(comment.id)"
                :disabled="!replyContent.trim() || submittingReply"
                class="submit-btn"
              >
                {{ submittingReply ? 'Posting...' : 'Post Reply' }}
              </button>
            </div>
          </div>

          <!-- Replies -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies">
            <div 
              v-for="reply in comment.replies" 
              :key="reply.id" 
              class="reply-item"
            >
              <div class="reply-avatar">
                <img :src="reply.avatar || '/default-avatar.png'" :alt="reply.username">
              </div>
              
              <div class="reply-content">
                <div class="reply-header">
                  <span class="reply-author">{{ reply.username }}</span>
                  <span class="reply-date">{{ formatDate(reply.created_at) }}</span>
                </div>
                
                <div class="reply-body">
                  <p>{{ reply.content }}</p>
                </div>

                <div class="reply-footer">
                  <div class="reply-interactions">
                    <button 
                      @click="toggleLike(reply.id, true)"
                      :class="['like-btn', { liked: reply.user_liked }]"
                      :disabled="!canInteract"
                    >
                      <i class="fas fa-heart"></i>
                      {{ reply.likes_count || 0 }}
                    </button>
                  </div>

                  <div class="reply-actions" v-if="canModerateComment(reply) || isOwnComment(reply)">
                    <button 
                      @click="deleteComment(reply.id, true)"
                      class="delete-btn"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Load More Replies -->
          <button 
            v-if="comment.replies_count > (comment.replies?.length || 0)"
            @click="loadReplies(comment.id)"
            class="load-replies-btn"
          >
            Load {{ comment.replies_count - (comment.replies?.length || 0) }} more replies
          </button>
        </div>
      </div>
    </div>

    <!-- Load More Comments -->
    <div class="load-more" v-if="hasMoreComments">
      <button 
        @click="loadMoreComments"
        :disabled="loadingComments"
        class="load-more-btn"
      >
        {{ loadingComments ? 'Loading...' : 'Load More Comments' }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="comments.length === 0 && !loadingComments" class="empty-state">
      <i class="fas fa-comments"></i>
      <p>No comments yet. Be the first to share your thoughts!</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';

export default {
  name: 'CommentSystem',
  props: {
    scriptId: {
      type: [Number, String],
      required: true
    },
    canComment: {
      type: Boolean,
      default: true
    },
    canModerate: {
      type: Boolean,
      default: false
    }
  },
  emits: ['comment-added', 'comment-deleted'],
  setup(props, { emit }) {
    const comments = ref([]);
    const newComment = ref('');
    const replyContent = ref('');
    const editContent = ref('');
    const submitting = ref(false);
    const submittingReply = ref(false);
    const loadingComments = ref(false);
    const sortBy = ref('newest');
    const currentPage = ref(1);
    const hasMoreComments = ref(true);
    const totalComments = ref(0);
    const replyingToId = ref(null);
    const editingCommentId = ref(null);
    const highlightedCommentId = ref(null);

    const getCookie = (name) => {
      const cookies = document.cookie.split('; ');
      const cookie = cookies.find(row => row.startsWith(`${name}=`));
      return cookie ? cookie.split('=')[1] : null;
    };

    const getAuthHeaders = () => {
      const token = getCookie('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const getCurrentUser = () => {
      const token = getCookie('token');
      if (!token) return null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch {
        return null;
      }
    };

    const canInteract = computed(() => {
      return getCurrentUser() !== null;
    });

    const fetchComments = async (reset = false) => {
      try {
        loadingComments.value = true;
        const page = reset ? 1 : currentPage.value;
        
        const response = await axios.get(`/api/scripts/${props.scriptId}/comments`, {
          params: { 
            page, 
            limit: 10,
            sort: sortBy.value
          },
          headers: getAuthHeaders()
        });

        if (reset) {
          comments.value = response.data.comments;
          currentPage.value = 1;
        } else {
          comments.value.push(...response.data.comments);
        }
        
        hasMoreComments.value = response.data.comments.length === 10;
        totalComments.value = response.data.total;
        
        if (!reset) {
          currentPage.value++;
        }
        
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        loadingComments.value = false;
      }
    };

    const submitComment = async () => {
      if (!newComment.value.trim()) return;
      
      try {
        submitting.value = true;
        
        const response = await axios.post(
          `/api/scripts/${props.scriptId}/comments`,
          { content: newComment.value.trim() },
          { headers: getAuthHeaders() }
        );

        // Add new comment to the beginning of the list
        comments.value.unshift(response.data);
        totalComments.value++;
        newComment.value = '';
        
        emit('comment-added', response.data);
        
      } catch (error) {
        console.error('Error posting comment:', error);
        alert('Error posting comment. Please try again.');
      } finally {
        submitting.value = false;
      }
    };

    const submitReply = async (parentId) => {
      if (!replyContent.value.trim()) return;
      
      try {
        submittingReply.value = true;
        
        const response = await axios.post(
          `/api/comments/${parentId}/replies`,
          { content: replyContent.value.trim() },
          { headers: getAuthHeaders() }
        );

        // Find parent comment and add reply
        const parentComment = comments.value.find(c => c.id === parentId);
        if (parentComment) {
          if (!parentComment.replies) {
            parentComment.replies = [];
          }
          parentComment.replies.push(response.data);
          parentComment.replies_count = (parentComment.replies_count || 0) + 1;
        }

        replyContent.value = '';
        replyingToId.value = null;
        totalComments.value++;
        
      } catch (error) {
        console.error('Error posting reply:', error);
        alert('Error posting reply. Please try again.');
      } finally {
        submittingReply.value = false;
      }
    };

    const toggleLike = async (commentId, isReply = false) => {
      try {
        const response = await axios.post(
          `/api/comments/${commentId}/like`,
          {},
          { headers: getAuthHeaders() }
        );

        // Update the comment/reply in the local state
        if (isReply) {
          // Find the reply in nested structure
          for (const comment of comments.value) {
            if (comment.replies) {
              const reply = comment.replies.find(r => r.id === commentId);
              if (reply) {
                reply.user_liked = response.data.liked;
                reply.likes_count = response.data.likes_count;
                break;
              }
            }
          }
        } else {
          const comment = comments.value.find(c => c.id === commentId);
          if (comment) {
            comment.user_liked = response.data.liked;
            comment.likes_count = response.data.likes_count;
          }
        }
        
      } catch (error) {
        console.error('Error toggling like:', error);
      }
    };

    const deleteComment = async (commentId, isReply = false) => {
      if (!confirm('Are you sure you want to delete this comment?')) return;
      
      try {
        await axios.delete(
          `/api/comments/${commentId}`,
          { headers: getAuthHeaders() }
        );

        if (isReply) {
          // Remove reply from nested structure
          for (const comment of comments.value) {
            if (comment.replies) {
              const replyIndex = comment.replies.findIndex(r => r.id === commentId);
              if (replyIndex !== -1) {
                comment.replies.splice(replyIndex, 1);
                comment.replies_count = Math.max(0, (comment.replies_count || 0) - 1);
                break;
              }
            }
          }
        } else {
          // Remove main comment
          const commentIndex = comments.value.findIndex(c => c.id === commentId);
          if (commentIndex !== -1) {
            comments.value.splice(commentIndex, 1);
          }
        }
        
        totalComments.value = Math.max(0, totalComments.value - 1);
        emit('comment-deleted', commentId);
        
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment. Please try again.');
      }
    };

    const startEdit = (comment) => {
      editingCommentId.value = comment.id;
      editContent.value = comment.content;
    };

    const saveEdit = async (commentId) => {
      if (!editContent.value.trim()) return;
      
      try {
        const response = await axios.put(
          `/api/comments/${commentId}`,
          { content: editContent.value.trim() },
          { headers: getAuthHeaders() }
        );

        const comment = comments.value.find(c => c.id === commentId);
        if (comment) {
          comment.content = response.data.content;
          comment.updated_at = response.data.updated_at;
        }

        cancelEdit();
        
      } catch (error) {
        console.error('Error updating comment:', error);
        alert('Error updating comment. Please try again.');
      }
    };

    const cancelEdit = () => {
      editingCommentId.value = null;
      editContent.value = '';
    };

    const toggleReplyForm = (commentId) => {
      replyingToId.value = replyingToId.value === commentId ? null : commentId;
      replyContent.value = '';
    };

    const cancelReply = () => {
      replyingToId.value = null;
      replyContent.value = '';
    };

    const loadReplies = async (commentId) => {
      try {
        const comment = comments.value.find(c => c.id === commentId);
        const offset = comment.replies?.length || 0;
        
        const response = await axios.get(
          `/api/comments/${commentId}/replies`,
          {
            params: { offset, limit: 10 },
            headers: getAuthHeaders()
          }
        );

        if (comment) {
          if (!comment.replies) {
            comment.replies = [];
          }
          comment.replies.push(...response.data);
        }
        
      } catch (error) {
        console.error('Error loading replies:', error);
      }
    };

    const loadMoreComments = () => {
      fetchComments();
    };

    const reportComment = async (commentId) => {
      const reason = prompt('Please provide a reason for reporting this comment:');
      if (!reason?.trim()) return;
      
      try {
        await axios.post(
          `/api/comments/${commentId}/report`,
          { reason: reason.trim() },
          { headers: getAuthHeaders() }
        );
        
        alert('Comment reported successfully. Thank you for helping keep our community safe.');
        
      } catch (error) {
        console.error('Error reporting comment:', error);
        alert('Error submitting report. Please try again.');
      }
    };

    const isOwnComment = (comment) => {
      const currentUser = getCurrentUser();
      return currentUser && currentUser.discord_id === comment.user_id;
    };

    const canModerateComment = (comment) => {
      return props.canModerate;
    };

    const formatDate = (date) => {
      const now = new Date();
      const commentDate = new Date(date);
      const diffInMinutes = Math.floor((now - commentDate) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return commentDate.toLocaleDateString();
    };

    // Watch for script ID changes
    watch(() => props.scriptId, () => {
      comments.value = [];
      currentPage.value = 1;
      hasMoreComments.value = true;
      totalComments.value = 0;
      fetchComments(true);
    });

    onMounted(() => {
      fetchComments(true);
    });

    return {
      comments,
      newComment,
      replyContent,
      editContent,
      submitting,
      submittingReply,
      loadingComments,
      sortBy,
      hasMoreComments,
      totalComments,
      replyingToId,
      editingCommentId,
      highlightedCommentId,
      canInteract,
      fetchComments,
      submitComment,
      submitReply,
      toggleLike,
      deleteComment,
      startEdit,
      saveEdit,
      cancelEdit,
      toggleReplyForm,
      cancelReply,
      loadReplies,
      loadMoreComments,
      reportComment,
      isOwnComment,
      canModerateComment,
      formatDate
    };
  }
};
</script>

<style scoped>
.comment-system {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid var(--border-color);
  margin: 20px 0;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.comments-header h3 {
  margin: 0;
  color: var(--text-color);
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 0.9rem;
}

.comment-form {
  margin-bottom: 30px;
}

.comment-input-container {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  padding: 15px;
}

.comment-input {
  width: 100%;
  border: none;
  background: none;
  color: var(--text-color);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  outline: none;
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.char-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.submit-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: var(--hover-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.comment-item.highlighted {
  border-color: var(--primary-color);
  background: rgba(74, 144, 226, 0.1);
}

.comment-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-author {
  font-weight: 600;
  color: var(--text-color);
}

.comment-date, .comment-edited {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.comment-body p {
  margin: 0 0 15px 0;
  color: var(--text-color);
  line-height: 1.5;
  word-wrap: break-word;
}

.edit-form {
  margin-bottom: 15px;
}

.edit-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-color);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  margin-bottom: 10px;
}

.edit-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn, .save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: var(--border-color);
  color: var(--text-color);
}

.save-btn {
  background: var(--primary-color);
  color: white;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-interactions {
  display: flex;
  gap: 15px;
}

.like-btn, .reply-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.like-btn:hover, .reply-btn:hover {
  color: var(--text-color);
  background: var(--border-color);
}

.like-btn.liked {
  color: var(--error-color);
}

.comment-actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn, .report-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  color: var(--primary-color);
}

.delete-btn:hover {
  color: var(--error-color);
}

.report-btn:hover {
  color: var(--warning-color);
}

.reply-form {
  margin-top: 15px;
  padding: 15px;
  background: var(--card-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.reply-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-color);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  margin-bottom: 10px;
}

.reply-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.replies {
  margin-top: 15px;
  padding-left: 20px;
  border-left: 2px solid var(--border-color);
}

.reply-item {
  display: flex;
  gap: 10px;
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color);
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.reply-author {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.reply-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.reply-body p {
  margin: 0 0 10px 0;
  color: var(--text-color);
  font-size: 0.9rem;
  line-height: 1.4;
}

.reply-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reply-interactions .like-btn {
  font-size: 0.8rem;
  padding: 3px 8px;
}

.load-replies-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 10px 0;
  text-decoration: underline;
}

.load-more {
  text-align: center;
  margin-top: 25px;
}

.load-more-btn {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .comment-system {
    padding: 20px;
  }

  .comments-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .comment-item {
    padding: 15px;
  }

  .comment-footer {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .comment-interactions {
    justify-content: center;
  }

  .comment-actions {
    justify-content: center;
  }
}
</style>
