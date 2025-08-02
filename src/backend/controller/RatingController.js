import jwt from 'jsonwebtoken';

class RatingController {
    constructor(services) {
        this.ratingService = services.ratingService;
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

    registerRoutes(app) {
        // Create or update rating
        app.post("/api/scripts/:scriptId/rating", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { scriptId } = req.params;
                const { rating, review } = req.body;
                const userId = req.user.discord_id;

                if (!rating || rating < 1 || rating > 5) {
                    return res.status(400).json({ message: "Rating must be between 1 and 5" });
                }

                // Check if script exists
                const script = await this.scriptService.getScriptById(scriptId);
                if (!script || script.isDeleted || !script.isApproved) {
                    return res.status(404).json({ message: "Script not found" });
                }

                // Prevent rating own scripts
                if (script.authorId === userId) {
                    return res.status(400).json({ message: "Cannot rate your own script" });
                }

                await this.ratingService.createRating(scriptId, userId, rating, review);

                // Notify script author if there's a review
                if (review && review.trim()) {
                    await this.notificationService.notifyNewRating(
                        script.authorId,
                        script.title,
                        rating,
                        userId,
                        req.user.username
                    );
                }

                res.json({ message: "Rating submitted successfully" });
            } catch (error) {
                console.error("Error creating rating:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get user's rating for a script
        app.get("/api/scripts/:scriptId/rating/user", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { scriptId } = req.params;
                const userId = req.user.discord_id;

                const rating = await this.ratingService.getRating(scriptId, userId);
                res.json(rating);
            } catch (error) {
                console.error("Error fetching user rating:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get all ratings for a script
        app.get("/api/scripts/:scriptId/ratings", async (req, res) => {
            try {
                const { scriptId } = req.params;
                const limit = parseInt(req.query.limit) || 10;
                const offset = parseInt(req.query.offset) || 0;

                const ratings = await this.ratingService.getScriptRatings(scriptId, limit, offset);
                res.json(ratings);
            } catch (error) {
                console.error("Error fetching script ratings:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Delete rating
        app.delete("/api/scripts/:scriptId/rating", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { scriptId } = req.params;
                const userId = req.user.discord_id;

                const success = await this.ratingService.deleteRating(scriptId, userId);
                
                if (success) {
                    res.json({ message: "Rating deleted successfully" });
                } else {
                    res.status(404).json({ message: "Rating not found" });
                }
            } catch (error) {
                console.error("Error deleting rating:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get user's ratings
        app.get("/api/users/:userId/ratings", async (req, res) => {
            try {
                const { userId } = req.params;
                const limit = parseInt(req.query.limit) || 20;

                const ratings = await this.ratingService.getUserRatings(userId, limit);
                res.json(ratings);
            } catch (error) {
                console.error("Error fetching user ratings:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}

export default RatingController;
