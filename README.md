# Script Panel - Comprehensive Script Sharing Platform

A modern, feature-rich script sharing platform built with Vue.js 3 and Express.js, featuring real-time capabilities, social features, advanced moderation, and Progressive Web App (PWA) support.

## 🚀 Features

### Core Features
- **User Profiles & Settings**: Comprehensive user management
  - Profile page with Discord info and statistics
  - User settings (notifications, privacy options)
  - Profile customization (bio, status, avatar)
  - Personal statistics dashboard
- **Script Management**: Upload, organize, and share scripts with comprehensive metadata
  - Script versioning with version history
  - Script statistics (download counts, popularity metrics)
  - Tags and advanced categorization
  - Script bookmarks/favorites with organization features
- **User Authentication**: Secure Discord OAuth integration with JWT tokens
- **Real-time Communication**: WebSocket-powered notifications and live updates
- **Progressive Web App**: Offline functionality and installable app experience
- **Responsive Design**: Mobile-first design with light/dark theme system

### Social Features
- **User Profiles**: Comprehensive user profiles with activity feeds and statistics
  - Customizable profile with bio and status
  - Personal statistics dashboard
  - Script portfolio and activity timeline
  - Public/private visibility settings
- **Follow System**: Follow users and get notified of their activities
  - Followers/following lists and activity feeds
  - Personalized content recommendations
  - Activity feed showing recent uploads, updates, and interactions
- **Rating & Reviews**: 5-star rating system with detailed reviews
  - Verified reviewer badges for trusted feedback
  - Helpful review voting system
  - Rating analytics and trends
- **Comment System**: Nested comments with real-time updates and moderation
  - Rich text formatting with code highlighting
  - Comment threading for detailed discussions
  - Real-time updates and notifications
- **Collections**: Organize scripts into public/private collections
  - Featured collections on homepage
  - Collection sharing and collaboration
  - Themed organization for better discovery
- **Bookmarks**: Save and organize favorite scripts
  - Quick access to saved content
  - Custom bookmark folders and organization
  - Cross-device synchronization

### Advanced Features
- **Real-time Notifications System**: Live notifications for all user interactions
  - In-app notification center with read/unread status
  - Discord webhook integration
  - Optional email notifications
  - Custom notification preferences
  - Real-time WebSocket updates
- **Advanced Search & Discovery**: Full-text search with filters and sorting options
  - Filters by author, date, category, and tags
  - Search history for logged-in users
  - Trending and recently updated sections
  - Saved searches functionality
  - Recently updated scripts section
- **Analytics & Insights**: Comprehensive analytics for users and administrators
  - Script performance metrics
  - User engagement statistics
  - Trending content analysis
  - Download and usage patterns
- **Moderation System**: Report system, user strikes, and administrative controls
  - Automated content filtering
  - Report queue for problematic content
  - Strike system for repeat offenders
  - Audit logs for all administrative actions
  - Moderation queue for reported content
- **Theme Management**: Light/dark/auto themes with CSS custom properties
  - Theme preference persistence
  - Custom accent color options
  - High contrast accessibility mode
  - Theme switcher with preview
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
  - Keyboard shortcuts for power users
  - Screen reader optimized interface
  - Focus management and navigation helpers
  - High contrast and reduced motion options

### Enhanced Admin Dashboard
- **Analytics Dashboard**: Comprehensive analytics with visual charts
  - User growth over time
  - Script uploads and engagement metrics
  - System health monitoring
  - Conversion and retention metrics
- **Content Management**: Advanced content management tools
  - Bulk operations (approve/reject scripts)
  - Content filtering and moderation
  - Featured content management
  - Version control and rollback
- **User Management**: Complete user administration
  - Promote/demote admin users
  - User activity monitoring
  - Strike system management
  - Manual verification system
- **System Administration**: Platform management tools
  - Audit logs for all admin actions
  - System health monitoring
  - Configuration management
  - Backup and restore functionality

### Script Execution & Testing
- **Online Code Editor**: Preview and edit scripts directly in browser
- **Syntax Highlighting**: Support for multiple script languages
- **Execution Sandbox**: Safely test scripts in isolated environment
- **Version Comparison**: Side-by-side diff view of script versions
- **Script Validation**: Automated testing and validation

### Enhanced User Experience
- **Progressive Web App**: Full PWA capabilities
  - Offline functionality and caching
  - Push notifications support
  - Home screen installation
  - Native app-like experience
