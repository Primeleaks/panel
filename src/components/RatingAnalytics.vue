<template>
  <div class="rating-analytics">
    <h3 class="section-title">Rating Analytics</h3>
    
    <div class="analytics-cards">
      <div class="analytics-card">
        <div class="analytics-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="analytics-data">
          <div class="analytics-value">{{ averageRating.toFixed(1) }}</div>
          <div class="analytics-label">Average Rating</div>
        </div>
      </div>
      
      <div class="analytics-card">
        <div class="analytics-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="analytics-data">
          <div class="analytics-value">{{ totalRatings }}</div>
          <div class="analytics-label">Total Reviews</div>
        </div>
      </div>
      
      <div class="analytics-card">
        <div class="analytics-icon">
          <i class="fas fa-star"></i>
        </div>
        <div class="analytics-data">
          <div class="analytics-value">{{ popularStarRating }}</div>
          <div class="analytics-label">Most Common Rating</div>
        </div>
      </div>
    </div>
    
    <div class="rating-trend">
      <h4>Rating Trend</h4>
      <canvas ref="ratingTrendChart" height="200"></canvas>
    </div>
    
    <div class="rating-distribution">
      <h4>Rating Distribution</h4>
      <canvas ref="ratingDistributionChart" height="200"></canvas>
    </div>
    
    <div class="recent-reviews">
      <h4>Recent Reviews</h4>
      <div v-if="loading" class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i> Loading...
      </div>
      <div v-else-if="recentReviews.length === 0" class="empty-state">
        No reviews yet
      </div>
      <div v-else class="review-list">
        <div v-for="review in recentReviews" :key="review.id" class="review-item">
          <div class="review-header">
            <div class="reviewer-info">
              <img :src="review.user_avatar || '/default-avatar.png'" :alt="review.username" class="reviewer-avatar">
              <span class="reviewer-name">{{ review.username }}</span>
            </div>
            <div class="review-rating">
              <i v-for="star in 5" :key="star" 
                 :class="['star', star <= review.rating ? 'filled' : '']"></i>
              <span class="review-date">{{ formatDate(review.created_at) }}</span>
            </div>
          </div>
          <div v-if="review.review" class="review-content">
            {{ review.review }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import Chart from 'chart.js/auto';

export default {
  props: {
    scriptId: {
      type: [Number, String],
      required: true
    }
  },
  
  setup(props) {
    const loading = ref(true);
    const ratings = ref([]);
    const recentReviews = ref([]);
    const ratingTrendChart = ref(null);
    const ratingDistributionChart = ref(null);
    const chartInstances = ref({
      trend: null,
      distribution: null
    });
    
    const averageRating = computed(() => {
      if (ratings.value.length === 0) return 0;
      const sum = ratings.value.reduce((acc, rating) => acc + rating.rating, 0);
      return sum / ratings.value.length;
    });
    
    const totalRatings = computed(() => ratings.value.length);
    
    const popularStarRating = computed(() => {
      if (ratings.value.length === 0) return 0;
      
      // Count occurrences of each rating
      const counts = {};
      ratings.value.forEach(rating => {
        counts[rating.rating] = (counts[rating.rating] || 0) + 1;
      });
      
      // Find the most common rating
      let mostCommon = 0;
      let highestCount = 0;
      
      Object.entries(counts).forEach(([rating, count]) => {
        if (count > highestCount) {
          highestCount = count;
          mostCommon = rating;
        }
      });
      
      return mostCommon;
    });
    
    const fetchRatings = async () => {
      try {
        loading.value = true;
        const response = await axios.get(`/api/scripts/${props.scriptId}/ratings`);
        ratings.value = response.data.ratings || [];
        recentReviews.value = response.data.ratings
          .filter(rating => rating.review) // Only get ratings with reviews
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by newest
          .slice(0, 5); // Get only 5 most recent
      } catch (error) {
        console.error('Error fetching ratings:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const initCharts = () => {
      if (chartInstances.value.trend) {
        chartInstances.value.trend.destroy();
      }
      if (chartInstances.value.distribution) {
        chartInstances.value.distribution.destroy();
      }
      
      // Prepare data for trend chart (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Group ratings by date
      const ratingsByDate = {};
      const dates = [];
      
      // Initialize all dates in the last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        dates.push(dateString);
        ratingsByDate[dateString] = { sum: 0, count: 0 };
      }
      
      // Fill in actual ratings
      ratings.value.forEach(rating => {
        const dateString = new Date(rating.created_at).toISOString().split('T')[0];
        if (ratingsByDate[dateString]) {
          ratingsByDate[dateString].sum += rating.rating;
          ratingsByDate[dateString].count++;
        }
      });
      
      // Calculate averages and prepare data for chart
      const trendData = dates.map(date => {
        return {
          date,
          average: ratingsByDate[date].count > 0 
            ? ratingsByDate[date].sum / ratingsByDate[date].count 
            : null
        };
      });
      
      // Create trend chart
      const trendCtx = ratingTrendChart.value.getContext('2d');
      chartInstances.value.trend = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: trendData.map(item => item.date),
          datasets: [{
            label: 'Average Rating',
            data: trendData.map(item => item.average),
            fill: false,
            borderColor: '#4A90E2',
            tension: 0.1,
            pointBackgroundColor: '#4A90E2'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              min: 0,
              max: 5,
              title: {
                display: true,
                text: 'Rating'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: function(tooltipItems) {
                  return new Date(tooltipItems[0].label).toLocaleDateString();
                }
              }
            }
          }
        }
      });
      
      // Prepare data for distribution chart
      const distribution = [0, 0, 0, 0, 0]; // Counts for 1-5 stars
      
      ratings.value.forEach(rating => {
        distribution[rating.rating - 1]++;
      });
      
      // Create distribution chart
      const distCtx = ratingDistributionChart.value.getContext('2d');
      chartInstances.value.distribution = new Chart(distCtx, {
        type: 'bar',
        data: {
          labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
          datasets: [{
            label: 'Number of Ratings',
            data: distribution,
            backgroundColor: [
              '#FF6B6B', // Red for 1 star
              '#FFB347', // Orange for 2 stars
              '#FFDD67', // Yellow for 3 stars
              '#ACE1AF', // Light green for 4 stars
              '#77DD77'  // Green for 5 stars
            ]
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Ratings'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    // Watch for script ID changes
    watch(() => props.scriptId, () => {
      fetchRatings();
    });
    
    onMounted(() => {
      fetchRatings().then(() => {
        initCharts();
      });
    });
    
    return {
      loading,
      recentReviews,
      ratingTrendChart,
      ratingDistributionChart,
      averageRating,
      totalRatings,
      popularStarRating,
      formatDate
    };
  }
};
</script>

<style scoped>
.rating-analytics {
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 1.5rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.analytics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.analytics-card {
  background-color: var(--card-bg-alt);
  border-radius: var(--border-radius-sm);
  padding: 1rem;
  display: flex;
  align-items: center;
}

.analytics-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: rgba(var(--primary-color-rgb), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.analytics-icon i {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.analytics-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.2;
}

.analytics-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.rating-trend, .rating-distribution {
  margin-bottom: 2rem;
}

.rating-trend h4, .rating-distribution h4, .recent-reviews h4 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.loading-spinner {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  background-color: var(--card-bg-alt);
  border-radius: var(--border-radius-sm);
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  background-color: var(--card-bg-alt);
  border-radius: var(--border-radius-sm);
  padding: 1rem;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reviewer-info {
  display: flex;
  align-items: center;
}

.reviewer-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.5rem;
}

.reviewer-name {
  font-weight: 500;
  color: var(--text-color);
}

.review-rating {
  display: flex;
  align-items: center;
}

.star {
  color: var(--text-muted);
  margin-right: 2px;
}

.star.filled {
  color: var(--star-color, #FFB400);
}

.review-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.review-content {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .analytics-cards {
    grid-template-columns: 1fr;
  }
  
  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .review-rating {
    margin-top: 0.5rem;
  }
}
</style>
