import jwt from 'jsonwebtoken';

class CommentController {
    constructor(services) {
        this.commentService = services.commentService;
        this.scriptService = services.scriptService;
        this.notificationService = services.notificationService;
        this.moderationService = services.moderationService;
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
        // Create comment
        app.post("/api/scripts/:scriptId/comments", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { scriptId } = req.params;
                const { content, parentId } = req.body;
                const userId = req.user.discord_id;

                if (!content || content.trim().length === 0) {
                    return res.status(400).json({ message: "Comment content is required" });
                }

                // Check if script exists
                const script = await this.scriptService.getScriptById(scriptId);
                if (!script || script.isDeleted || !script.isApproved) {
                    return res.status(404).json({ message: "Script not found" });
                }

                // Check content appropriateness
                if (!this.moderationService.isContentAppropriate(content)) {
                    return res.status(400).json({ message: "Inappropriate content detected" });
                }

                const commentId = await this.commentService.createComment(scriptId, userId, content, parentId);

                // Notify script author (if not commenting on own script)
                if (script.authorId !== userId) {
                    await this.notificationService.notifyNewComment(
                        script.authorId,
                        script.title,
                        userId,
                        req.user.username
                    );
                }

                res.json({ 
                    message: "Comment created successfully", 
                    commentId 
                });
            } catch (error) {
                console.error("Error creating comment:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get comments for a script
        app.get("/api/scripts/:scriptId/comments", async (req, res) => {
            try {
                const { scriptId } = req.params;
                const limit = parseInt(req.query.limit) || 50;

                const comments = await this.commentService.getComments(scriptId, limit);
                res.json(comments);
            } catch (error) {
                console.error("Error fetching comments:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get replies for a comment
        app.get("/api/comments/:commentId/replies", async (req, res) => {
            try {
                const { commentId } = req.params;
                const limit = parseInt(req.query.limit) || 10;

                const replies = await this.commentService.getReplies(commentId, limit);
                res.json(replies);
            } catch (error) {
                console.error("Error fetching replies:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Update comment
        app.put("/api/comments/:commentId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { commentId } = req.params;
                const { content } = req.body;
                const userId = req.user.discord_id;

                if (!content || content.trim().length === 0) {
                    return res.status(400).json({ message: "Comment content is required" });
                }

                // Check content appropriateness
                if (!this.moderationService.isContentAppropriate(content)) {
                    return res.status(400).json({ message: "Inappropriate content detected" });
                }

                const success = await this.commentService.updateComment(commentId, userId, content);
                
                if (success) {
                    res.json({ message: "Comment updated successfully" });
                } else {
                    res.status(404).json({ message: "Comment not found or unauthorized" });
                }
            } catch (error) {
                console.error("Error updating comment:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Delete comment
        app.delete("/api/comments/:commentId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { commentId } = req.params;
                const userId = req.user.discord_id;
                const isAdmin = req.user.isAdmin || false;

                const success = await this.commentService.deleteComment(commentId, userId, isAdmin);
                
                if (success) {
                    res.json({ message: "Comment deleted successfully" });
                } else {
                    res.status(404).json({ message: "Comment not found or unauthorized" });
                }
            } catch (error) {
                console.error("Error deleting comment:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get comment by ID
        app.get("/api/comments/:commentId", async (req, res) => {
            try {
                const { commentId } = req.params;

                const comment = await this.commentService.getComment(commentId);
                
                if (comment) {
                    res.json(comment);
                } else {
                    res.status(404).json({ message: "Comment not found" });
                }
            } catch (error) {
                console.error("Error fetching comment:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get user's comments
        app.get("/api/users/:userId/comments", async (req, res) => {
            try {
                const { userId } = req.params;
                const limit = parseInt(req.query.limit) || 20;

                const comments = await this.commentService.getUserComments(userId, limit);
                res.json(comments);
            } catch (error) {
                console.error("Error fetching user comments:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get comment count for a script
        app.get("/api/scripts/:scriptId/comments/count", async (req, res) => {
            try {
                const { scriptId } = req.params;

                const count = await this.commentService.getCommentCount(scriptId);
                res.json({ count });
            } catch (error) {
                console.error("Error fetching comment count:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}

export default CommentController;