- **Responsive Interface**: Optimized for all devices
  - Mobile-first design approach
  - Adaptive layouts and components
  - Touch-optimized interactions
  - Responsive images and assets
- **Loading States**: Improved feedback during operations
  - Skeleton screens for content loading
  - Progress indicators for operations
  - Optimistic UI updates
  - Graceful error handling
- **Pagination & Infinite Scroll**: Better content browsing
  - Lazy-loading for large content lists
  - Infinite scroll with efficient rendering
  - Remembered scroll positions
  - Fast content filtering without page reloads

### Community Features
- **Forums & Discussion**: Community discussion boards
  - Categorized discussion topics
  - Rich text formatting with code support
  - Moderation tools and pinned threads
- **Discord Integration**: Deep integration with Discord communities
  - Role synchronization
  - Announcement cross-posting
  - Single sign-on experience
- **Leaderboards**: Top contributors and most popular content
  - Weekly/monthly/all-time rankings
  - Multiple achievement categories
  - Customizable leaderboard views
- **Achievement System**: Rewards for active community participation
  - Tiered achievements with badges
  - Progress tracking for ongoing achievements
  - Special perks for top contributors
- **Script Tutorials**: Community-created guides and tutorials
  - Step-by-step guides with screenshots
  - Video tutorials integration
  - Interactive examples

## 🛠 Technology Stack

### Frontend
- **Vue.js 3**: Composition API with modern JavaScript features
- **Vue Router 4**: Client-side routing with authentication guards
- **Vite**: Fast development server and build tool
- **CSS Custom Properties**: Modern CSS with comprehensive theme system
- **PWA**: Service Worker for offline functionality and app installation
- **Monaco Editor**: Code editor with syntax highlighting
- **Chart.js**: Interactive analytics and statistics visualization

### Backend
- **Express.js**: RESTful API with ES modules
- **MySQL**: Relational database with comprehensive schema
- **Socket.io**: Real-time WebSocket communication
- **JWT**: Secure authentication and authorization
- **Rate Limiting**: API protection against abuse
- **File Upload**: Multer for secure file handling
- **Redis**: Caching and session management
- **Virus Scanning**: Malware detection for uploaded files
- **Content Moderation API**: Automated inappropriate content detection

### Security & Performance
- **Rate Limiting**: Express-rate-limit for API protection
  - Configurable rate limits by endpoint
  - IP-based and user-based throttling
  - Custom response for rate limited requests
- **Input Validation**: Comprehensive validation and sanitization
  - Client-side validation with error feedback
  - Server-side validation and sanitization
  - XSS and injection protection
- **File Upload Security**: Advanced file security measures
  - Virus/malware scanning for uploaded files
  - File type validation and sanitization
  - Size restrictions and quota management
- **Enhanced Performance**: Optimized application performance
  - Database indexing for faster queries
  - Redis caching for frequent requests
  - CDN integration for static assets
  - Compression and minification
- **CORS & Security Headers**: Comprehensive security configuration
  - Content Security Policy implementation
  - Strict CORS configuration
  - HTTPS enforcement and security headers
- **Monitoring & Logging**: System health and activity tracking
  - Performance monitoring dashboard
  - Comprehensive error logging
  - User activity auditing
  - Automated alerts for system issues

## 📋 Installation

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- Discord Developer Application (for OAuth)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd script-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE script_panel;
   
   # Import the database schema (run the SQL commands from src/backend/database.js)
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=script_panel
   
   # Authentication
   JWT_SECRET=your_jwt_secret_key
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Discord Bot (Optional)
   DISCORD_BOT_TOKEN=your_bot_token
   DISCORD_GUILD_ID=your_server_id
   ```

5. **Discord OAuth Setup**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Add OAuth2 redirect URI: `http://localhost:3000/auth/discord/callback`
   - Copy Client ID and Client Secret to your `.env` file

