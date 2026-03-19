import { NextRequest, NextResponse } from 'next/server';
import { getSftpClient, sanitizePath } from '@/lib/sftp';

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) {
        return NextResponse.json({ error: "Path parameter is missing" }, { status: 400 });
    }

    try {
        const sftp = await getSftpClient();
        const cleanPath = sanitizePath(path);

        // Check if it's a file or directory
        const stats = await sftp.stat(cleanPath);
        if (stats.isDirectory) { // property, not function
            await sftp.rmdir(cleanPath);
        } else {
            await sftp.delete(cleanPath);
        }

        return NextResponse.json({
            message: "Resource deleted successfully",
            path: cleanPath
        }, { status: 200 });
    } catch (error: any) {
        console.error("SFTP Delete Error:", error);
        if (error.code === 'ENOENT') {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 });
    }
}
