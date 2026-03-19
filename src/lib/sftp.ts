import SftpClient from 'ssh2-sftp-client';

const SFTP_CONFIG = {
    host: process.env.SFTP_HOST || 'sftp',
    port: parseInt(process.env.SFTP_PORT || '22'),
    username: process.env.SFTP_USER || 'testuser',
    password: process.env.SFTP_PASSWORD || 'testpass',
};

let sftpInstance: SftpClient | null = null;

export async function getSftpClient(): Promise<SftpClient> {
    if (sftpInstance) {
        try {
            // Check if connection is still alive
            await sftpInstance.list('.');
            return sftpInstance;
        } catch (e) {
            console.log("SFTP connection lost, reconnecting...");
            try { await sftpInstance.end(); } catch(e){}
            sftpInstance = null;
        }
    }

    const sftp = new SftpClient();
    
    // Retry mechanism with retries as requested in advisory guidelines
    let attempts = 0;
    const maxRetries = 3;
    
    while (attempts < maxRetries) {
        try {
            console.log(`Attempting SFTP connection to ${SFTP_CONFIG.host}:${SFTP_CONFIG.port} (Attempt ${attempts + 1})...`);
            await sftp.connect({
                ...SFTP_CONFIG,
                retries: 2,
                retry_factor: 2,
                retry_minTimeout: 2000
            });
            console.log("SFTP connected successfully");
            sftpInstance = sftp;
            break;
        } catch (err: any) {
            attempts++;
            console.error(`SFTP connection attempt ${attempts} to ${SFTP_CONFIG.host}:${SFTP_CONFIG.port} failed. Error: ${err.message}`, err);
            if (attempts >= maxRetries) throw err;
            await new Promise(r => setTimeout(r, Math.pow(2, attempts) * 1000));
        }
    }

    const cleanup = async () => {
        if (sftpInstance) {
            console.log("Shutting down SFTP client...");
            try { await sftpInstance.end(); } catch(e){}
            sftpInstance = null;
        }
    };

    // Clean up on process exit
    if (process.listenerCount('SIGINT') < 2) process.once('SIGINT', cleanup);
    if (process.listenerCount('SIGTERM') < 2) process.once('SIGTERM', cleanup);

    return sftpInstance!;
}

export function sanitizePath(path: string): string {
    // Prevent path traversal
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.includes('..')) {
        throw new Error("Invalid path: path traversal detected");
    }
    return normalizedPath;
}