6. **Start the application**
   ```bash
   # Development mode (with hot reload)
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## 🏗 Project Structure

```
script-panel/
├── public/                 # Static assets
│   ├── favicon.ico
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service worker
│   ├── redirect-check.js # Login redirect handler
│   └── browserconfig.xml # Microsoft tiles
├── src/
│   ├── assets/           # CSS and static assets
│   │   ├── app.css      # Global styles and theme system
│   │   ├── main.css     # Component-specific styles
│   │   ├── login.css    # Login specific styles
│   │   ├── navbar.css   # Navigation styles
│   │   └── default/     # Default images
│   ├── backend/         # Server-side code
│   │   ├── server.js    # Main server file
│   │   ├── database.js  # Database schema and connection
│   │   ├── controller/  # API controllers
│   │   │   ├── ScriptController.js
│   │   │   ├── UserController.js
│   │   │   ├── BlacklistController.js
│   │   │   └── DiscordController.js
│   │   ├── services/    # Business logic services
│   │   │   ├── ScriptService.js
│   │   │   ├── UserService.js
│   │   │   ├── BlacklistService.js
│   │   │   └── DiscordService.js
│   │   └── middleware/  # Express middleware
│   │       ├── auth.js
│   │       └── rateLimit.js
│   ├── components/      # Vue components
│   │   ├── AdminDashboard.vue
│   │   ├── CollectionManager.vue
│   │   ├── CommentSystem.vue
│   │   ├── Navbar.vue
│   │   ├── NotificationPanel.vue
│   │   ├── RatingSystem.vue
│   │   ├── ScriptCard.vue
│   │   ├── UploadModal.vue
│   │   ├── UserProfile.vue
│   │   ├── ScriptEditor.vue # Code editor component
│   │   ├── ScriptVersion.vue # Version management
│   │   ├── SearchFilters.vue # Advanced search filters
│   │   └── ActivityFeed.vue  # User activity feed
│   ├── router/          # Vue Router configuration
│   ├── sites/           # Page components
│   │   ├── login.vue
│   │   ├── checking.vue
│   │   ├── main.vue
│   │   └── profile.vue
│   ├── utils/           # Utility functions
│   │   ├── websocket.js
│   │   ├── analytics.js # Usage analytics
│   │   ├── formatter.js # Data formatting helpers
│   │   └── validation.js # Input validation
│   ├── store/           # State management
│   │   ├── auth.js
│   │   ├── scripts.js
│   │   └── notifications.js
│   ├── App.vue          # Root component
│   └── main.js          # Application entry point
├── package.json
├── vite.config.js       # Vite configuration
├── jsconfig.json        # JavaScript configuration
└── README.md
```

## 🎨 Theme System

The application includes a comprehensive theme system with:

- **Light Theme**: Clean, modern light interface
- **Dark Theme**: Eye-friendly dark interface
- **Auto Theme**: Automatically switches based on system preference
- **CSS Custom Properties**: Consistent design system
- **Accessibility**: High contrast ratios and readable fonts

### Theme Toggle
- UI toggle in the top bar
- Keyboard shortcut: `Alt + T`
- Persistent preference storage

## 📱 Progressive Web App

### Features
- **Offline Functionality**: Works without internet connection
- **App Installation**: Install on mobile and desktop
- **Push Notifications**: Real-time notifications even when closed
- **Background Sync**: Sync data when connection is restored
- **App-like Experience**: Native app feel and performance

### Installation
Users can install the app by:
1. Clicking the install prompt
2. Using browser's "Add to Home Screen" option
3. PWA install button in supported browsers

## 🔐 Authentication & Security

### Authentication Flow
1. Discord OAuth integration
2. JWT token generation and validation
3. Secure cookie storage
4. Automatic token refresh

### Security Measures
- Rate limiting on all API endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure headers configuration

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 🛡 Security Considerations

### Authentication
- OAuth 2.0 with Discord
- JWT tokens with expiration and refresh mechanism
- Secure session management with proper cookie settings
- Rate limiting protection for auth endpoints
- IP-based blocking for suspicious activity
- Two-factor authentication option for admins

### Data Protection
- Input validation and sanitization
- Prepared statements for SQL injection prevention
- Content Security Policy (CSP) for XSS protection
- Secure file upload with:
  - File type validation
  - Size limitations
  - Virus/malware scanning
  - Content validation
- CSRF protection with tokens
- Helmet.js security headers
- Regular security audits and penetration testing

## 🎯 Performance Optimizations

### Frontend
- Vue 3 Composition API for better performance
- Lazy loading for routes and components
- Service Worker caching for offline access
- Modern CSS with custom properties
- Virtual scrolling for large lists
- Image optimization and lazy loading
- Code splitting and chunk optimization
- Web Vitals monitoring and optimization

### Backend
- Database query optimization with proper indexing
- Redis caching for frequently accessed data
- Rate limiting to prevent abuse
- Connection pooling for database efficiency
- CDN integration for static assets
- Compression for API responses
- Optimized WebSocket connections
- Background processing for heavy tasks

## 📈 Usage

1. **Authentication**: Users log in via Discord OAuth
2. **Script Upload**: Upload scripts with metadata and tags
   - Add detailed descriptions and categorization
   - Choose visibility settings (public, private, unlisted)
   - Apply appropriate tags for better discoverability
3. **Script Management**: Version control and updates
   - Upload new versions while maintaining history
   - Track usage statistics and popularity
   - Receive feedback through ratings and comments
4. **Social Features**: Rate, comment, follow users, create collections
   - Follow favorite creators for updates
   - Create personal and shared collections
   - Participate in discussions through comments
   - Rate and review scripts to help the community
5. **Discovery**: Find new and trending scripts
   - Use advanced search filters
   - Browse trending and featured scripts
   - Get personalized recommendations
   - Save favorite scripts to collections
6. **Community**: Engage with other script creators
   - View activity feeds of followed users
   - Participate in discussions and forums
   - Earn achievements through contribution
   - Build reputation with quality scripts
7. **Real-time Updates**: Receive live notifications and updates
   - Get notified about script approvals, comments, etc.
   - See real-time activity in the community
8. **PWA Installation**: Install as an app for offline access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

### Monetization Options
- **Premium Scripts Section**: Exclusive content
  - Subscription-based access to premium scripts
  - Freemium model with basic/premium features
  - Premium user badges and recognition
- **Creator Support**: Support for script authors
  - Donation system for supporting creators
  - Revenue sharing program for popular scripts
  - Tipping functionality for appreciating content
- **Advertising System**: Non-intrusive advertising
  - Targeted script recommendations
  - Sponsored listings in search results
  - Premium ad-free experience option
- **Pro User Tiers**: Enhanced platform experience
  - Increased upload limits and quotas
  - Early access to new features
  - Priority support channels

## 🚀 Most Important Next Steps

Based on impact and development effort, these are the recommended next features to implement:

### High Priority (Immediate Value)
1. **User Profiles & Activity**
   - Complete profile pages with script portfolios
   - User statistics and activity tracking
   - Profile customization options

2. **Script Rating & Review System**
   - 5-star rating implementation
   - Detailed review capabilities
   - Rating analytics and summaries

3. **Enhanced Search Functionality**
   - Advanced filtering by multiple criteria
   - Search history and saved searches
   - Trending and discovery improvements

4. **Notification System**
   - Real-time WebSocket notifications
   - Notification preferences
   - Multi-channel delivery (in-app, Discord, email)

### Medium Priority (Growth Features)
1. **Collections & Organization**
   - Public/private collections
   - Shareable collections
   - Featured collections on homepage

2. **Community Engagement Tools**
   - Comments system improvements
   - Discussion forums
   - Achievement system

3. **Content Moderation**
   - Report system
   - Moderation queue
   - Automated content filtering

### Long-term Vision (Platform Evolution)
1. **Script Execution Environment**
   - In-browser script preview/testing
   - Sandboxed execution environment
   - Code editor with syntax highlighting

2. **Analytics Platform**
   - Comprehensive analytics dashboard
   - User engagement metrics
   - Performance and health monitoring

3. **Monetization Strategy**
   - Premium content options
   - Creator support system
   - Sustainable revenue model

**Note**: This is a comprehensive script sharing platform with advanced social features, real-time capabilities, and PWA support. The application is designed to be scalable, secure, and user-friendly while maintaining high performance standards.

## Tech Stack

- **Frontend**: Vue 3, Vite, Vue Router
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT, Discord OAuth2
- **Real-time**: WebSockets
- **Styling**: CSS3 with custom properties

## Project Setup

```sh
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=hopeleaks_panel

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_guild_id
DISCORD_ADMIN_ROLE_ID=your_admin_role_id

# JWT
JWT_SECRET=your_jwt_secret

# Webhooks
DISCORD_WEBHOOK_URL=your_webhook_url
DISCORD_BLACKLIST_WEBHOOK_URL=your_blacklist_webhook_url
DISCORD_LEAK_WEBHOOK_URL=your_leak_webhook_url

# Server
SERVER_PORT=3000
```

### Development

```sh
npm run dev
```

### Production Build

```sh
npm run build
```

### Start Server

```sh
npm run start
```

## Database Setup

The application will automatically create the required database tables on startup. Ensure your MySQL server is running and the database specified in `DB_NAME` exists.

## License

This project is private and proprietary.
