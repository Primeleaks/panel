import mysql from "mysql2";
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
}).promise();

pool.on('error', (err) => {
    console.error('MySQL Pool-Fehler:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Datenbankverbindung verloren. Die Pool-Architektur wird automatisch neu verbinden.');
    }
});

const dbConnection = pool;

// User tables
async function checkUserTable() {
    console.log("Checking user table");
    await dbConnection.query(
        "CREATE TABLE IF NOT EXISTS `users`(" +
        "`discord_id` varchar(255) NOT NULL, " +
        "`username` varchar(255) NOT NULL, " +
        "`avatar` varchar(255) DEFAULT NULL, " +
        "`api_token` varchar(255), " +
        "`bio` TEXT DEFAULT NULL, " +
        "`status` varchar(100) DEFAULT 'active', " +
        "`theme` varchar(20) DEFAULT 'dark', " +
        "`notifications_enabled` tinyint(1) DEFAULT 1, " +
        "`email_notifications` tinyint(1) DEFAULT 0, " +
        "`privacy_profile` varchar(20) DEFAULT 'public', " +
        "`last_active` timestamp NULL DEFAULT NULL, " +
        "`created` timestamp NULL DEFAULT current_timestamp(), " +
        "PRIMARY KEY (`discord_id`))"
    );
}

async function checkBlacklistTable() {
    console.log("Checking blacklist table");
    await dbConnection.query("CREATE TABLE IF NOT EXISTS `blacklist`(`discord_id` varchar(255) NOT NULL, `username` varchar(255) NOT NULL, `reason` TEXT NOT NULL, `date` timestamp NULL DEFAULT current_timestamp(), `bannedBy` varchar(255), PRIMARY KEY (`discord_id`))");
}

