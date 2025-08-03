import jwt from 'jsonwebtoken';

class UserProfileController {
    constructor(services) {
        this.userProfileService = services.userProfileService;
        this.userService = services.userService;
        this.socialService = services.socialService;
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
            return res.status(403).json({ message: "Access Token required" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
    }

    registerRoutes(app) {
        // Get user profile
        app.get("/api/profile/:userId", async (req, res) => {
            try {
                const { userId } = req.params;
                const profile = await this.userProfileService.getUserProfile(userId);
                
                if (!profile) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Check if profile is private
                if (profile.privacy_profile === 'private' && req.user?.discord_id !== userId) {
                    return res.status(403).json({ message: "Profile is private" });
                }

                res.json(profile);
            } catch (error) {
                console.error("Error fetching profile:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Update user profile
        app.put("/api/profile", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const profileData = req.body;

                const success = await this.userProfileService.updateProfile(userId, profileData);
                
                if (success) {
                    res.json({ message: "Profile updated successfully" });
                } else {
                    res.status(400).json({ message: "Failed to update profile" });
                }
            } catch (error) {
                console.error("Error updating profile:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get user statistics
        app.get("/api/profile/:userId/stats", async (req, res) => {
            try {
                const { userId } = req.params;
                const stats = await this.userProfileService.getUserStats(userId);
                res.json(stats);
            } catch (error) {
                console.error("Error fetching user stats:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get user activity
        app.get("/api/profile/:userId/activity", async (req, res) => {
            try {
                const { userId } = req.params;
                const limit = parseInt(req.query.limit) || 20;
                const activity = await this.userProfileService.getUserActivity(userId, limit);
                res.json(activity);
            } catch (error) {
                console.error("Error fetching user activity:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Search users
        app.get("/api/users/search", async (req, res) => {
            try {
                const { q, limit = 20 } = req.query;
                if (!q) {
                    return res.status(400).json({ message: "Search query required" });
                }

                const users = await this.userProfileService.searchUsers(q, parseInt(limit));
                res.json(users);
            } catch (error) {
                console.error("Error searching users:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Follow/Unfollow user
        app.post("/api/users/:userId/follow", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const followerId = req.user.discord_id;
                const { userId } = req.params;

                const success = await this.socialService.followUser(followerId, userId);
                
                if (success) {
                    // Send notification to the followed user
                    await this.notificationService.notifyNewFollower(
                        userId, 
                        followerId, 
                        req.user.username
                    );
                    res.json({ message: "User followed successfully" });
                } else {
                    res.status(400).json({ message: "Already following this user" });
                }
            } catch (error) {
                console.error("Error following user:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.delete("/api/users/:userId/follow", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const followerId = req.user.discord_id;
                const { userId } = req.params;

                const success = await this.socialService.unfollowUser(followerId, userId);
                
                if (success) {
                    res.json({ message: "User unfollowed successfully" });
                } else {
                    res.status(400).json({ message: "Not following this user" });
                }
            } catch (error) {
                console.error("Error unfollowing user:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Check if following
        app.get("/api/users/:userId/following/check", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const followerId = req.user.discord_id;
                const { userId } = req.params;

                const isFollowing = await this.socialService.isFollowing(followerId, userId);
                res.json({ isFollowing });
            } catch (error) {
                console.error("Error checking follow status:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get followers
        app.get("/api/users/:userId/followers", async (req, res) => {
            try {
                const { userId } = req.params;
                const limit = parseInt(req.query.limit) || 20;
                const offset = parseInt(req.query.offset) || 0;

                const followers = await this.socialService.getFollowers(userId, limit, offset);
                res.json(followers);
            } catch (error) {
                console.error("Error fetching followers:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get following
        app.get("/api/users/:userId/following", async (req, res) => {
            try {
                const { userId } = req.params;
                const limit = parseInt(req.query.limit) || 20;
                const offset = parseInt(req.query.offset) || 0;

                const following = await this.socialService.getFollowing(userId, limit, offset);
                res.json(following);
            } catch (error) {
                console.error("Error fetching following:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}

export default UserProfileController;
