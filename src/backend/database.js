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

async function checkUserTable() {
    console.log("Checking user table");
    await dbConnection.query(
        "CREATE TABLE IF NOT EXISTS `users`(" +
        "`discord_id` varchar(255) NOT NULL, " +
        "`username` varchar(255) NOT NULL, " +
        "`avatar` varchar(255) DEFAULT NULL, " +
        "`api_token` varchar(255), " +
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
            \`author\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unbekannt',
            \`date\` datetime DEFAULT CURRENT_TIMESTAMP,
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
            console.log("F�ge Spalte 'isPending' zur scripts-Tabelle hinzu");
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN isPending TINYINT(1) DEFAULT 0');
        }
        if (!columnNames.includes('isApproved')) {
            console.log("F�ge Spalte 'isApproved' zur scripts-Tabelle hinzu");
            await dbConnection.query('ALTER TABLE scripts ADD COLUMN isApproved TINYINT(1) DEFAULT 1');
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

export async function checkTables() {
    await checkUserTable();
    await checkBlacklistTable();
    await checkScriptsTable();
    await updateScriptsTable();
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