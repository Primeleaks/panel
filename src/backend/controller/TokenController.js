import jwt from "jsonwebtoken";

class TokenController {

    registerRoutes(app) {
        app.post("/api/token/refresh", (req, res) => {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ message: "Invalid Refresh Token" });
            }

            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            const accessToken = jwt.sign(
                { discord_id: decoded.discord_id },
                process.env.JWT_SECRET,
                { expiresIn: "15m" }
            );

            res.json({ accessToken });
        });
    }

}
export default TokenController;