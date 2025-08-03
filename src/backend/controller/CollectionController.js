import jwt from 'jsonwebtoken';

class CollectionController {
    constructor(services) {
        this.collectionService = services.collectionService;
        this.scriptService = services.scriptService;
        this.notificationService = services.notificationService;
    }

    authenticateJWT(req, res, next) {
        const authHeader = req.headers.authorization;
        let token;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(403).json({ message: "Authentication required" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
    }

    requireAdmin(req, res, next) {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Admin access required" });
        }
        next();
    }

    registerRoutes(app) {
        // Create a new collection
        app.post("/api/collections", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { name, description, isPrivate = false } = req.body;
                const userId = req.user.discord_id;

                if (!name || name.trim().length === 0) {
                    return res.status(400).json({ message: "Collection name is required" });
                }

                const collectionId = await this.collectionService.createCollection(
                    userId,
                    name,
                    description,
                    isPrivate
                );

                res.status(201).json({
                    message: "Collection created successfully",
                    collectionId
                });
            } catch (error) {
                console.error("Error creating collection:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get a collection by ID
        app.get("/api/collections/:collectionId", async (req, res) => {
            try {
                const { collectionId } = req.params;
                let userId = null;
                const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

                // If user is authenticated, pass their ID to check for private collection access
                if (req.headers.authorization || req.cookies?.token) {
                    try {
                        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
                        const decoded = jwt.verify(token, process.env.JWT_SECRET);
                        userId = decoded.discord_id;
                    } catch (err) {
                        // Invalid token, just proceed with null userId (only public collections)
                    }
                }

                const collection = await this.collectionService.getCollection(collectionId, userId, ipAddress);
                
                if (!collection) {
                    return res.status(404).json({ message: "Collection not found" });
                }
                
                res.json(collection);
            } catch (error) {
                console.error("Error fetching collection:", error);
                res.status(500).json({ message: "Internal server error", error: error.message });
            }
        });

        // Get collections for a user
        app.get("/api/users/:userId/collections", async (req, res) => {
            try {
                const { userId } = req.params;
                let includePrivate = false;
                
                // Check if the requesting user is the same as the target user
                if (req.headers.authorization || req.cookies?.token) {
                    try {
                        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
                        const decoded = jwt.verify(token, process.env.JWT_SECRET);
                        includePrivate = decoded.discord_id === userId;
                    } catch (err) {
                        // Invalid token, only public collections
                    }
                }
                
                const collections = await this.collectionService.getUserCollections(userId, includePrivate);
                res.json(collections);
            } catch (error) {
                console.error("Error fetching user collections:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get featured collections
        app.get("/api/collections/featured", async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 5;
                const collections = await this.collectionService.getFeaturedCollections(limit);
                res.json(collections);
            } catch (error) {
                console.error("Error fetching featured collections:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Update a collection
        app.put("/api/collections/:collectionId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId } = req.params;
                const { name, description, isPrivate } = req.body;
                const userId = req.user.discord_id;
                const isAdmin = req.user.isAdmin || false;
                
                if (!name || name.trim().length === 0) {
                    return res.status(400).json({ message: "Collection name is required" });
                }
                
                const success = await this.collectionService.updateCollection(
                    collectionId,
                    userId,
                    { name, description, isPrivate },
                    isAdmin
                );
                
                if (success) {
                    res.json({ message: "Collection updated successfully" });
                } else {
                    res.status(404).json({ message: "Collection not found or unauthorized" });
                }
            } catch (error) {
                console.error("Error updating collection:", error);
                if (error.message === "Unauthorized") {
                    return res.status(403).json({ message: "Unauthorized to update this collection" });
                }
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Update featured status (admin only)
        app.put("/api/admin/collections/:collectionId/featured", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { collectionId } = req.params;
                const { isFeatured } = req.body;
                
                const success = await this.collectionService.updateCollection(
                    collectionId,
                    null, // Not using userId for admin operations
                    { isFeatured },
                    true // isAdmin
                );
                
                if (success) {
                    res.json({ message: "Collection featured status updated successfully" });
                } else {
                    res.status(404).json({ message: "Collection not found" });
                }
            } catch (error) {
                console.error("Error updating featured status:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Delete a collection
        app.delete("/api/collections/:collectionId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId } = req.params;
                const userId = req.user.discord_id;
                const isAdmin = req.user.isAdmin || false;
                
                const success = await this.collectionService.deleteCollection(collectionId, userId, isAdmin);
                
                if (success) {
                    res.json({ message: "Collection deleted successfully" });
                } else {
                    res.status(404).json({ message: "Collection not found or unauthorized" });
                }
            } catch (error) {
                console.error("Error deleting collection:", error);
                if (error.message === "Unauthorized") {
                    return res.status(403).json({ message: "Unauthorized to delete this collection" });
                }
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Add a script to a collection
        app.post("/api/collections/:collectionId/scripts/:scriptId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId, scriptId } = req.params;
                const userId = req.user.discord_id;
                const isAdmin = req.user.isAdmin || false;
                
                // Check if script exists and is active
                const script = await this.scriptService.getScriptById(scriptId);
                if (!script || script.isDeleted || !script.isApproved) {
                    return res.status(404).json({ message: "Script not found" });
                }
                
                await this.collectionService.addToCollection(collectionId, scriptId, userId, isAdmin);
                
                res.status(201).json({ message: "Script added to collection successfully" });
            } catch (error) {
                console.error("Error adding script to collection:", error);
                
                if (error.message === "Unauthorized") {
                    return res.status(403).json({ message: "Unauthorized to update this collection" });
                }
                
                if (error.message === "Script already exists in this collection") {
                    return res.status(400).json({ message: error.message });
                }
                
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Remove a script from a collection
        app.delete("/api/collections/:collectionId/scripts/:scriptId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId, scriptId } = req.params;
                const userId = req.user.discord_id;
                const isAdmin = req.user.isAdmin || false;
                
                const success = await this.collectionService.removeFromCollection(
                    collectionId, 
                    scriptId,
                    userId,
                    isAdmin
                );
                
                if (success) {
                    res.json({ message: "Script removed from collection successfully" });
                } else {
                    res.status(404).json({ message: "Script or collection not found" });
                }
            } catch (error) {
                console.error("Error removing script from collection:", error);
                
                if (error.message === "Unauthorized") {
                    return res.status(403).json({ message: "Unauthorized to update this collection" });
                }
                
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Search collections
        app.get("/api/collections/search", async (req, res) => {
            try {
                const { query, limit = 20 } = req.query;
                
                if (!query || query.trim().length === 0) {
                    return res.status(400).json({ message: "Search query is required" });
                }
                
                const collections = await this.collectionService.searchCollections(
                    query,
                    parseInt(limit)
                );
                
                res.json(collections);
            } catch (error) {
                console.error("Error searching collections:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Bookmark a collection
        app.post("/api/collections/:collectionId/bookmark", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId } = req.params;
                const userId = req.user.discord_id;
                
                // Verify collection exists and is accessible
                const collection = await this.collectionService.getCollection(collectionId, userId);
                if (!collection) {
                    return res.status(404).json({ message: "Collection not found or not accessible" });
                }
                
                const result = await this.collectionService.bookmarkCollection(userId, collectionId);
                
                if (result) {
                    res.status(201).json({ message: "Collection bookmarked successfully" });
                } else {
                    res.status(200).json({ message: "Collection already bookmarked" });
                }
            } catch (error) {
                console.error("Error bookmarking collection:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Remove bookmark from a collection
        app.delete("/api/collections/:collectionId/bookmark", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId } = req.params;
                const userId = req.user.discord_id;
                
                const success = await this.collectionService.unbookmarkCollection(userId, collectionId);
                
                if (success) {
                    res.json({ message: "Bookmark removed successfully" });
                } else {
                    res.status(404).json({ message: "Bookmark not found" });
                }
            } catch (error) {
                console.error("Error removing bookmark:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Get user's bookmarked collections
        app.get("/api/users/:userId/bookmarks", async (req, res) => {
            try {
                const { userId } = req.params;
                let currentUserId = null;
                
                // Check if the current user is the same as the requested user
                if (req.headers.authorization || req.cookies?.token) {
                    try {
                        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
                        const decoded = jwt.verify(token, process.env.JWT_SECRET);
                        currentUserId = decoded.discord_id;
                    } catch (err) {
                        // Invalid token
                    }
                }
                
                // Only allow viewing own bookmarks
                if (userId !== currentUserId) {
                    return res.status(403).json({ message: "Unauthorized to view these bookmarks" });
                }
                
                const bookmarks = await this.collectionService.getUserBookmarks(userId);
                res.json(bookmarks);
            } catch (error) {
                console.error("Error fetching bookmarks:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Get collection analytics (admin or owner only)
        app.get("/api/collections/:collectionId/analytics", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId } = req.params;
                const userId = req.user.discord_id;
                const isAdmin = req.user.isAdmin || false;
                
                // Check if user is admin or collection owner
                const collection = await this.collectionService.getCollectionById(collectionId);
                if (!collection) {
                    return res.status(404).json({ message: "Collection not found" });
                }
                
                if (!isAdmin && collection.user_id !== userId) {
                    return res.status(403).json({ message: "Unauthorized to view these analytics" });
                }
                
                const analytics = await this.collectionService.getCollectionAnalytics(collectionId);
                const viewsByDate = await this.collectionService.getCollectionViewsByDate(collectionId, 30);
                
                res.json({
                    ...analytics,
                    daily_views: viewsByDate
                });
            } catch (error) {
                console.error("Error fetching collection analytics:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Bookmark a collection
        app.post("/api/collections/:collectionId/bookmark", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId } = req.params;
                const { action } = req.body; // 'add' or 'remove'
                const userId = req.user.discord_id;

                let result;
                if (action === 'remove') {
                    result = await this.collectionService.removeBookmark(userId, collectionId);
                } else {
                    result = await this.collectionService.addBookmark(userId, collectionId);
                }

                res.json({ 
                    success: true, 
                    bookmarked: action !== 'remove',
                    message: action === 'remove' ? 'Bookmark removed' : 'Collection bookmarked'
                });
            } catch (error) {
                console.error("Error handling bookmark:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get user's bookmarked collections
        app.get("/api/users/me/bookmarked-collections", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const collections = await this.collectionService.getUserBookmarkedCollections(userId);
                res.json(collections);
            } catch (error) {
                console.error("Error fetching bookmarked collections:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Track collection view
        app.post("/api/collections/:collectionId/view", async (req, res) => {
            try {
                const { collectionId } = req.params;
                const { token } = req.body;
                const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                
                let userId = null;
                // If user is authenticated, get their ID
                if (req.headers.authorization || req.cookies?.token) {
                    try {
                        const authToken = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
                        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
                        userId = decoded.discord_id;
                    } catch (err) {
                        // Invalid token, just proceed with null userId
                    }
                }

                // Record the view
                await this.collectionService.recordCollectionView(collectionId, userId, ipAddress);
                res.json({ success: true });
            } catch (error) {
                console.error("Error recording view:", error);
                // Don't return error to client - tracking should be non-blocking
                res.json({ success: false });
            }
        });

        // Get analytics for a collection
        app.get("/api/collections/:collectionId/analytics", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId } = req.params;
                const userId = req.user.discord_id;
                
                // Check if user has permission to view analytics (must be owner or admin)
                const [collection] = await this.collectionService.getCollectionOwner(collectionId);
                
                if (!collection) {
                    return res.status(404).json({ message: "Collection not found" });
                }

                if (collection.user_id !== userId && !req.user.isAdmin) {
                    return res.status(403).json({ message: "You don't have permission to view these analytics" });
                }

                // Get basic analytics
                const analytics = await this.collectionService.getCollectionAnalytics(collectionId);
                
                // Get views over time
                const days = req.query.days ? parseInt(req.query.days) : 30;
                const viewsOverTime = await this.collectionService.getViewsOverTime(collectionId, days);
                
                res.json({
                    ...analytics,
                    viewsOverTime
                });
            } catch (error) {
                console.error("Error fetching analytics:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Generate share token for a collection
        app.post("/api/collections/:collectionId/share-token", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { collectionId } = req.params;
                const userId = req.user.discord_id;
                
                const shareData = await this.collectionService.generateShareToken(userId, collectionId);
                res.json(shareData);
            } catch (error) {
                console.error("Error generating share token:", error);
                
                if (error.message === "Collection not found" || 
                    error.message === "You don't have permission to share this collection") {
                    return res.status(403).json({ message: error.message });
                }
                
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Get collection by share token
        app.get("/api/shared/collection/:token", async (req, res) => {
            try {
                const { token } = req.params;
                
                const collection = await this.collectionService.getCollectionByShareToken(token);
                
                if (!collection) {
                    return res.status(404).json({ 
                        message: "Shared collection not found or link has expired" 
                    });
                }
                
                res.json(collection);
            } catch (error) {
                console.error("Error fetching shared collection:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}

export default CollectionController;
