import dbConnection from '../database.js';

class AdvertisingService {
    async createAdvertisement(adData) {
        const { label, text, url, image, type, is_active } = adData;
        
        const query = `
            INSERT INTO advertisements (label, text, url, image, type, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const result = await dbConnection.query(query, [label, text, url, image, type, is_active]);
        return result.insertId;
    }
    
    async getAllAdvertisements() {
        const query = `
            SELECT * FROM advertisements 
            ORDER BY created_at DESC
        `;
        
        return await dbConnection.query(query);
    }
    
    async getActiveAdvertisements() {
        const query = `
            SELECT * FROM advertisements 
            WHERE is_active = 1 
            ORDER BY created_at DESC
        `;
        
        return await dbConnection.query(query);
    }
    
    async updateAdvertisement(id, adData) {
        const { label, text, url, image, type, is_active } = adData;
        
        const query = `
            UPDATE advertisements 
            SET label = ?, text = ?, url = ?, image = ?, type = ?, is_active = ?
            WHERE id = ?
        `;
        
        await dbConnection.query(query, [label, text, url, image, type, is_active, id]);
        return true;
    }
    
    async toggleAdvertisementStatus(id) {
        const query = `
            UPDATE advertisements 
            SET is_active = NOT is_active 
            WHERE id = ?
        `;
        
        await dbConnection.query(query, [id]);
        return true;
    }
    
    async deleteAdvertisement(id) {
        const query = `DELETE FROM advertisements WHERE id = ?`;
        await dbConnection.query(query, [id]);
        return true;
    }
    
    async recordAdClick(adId, userId = null, ipAddress = null) {
        const query = `
            INSERT INTO ad_clicks (ad_id, user_id, ip_address)
            VALUES (?, ?, ?)
        `;
        
        await dbConnection.query(query, [adId, userId, ipAddress]);
        return true;
    }
    
    async getAdvertisementStats() {
        const impressionsQuery = `
            SELECT COUNT(*) as total_impressions 
            FROM advertisements 
            WHERE is_active = 1
        `;
        
        const clicksQuery = `
            SELECT COUNT(*) as total_clicks 
            FROM ad_clicks 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;
        
        const [impressionsResult, clicksResult] = await Promise.all([
            dbConnection.query(impressionsQuery),
            dbConnection.query(clicksQuery)
        ]);
        
        const impressions = impressionsResult[0]?.total_impressions || 0;
        const clicks = clicksResult[0]?.total_clicks || 0;
        const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.0';
        
        return {
            impressions,
            clicks,
            ctr
        };
    }
}

export default AdvertisingService;
