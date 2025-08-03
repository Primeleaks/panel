// WebSocket client for real-time features
class WebSocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.listeners = new Map();
        this.init();
    }

    init() {
        const token = this.getCookie('token');
        if (!token) {
            console.log('No auth token found, WebSocket connection not established');
            return;
        }

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            
            this.socket = new WebSocket(wsUrl);
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }

    setupEventListeners() {
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Authenticate with the server
            const token = this.getCookie('token');
            this.send('auth', { token });
            
            // Emit connection event
            this.emit('connected');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            this.isConnected = false;
            this.emit('disconnected', { code: event.code, reason: event.reason });
            
            // Attempt to reconnect if it wasn't a manual close
            if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        };
    }

    handleMessage(data) {
        const { type, payload } = data;
        
        switch (type) {
            case 'notification':
                this.handleNotification(payload);
                break;
            case 'comment':
                this.handleComment(payload);
                break;
            case 'rating':
                this.handleRating(payload);
                break;
            case 'activity':
                this.handleActivity(payload);
                break;
            case 'script_update':
                this.handleScriptUpdate(payload);
                break;
            default:
                console.log('Unknown WebSocket message type:', type);
        }
        
        // Emit the event to registered listeners
        this.emit(type, payload);
    }

    handleNotification(notification) {
        console.log('New notification:', notification);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: `notification-${notification.id}`
            });
        }
        
        // Update notification counter in navbar
        this.updateNotificationCounter();
    }

    handleComment(comment) {
        console.log('New comment:', comment);
        
        // Update comment count for the script
        const scriptElement = document.querySelector(`[data-script-id="${comment.script_id}"]`);
        if (scriptElement) {
            const commentCount = scriptElement.querySelector('.comment-count');
            if (commentCount) {
                const currentCount = parseInt(commentCount.textContent) || 0;
                commentCount.textContent = currentCount + 1;
            }
        }
    }

    handleRating(rating) {
        console.log('New rating:', rating);
        
        // Update rating display for the script
        const scriptElement = document.querySelector(`[data-script-id="${rating.script_id}"]`);
        if (scriptElement) {
            const ratingElement = scriptElement.querySelector('.rating-display');
            if (ratingElement) {
                // Update average rating and count
                // This would typically trigger a re-fetch of rating data
                this.emit('rating_updated', rating);
            }
        }
    }

    handleActivity(activity) {
        console.log('New activity:', activity);
        
        // Update activity feeds if visible
        const activityFeed = document.querySelector('.activity-feed');
        if (activityFeed) {
            this.emit('activity_updated', activity);
        }
    }

    handleScriptUpdate(update) {
        console.log('Script updated:', update);
        
        // Update script information if currently viewing
        if (window.location.pathname.includes(`/script/${update.script_id}`)) {
            this.emit('script_updated', update);
        }
    }

    send(type, payload = {}) {
        if (!this.isConnected || !this.socket) {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }

        try {
            this.socket.send(JSON.stringify({ type, payload }));
            return true;
        } catch (error) {
            console.error('Failed to send WebSocket message:', error);
            return false;
        }
    }

    // Event listener management
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        // Return a function to remove the listener
        return () => {
            const listeners = this.listeners.get(event);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data = null) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in WebSocket event listener:', error);
                }
            });
        }
    }

    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                console.log('Attempting to reconnect WebSocket...');
                this.init();
            }
        }, delay);
    }

    async updateNotificationCounter() {
        try {
            const token = this.getCookie('token');
            if (!token) return;

            const response = await fetch('/api/notifications/unread-count', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const counter = document.querySelector('.notification-counter');
                if (counter) {
                    counter.textContent = data.count;
                    counter.style.display = data.count > 0 ? 'block' : 'none';
                }
            }
        } catch (error) {
            console.error('Failed to update notification counter:', error);
        }
    }

    // Request notification permission
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    // Join a room (for script-specific updates)
    joinRoom(roomName) {
        this.send('join_room', { room: roomName });
    }

    // Leave a room
    leaveRoom(roomName) {
        this.send('leave_room', { room: roomName });
    }

    // Subscribe to script updates
    subscribeToScript(scriptId) {
        this.joinRoom(`script_${scriptId}`);
    }

    // Unsubscribe from script updates
    unsubscribeFromScript(scriptId) {
        this.leaveRoom(`script_${scriptId}`);
    }

    // Send typing indicator for comments
    sendTypingIndicator(scriptId, isTyping) {
        this.send('typing', { script_id: scriptId, typing: isTyping });
    }

    // Send online status
    updateOnlineStatus(status = 'online') {
        this.send('status', { status });
    }

    getCookie(name) {
        const cookies = document.cookie.split('; ');
        const cookie = cookies.find(row => row.startsWith(`${name}=`));
        return cookie ? cookie.split('=')[1] : null;
    }

    disconnect() {
        if (this.socket) {
            this.isConnected = false;
            this.socket.close(1000, 'Manual disconnect');
            this.socket = null;
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
        };
    }
}

// Create global WebSocket instance
let wsClient = null;

// Initialize WebSocket when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if user is logged in
    if (document.cookie.includes('token=')) {
        wsClient = new WebSocketClient();
        
        // Request notification permission on first login
        wsClient.requestNotificationPermission();
        
        // Make it globally available
        window.wsClient = wsClient;
        
        console.log('WebSocket client initialized');
    }
});

// Auto-connect when user logs in
window.addEventListener('user-login', () => {
    if (!wsClient) {
        wsClient = new WebSocketClient();
        window.wsClient = wsClient;
    }
});

// Disconnect when user logs out
window.addEventListener('user-logout', () => {
    if (wsClient) {
        wsClient.disconnect();
        wsClient = null;
        window.wsClient = null;
    }
});

// Export for module usage
export default WebSocketClient;