async function checkScriptsTable() {
    console.log("Checking scripts table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`scripts\`(
                                                  \`id\` int NOT NULL AUTO_INCREMENT,
                                                  \`title\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            \`description\` text COLLATE utf8mb4_unicode_ci,
            \`category\` enum('user','full','scripts','crimelife','hud','loading','anticheat','design','dumps','bots','tools') COLLATE utf8mb4_unicode_ci NOT NULL,
            \`image\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            \`downloadUrl\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            \`authorId\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`downloads\` int(11) DEFAULT '0',
            \`views\` int(11) DEFAULT '0',
            \`rating_average\` decimal(3,2) DEFAULT '0.00',
            \`rating_count\` int(11) DEFAULT '0',
            \`version\` varchar(20) DEFAULT '1.0.0',
            \`author\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unbekannt',
            \`date\` datetime DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            \`isDeleted\` tinyint(1) DEFAULT '0',
            \`deletedAt\` datetime DEFAULT NULL,
            \`deletedBy\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`isPending\` tinyint(1) DEFAULT '0',
            \`isApproved\` tinyint(1) DEFAULT '1',
            PRIMARY KEY (\`id\`),
            KEY \`authorId\` (\`authorId\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
}

async function updateScriptsTable() {
    try {
        const [columns] = await dbConnection.query('SHOW COLUMNS FROM scripts');
        const columnNames = columns.map(col => col.Field);

        if (!columnNames.includes('isPending')) {
            console.log("Füge Spalte 'isPending' zur scripts-Tabelle hinzu");
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN isPending TINYINT(1) DEFAULT 0');
        }
        if (!columnNames.includes('isApproved')) {
            console.log("Füge Spalte 'isApproved' zur scripts-Tabelle hinzu");
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN isApproved TINYINT(1) DEFAULT 1');
        }

        // Add new columns for enhanced features
        if (!columnNames.includes('downloads')) {
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN downloads int(11) DEFAULT 0');
        }
        if (!columnNames.includes('views')) {
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN views int(11) DEFAULT 0');
        }
        if (!columnNames.includes('rating_average')) {
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN rating_average decimal(3,2) DEFAULT 0.00');
        }
        if (!columnNames.includes('rating_count')) {
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN rating_count int(11) DEFAULT 0');
        }
        if (!columnNames.includes('version')) {
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN version varchar(20) DEFAULT "1.0.0"');
        }
        if (!columnNames.includes('updated_at')) {
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        }

        await dbConnection.query(`
            UPDATE scripts
            SET isPending = FALSE, isApproved = TRUE
            WHERE isPending IS NULL OR isApproved IS NULL
        `);

        console.log("Scripts-Tabelle wurde aktualisiert");
    } catch (error) {
        console.error("Fehler beim Aktualisieren der Scripts-Tabelle:", error);
    }
}

async function checkRatingsTable() {
    console.log("Checking ratings table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`ratings\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`script_id\` int(11) NOT NULL,
            \`user_id\` varchar(255) NOT NULL,
            \`rating\` tinyint(1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
            \`review\` TEXT DEFAULT NULL,
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            UNIQUE KEY \`unique_user_script\` (\`script_id\`, \`user_id\`),
            KEY \`script_id\` (\`script_id\`),
            KEY \`user_id\` (\`user_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkCommentsTable() {
    console.log("Checking comments table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`comments\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`script_id\` int(11) NOT NULL,
            \`user_id\` varchar(255) NOT NULL,
            \`parent_id\` int(11) DEFAULT NULL,
            \`content\` TEXT NOT NULL,
            \`is_deleted\` tinyint(1) DEFAULT '0',
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`script_id\` (\`script_id\`),
            KEY \`user_id\` (\`user_id\`),
            KEY \`parent_id\` (\`parent_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkFollowsTable() {
    console.log("Checking follows table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`follows\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`follower_id\` varchar(255) NOT NULL,
            \`following_id\` varchar(255) NOT NULL,
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            UNIQUE KEY \`unique_follow\` (\`follower_id\`, \`following_id\`),
            KEY \`follower_id\` (\`follower_id\`),
            KEY \`following_id\` (\`following_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkCollectionsTable() {
    console.log("Checking collections table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`collections\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`user_id\` varchar(255) NOT NULL,
            \`name\` varchar(255) NOT NULL,
            \`description\` TEXT DEFAULT NULL,
            \`is_private\` tinyint(1) DEFAULT '0',
            \`is_featured\` tinyint(1) DEFAULT '0',
            \`is_deleted\` tinyint(1) DEFAULT '0',
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`user_id\` (\`user_id\`),
            KEY \`idx_collection_user\` (\`user_id\`, \`is_private\`, \`is_deleted\`),
            KEY \`idx_collection_featured\` (\`is_featured\`, \`is_private\`, \`is_deleted\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkCollectionScriptsTable() {
    console.log("Checking collection_items table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`collection_items\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`collection_id\` int(11) NOT NULL,
            \`script_id\` int(11) NOT NULL,
            \`added_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            UNIQUE KEY \`unique_collection_script\` (\`collection_id\`, \`script_id\`),
            KEY \`collection_id\` (\`collection_id\`),
            KEY \`script_id\` (\`script_id\`),
            FOREIGN KEY (\`collection_id\`) REFERENCES \`collections\`(\`id\`) ON DELETE CASCADE,
            FOREIGN KEY (\`script_id\`) REFERENCES \`scripts\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkBookmarksTable() {
    console.log("Checking bookmarks table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`bookmarks\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`user_id\` varchar(255) NOT NULL,
            \`script_id\` int(11) NOT NULL,
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            UNIQUE KEY \`unique_bookmark\` (\`user_id\`, \`script_id\`),
            KEY \`user_id\` (\`user_id\`),
            KEY \`script_id\` (\`script_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkNotificationsTable() {
    console.log("Checking notifications table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`notifications\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`user_id\` varchar(255) NOT NULL,
            \`type\` varchar(50) NOT NULL,
            \`title\` varchar(255) NOT NULL,
            \`message\` TEXT NOT NULL,
            \`data\` JSON DEFAULT NULL,
            \`is_read\` tinyint(1) DEFAULT '0',
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`user_id\` (\`user_id\`),
            KEY \`is_read\` (\`is_read\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkReportsTable() {
    console.log("Checking reports table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`reports\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`reporter_id\` varchar(255) NOT NULL,
            \`type\` enum('script', 'comment', 'user') NOT NULL,
            \`target_id\` int(11) NOT NULL,
            \`reason\` varchar(100) NOT NULL,
            \`description\` TEXT DEFAULT NULL,
            \`status\` enum('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
            \`reviewed_by\` varchar(255) DEFAULT NULL,
            \`reviewed_at\` timestamp NULL DEFAULT NULL,
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`reporter_id\` (\`reporter_id\`),
            KEY \`status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkScriptTagsTable() {
    console.log("Checking script_tags table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`script_tags\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`script_id\` int(11) NOT NULL,
            \`tag\` varchar(50) NOT NULL,
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            UNIQUE KEY \`unique_script_tag\` (\`script_id\`, \`tag\`),
            KEY \`script_id\` (\`script_id\`),
            KEY \`tag\` (\`tag\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkUserStrikesTable() {
    console.log("Checking user_strikes table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`user_strikes\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`user_id\` varchar(255) NOT NULL,
            \`reason\` varchar(255) NOT NULL,
            \`given_by\` varchar(255) NOT NULL,
            \`expires_at\` timestamp NULL DEFAULT NULL,
            \`is_active\` tinyint(1) DEFAULT '1',
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`user_id\` (\`user_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function checkAuditLogsTable() {
    console.log("Checking audit_logs table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS \`audit_logs\` (
            \`id\` int(11) NOT NULL AUTO_INCREMENT,
            \`admin_id\` varchar(255) NOT NULL,
            \`action\` varchar(100) NOT NULL,
            \`target_type\` varchar(50) DEFAULT NULL,
            \`target_id\` varchar(255) DEFAULT NULL,
            \`details\` JSON DEFAULT NULL,
            \`ip_address\` varchar(45) DEFAULT NULL,
            \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            KEY \`admin_id\` (\`admin_id\`),
            KEY \`action\` (\`action\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

// Collection Analytics and Extended Tables
async function checkCollectionAnalyticsTable() {
    console.log("Checking collection_analytics table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS collection_analytics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            collection_id INT NOT NULL,
            view_count INT DEFAULT 0,
            bookmark_count INT DEFAULT 0,
            share_count INT DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
        )
    `);
}

