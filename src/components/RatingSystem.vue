<template>
  <div class="rating-system">
    <!-- Rating Display -->
    <div class="rating-display">
      <div class="rating-summary">
        <div class="average-rating">
          <span class="rating-number">{{ averageRating.toFixed(1) }}</span>
          <div class="stars-display">
            <i 
              v-for="star in 5" 
              :key="star"
              :class="['star', getStarClass(star, averageRating)]"
            ></i>
          </div>
          <span class="rating-count">({{ totalRatings }} {{ totalRatings === 1 ? 'rating' : 'ratings' }})</span>
        </div>
      </div>

      <!-- Rating Breakdown -->
      <div class="rating-breakdown" v-if="totalRatings > 0">
        <div v-for="stars in [5, 4, 3, 2, 1]" :key="stars" class="rating-bar">
          <span class="star-label">{{ stars }} star{{ stars > 1 ? 's' : '' }}</span>
          <div class="bar-container">
            <div 
              class="bar-fill" 
              :style="{ width: getPercentage(stars) + '%' }"
            ></div>
          </div>
          <span class="count">{{ getRatingCount(stars) }}</span>
        </div>
      </div>
    </div>

    <!-- User Rating Section -->
    <div class="user-rating" v-if="canRate">
      <h3>Rate this script</h3>
      <div class="rating-input">
        <div class="stars-input">
          <i 
            v-for="star in 5" 
            :key="star"
            :class="['star', 'interactive', { 
              filled: star <= hoveredRating || star <= userRating,
              hovered: star <= hoveredRating
            }]"
            @mouseover="hoveredRating = star"
            @mouseleave="hoveredRating = 0"
            @click="setRating(star)"
          ></i>
        </div>
        <span class="rating-text" v-if="hoveredRating || userRating">
          {{ getRatingText(hoveredRating || userRating) }}
        </span>
      </div>

      <!-- Review Text -->
      <div class="review-section" v-if="userRating > 0">
        <textarea 
          v-model="reviewText"
          placeholder="Write a review (optional)..."
          class="review-input"
          maxlength="500"
        ></textarea>
        <div class="review-actions">
          <span class="char-count">{{ reviewText.length }}/500</span>
          <div class="buttons">
            <button @click="cancelRating" class="cancel-btn" v-if="hasExistingRating">
              Cancel
            </button>
            <button @click="submitRating" class="submit-btn" :disabled="submitting">
              {{ submitting ? 'Submitting...' : (hasExistingRating ? 'Update' : 'Submit') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reviews List -->
    <div class="reviews-section" v-if="reviews.length > 0">
      <h3>Reviews</h3>
      <div class="reviews-list">
        <div v-for="review in reviews" :key="review.id" class="review-item">
          <div class="review-header">
            <div class="reviewer-info">
              <img :src="review.avatar || '/default-avatar.png'" :alt="review.username" class="reviewer-avatar">
              <div>
                <span class="reviewer-name">{{ review.username }}</span>
                <div class="review-rating">
                  <i 
                    v-for="star in 5" 
                    :key="star"
                    :class="['star', 'small', { filled: star <= review.rating }]"
                  ></i>
                </div>
              </div>
            </div>
            <span class="review-date">{{ formatDate(review.created_at) }}</span>
          </div>
          <div class="review-content" v-if="review.review_text">
            <p>{{ review.review_text }}</p>
          </div>
          <div class="review-actions" v-if="canModerate || isOwnReview(review)">
            <button @click="editReview(review)" v-if="isOwnReview(review)" class="edit-btn">
              Edit
            </button>
            <button @click="deleteReview(review.id)" class="delete-btn">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Load More Reviews -->
      <button 
        v-if="hasMoreReviews" 
        @click="loadMoreReviews" 
        class="load-more-btn"
        :disabled="loadingReviews"
      >
        {{ loadingReviews ? 'Loading...' : 'Load More Reviews' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';

export default {
  name: 'RatingSystem',
  props: {
    scriptId: {
      type: [Number, String],
      required: true
    },
    canRate: {
      type: Boolean,
      default: true
    },
    canModerate: {
      type: Boolean,
      default: false
    }
  },
  emits: ['rating-updated'],
  setup(props, { emit }) {
    const ratings = ref([]);
    const reviews = ref([]);
    const userRating = ref(0);
    const hoveredRating = ref(0);
    const reviewText = ref('');
    const submitting = ref(false);
    const loadingReviews = ref(false);
    const hasMoreReviews = ref(true);
    const reviewsPage = ref(1);
    const hasExistingRating = ref(false);
    const originalRating = ref(null);

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

    const averageRating = computed(() => {
      if (ratings.value.length === 0) return 0;
      const sum = ratings.value.reduce((acc, rating) => acc + rating.rating, 0);
      return sum / ratings.value.length;
    });

    const totalRatings = computed(() => ratings.value.length);

    const getRatingCount = (stars) => {
      return ratings.value.filter(r => r.rating === stars).length;
    };

    const getPercentage = (stars) => {
      if (totalRatings.value === 0) return 0;
      return (getRatingCount(stars) / totalRatings.value) * 100;
    };

    const getStarClass = (starNumber, rating) => {
      if (starNumber <= Math.floor(rating)) {
        return 'fas fa-star filled';
      } else if (starNumber - 0.5 <= rating) {
        return 'fas fa-star-half-alt half-filled';
      } else {
        return 'far fa-star empty';
      }
    };

    const getRatingText = (rating) => {
      const texts = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
      };
      return texts[rating] || '';
    };

    const fetchRatings = async () => {
      try {
        const response = await axios.get(`/api/scripts/${props.scriptId}/ratings`);
        ratings.value = response.data;
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };

    const fetchUserRating = async () => {
      if (!props.canRate) return;
      
      try {
        const response = await axios.get(
          `/api/scripts/${props.scriptId}/rating`,
          { headers: getAuthHeaders() }
        );
        
        if (response.data) {
          userRating.value = response.data.rating;
          reviewText.value = response.data.review_text || '';
          hasExistingRating.value = true;
          originalRating.value = { ...response.data };
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching user rating:', error);
        }
      }
    };

    const fetchReviews = async (page = 1) => {
      try {
        loadingReviews.value = true;
        const response = await axios.get(`/api/scripts/${props.scriptId}/reviews`, {
          params: { page, limit: 10 }
        });
        
        if (page === 1) {
          reviews.value = response.data.reviews;
        } else {
          reviews.value.push(...response.data.reviews);
        }
        
        hasMoreReviews.value = response.data.reviews.length === 10;
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        loadingReviews.value = false;
      }
    };

    const setRating = (rating) => {
      userRating.value = rating;
    };

    const submitRating = async () => {
      if (userRating.value === 0) return;
      
      try {
        submitting.value = true;
        
        const data = {
          rating: userRating.value,
          review_text: reviewText.value.trim() || null
        };

        if (hasExistingRating.value) {
          await axios.put(
            `/api/scripts/${props.scriptId}/rating`,
            data,
            { headers: getAuthHeaders() }
          );
        } else {
          await axios.post(
            `/api/scripts/${props.scriptId}/rating`,
            data,
            { headers: getAuthHeaders() }
          );
          hasExistingRating.value = true;
        }

        // Refresh data
        await Promise.all([
          fetchRatings(),
          fetchReviews(1)
        ]);
        
        emit('rating-updated', {
          rating: userRating.value,
          averageRating: averageRating.value,
          totalRatings: totalRatings.value
        });

      } catch (error) {
        console.error('Error submitting rating:', error);
        alert('Error submitting rating. Please try again.');
      } finally {
        submitting.value = false;
      }
    };

    const cancelRating = () => {
      if (originalRating.value) {
        userRating.value = originalRating.value.rating;
        reviewText.value = originalRating.value.review_text || '';
      } else {
        userRating.value = 0;
        reviewText.value = '';
      }
    };

    const loadMoreReviews = () => {
      reviewsPage.value++;
      fetchReviews(reviewsPage.value);
    };

    const isOwnReview = (review) => {
      const currentUser = getCurrentUser();
      return currentUser && currentUser.discord_id === review.user_id;
    };

    const editReview = (review) => {
      userRating.value = review.rating;
      reviewText.value = review.review_text || '';
      // Scroll to rating section
      document.querySelector('.user-rating')?.scrollIntoView({ behavior: 'smooth' });
    };

    const deleteReview = async (reviewId) => {
      if (!confirm('Are you sure you want to delete this review?')) return;
      
      try {
        await axios.delete(
          `/api/reviews/${reviewId}`,
          { headers: getAuthHeaders() }
        );
        
        reviews.value = reviews.value.filter(r => r.id !== reviewId);
        
        // If it's the user's own review, reset the rating
        const currentUser = getCurrentUser();
        const deletedReview = reviews.value.find(r => r.id === reviewId);
        if (deletedReview && currentUser?.discord_id === deletedReview.user_id) {
          userRating.value = 0;
          reviewText.value = '';
          hasExistingRating.value = false;
        }
        
        await fetchRatings();
        
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Error deleting review. Please try again.');
      }
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString();
    };

    const loadData = async () => {
      await Promise.all([
        fetchRatings(),
        fetchUserRating(),
        fetchReviews(1)
      ]);
    };

    // Watch for script ID changes
    watch(() => props.scriptId, () => {
      ratings.value = [];
      reviews.value = [];
      userRating.value = 0;
      reviewText.value = '';
      hasExistingRating.value = false;
      reviewsPage.value = 1;
      loadData();
    });

    onMounted(() => {
      loadData();
    });

    return {
      ratings,
      reviews,
      userRating,
      hoveredRating,
      reviewText,
      submitting,
      loadingReviews,
      hasMoreReviews,
      hasExistingRating,
      averageRating,
      totalRatings,
      getRatingCount,
      getPercentage,
      getStarClass,
      getRatingText,
      setRating,
      submitRating,
      cancelRating,
      loadMoreReviews,
      isOwnReview,
      editReview,
      deleteReview,
      formatDate
    };
  }
};
</script>

<style scoped>
.rating-system {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid var(--border-color);
  margin: 20px 0;
}

.rating-display {
  margin-bottom: 30px;
}

.rating-summary {
  text-align: center;
  margin-bottom: 25px;
}

.average-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.rating-number {
  font-size: 3rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stars-display {
  display: flex;
  gap: 5px;
}

.star {
  font-size: 1.5rem;
  color: #ddd;
  transition: color 0.3s ease;
}

.star.filled {
  color: #ffd700;
}

.star.half-filled {
  color: #ffd700;
}

.star.small {
  font-size: 1rem;
}

.rating-count {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.rating-breakdown {
  max-width: 400px;
  margin: 0 auto;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
}

.star-label {
  width: 60px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.bar-container {
  flex: 1;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.count {
  width: 30px;
  text-align: right;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.user-rating {
  border-top: 1px solid var(--border-color);
  padding-top: 25px;
  margin-top: 25px;
}

.user-rating h3 {
  margin: 0 0 15px 0;
  color: var(--text-color);
}

.rating-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.stars-input {
  display: flex;
  gap: 5px;
}

.star.interactive {
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.star.interactive:hover {
  transform: scale(1.1);
}

.star.interactive.hovered {
  color: #ffed4a;
}

.star.interactive.filled {
  color: #ffd700;
}

.rating-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-color);
}

.review-section {
  margin-top: 20px;
}

.review-input {
  width: 100%;
  min-height: 100px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}

.review-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.review-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.char-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.buttons {
  display: flex;
  gap: 10px;
}

.cancel-btn, .submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: var(--border-color);
  color: var(--text-color);
}

.cancel-btn:hover {
  background: var(--hover-bg);
}

.submit-btn {
  background: var(--primary-color);
  color: white;
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

.reviews-section {
  border-top: 1px solid var(--border-color);
  padding-top: 25px;
  margin-top: 25px;
}

.reviews-section h3 {
  margin: 0 0 20px 0;
  color: var(--text-color);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  padding: 20px;
  background: var(--hover-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.reviewer-info {
  display: flex;
  gap: 10px;
  align-items: center;
}

.reviewer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.reviewer-name {
  font-weight: 600;
  color: var(--text-color);
  display: block;
  margin-bottom: 5px;
}

.review-rating {
  display: flex;
  gap: 2px;
}

.review-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.review-content p {
  margin: 0;
  color: var(--text-color);
  line-height: 1.5;
}

.review-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.edit-btn, .delete-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.edit-btn {
  background: var(--primary-color);
  color: white;
}

.edit-btn:hover {
  background: var(--primary-hover);
}

.delete-btn {
  background: var(--error-color);
  color: white;
}

.delete-btn:hover {
  background: var(--error-hover);
}

.load-more-btn {
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .rating-system {
    padding: 20px;
  }

  .rating-number {
    font-size: 2.5rem;
  }

  .rating-bar {
    gap: 10px;
  }

  .star-label {
    width: 50px;
    font-size: 0.8rem;
  }

  .review-header {
    flex-direction: column;
    gap: 10px;
  }

  .review-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