async function checkCollectionViewsTable() {
    console.log("Checking collection_views table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS collection_views (
            id INT AUTO_INCREMENT PRIMARY KEY,
            collection_id INT NOT NULL,
            user_id VARCHAR(50) NULL,
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address VARCHAR(45) NULL,
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(discord_id) ON DELETE SET NULL
        )
    `);
}

async function checkCollectionSharesTable() {
    console.log("Checking collection_shares table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS collection_shares (
            id INT AUTO_INCREMENT PRIMARY KEY,
            collection_id INT NOT NULL,
            user_id VARCHAR(50) NOT NULL,
            share_token VARCHAR(64) NOT NULL,
            expires_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY (share_token),
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(discord_id) ON DELETE CASCADE
        )
    `);
}

async function checkAdvertisementsTable() {
    console.log("Checking advertisements table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS advertisements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            label VARCHAR(100) NOT NULL,
            text TEXT,
            url VARCHAR(500) NOT NULL,
            image VARCHAR(500),
            type ENUM('popup', 'banner', 'sidebar', 'footer') DEFAULT 'popup',
            is_active BOOLEAN DEFAULT FALSE,
            impressions INT DEFAULT 0,
            clicks INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by VARCHAR(255),
            FOREIGN KEY (created_by) REFERENCES users(discord_id) ON DELETE SET NULL
        )
    `);
}

async function checkAdClicksTable() {
    console.log("Checking ad_clicks table");
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS ad_clicks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ad_id INT NOT NULL,
            user_id VARCHAR(50),
            ip_address VARCHAR(45),
            user_agent TEXT,
            clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ad_id) REFERENCES advertisements(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(discord_id) ON DELETE SET NULL
        )
    `);
}

export async function checkTables() {
    await checkUserTable();
    await checkBlacklistTable();
    await checkScriptsTable();
    await updateScriptsTable();
    await checkRatingsTable();
    await checkCommentsTable();
    await checkFollowsTable();
    await checkCollectionsTable();
    await checkCollectionScriptsTable();
    await checkBookmarksTable();
    await checkNotificationsTable();
    await checkReportsTable();
    await checkScriptTagsTable();
    await checkUserStrikesTable();
    await checkAuditLogsTable();
    await checkCollectionAnalyticsTable();
    await checkCollectionViewsTable();
    await checkCollectionSharesTable();
    await checkAdvertisementsTable();
    await checkAdClicksTable();
}

export async function executeQuery(query, params = []) {
    try {
        if (
            query.trim().toLowerCase().startsWith("insert into users") &&
            params.length >= 3 &&
            (!params[2] || params[2] === null || params[2] === "")
        ) {
            params[2] = "default.png";
        }
        return await dbConnection.query(query, params);
    } catch (error) {
        console.error('Fehler bei Datenbankabfrage:', error);
        if (error.code === 'PROTOCOL_CONNECTION_LOST' ||
            error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT') {
            console.log('Verbindungsfehler. Versuche erneut...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await dbConnection.query(query, params);
        }
        throw error;
    }
}

export default dbConnection;