import { NextRequest, NextResponse } from 'next/server';
import { getSftpClient, sanitizePath } from '@/lib/sftp';
import { Readable } from 'stream';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) {
        return NextResponse.json({ error: "Path parameter is missing" }, { status: 400 });
    }

    try {
        const sftp = await getSftpClient();
        const cleanPath = sanitizePath(path);
        const filename = cleanPath.split('/').pop() || 'download';

        // Check if the file exists and get stats
        const stats = await sftp.stat(cleanPath);
        if (!stats.isFile) { // isFile is a property, not a function
            return NextResponse.json({ error: "Not a file" }, { status: 400 });
        }

        // Use sftp.get with a stream
        // According to ssh2-sftp-client docs, get(path, dst, options) 
        // If dst is undefined, it returns a Promise<Buffer>. 
        // We want a stream. We can use sftp.get(path, undefined) then stream it? 
        // No, Buffer would load everything.
        // Instead, use lower-level ssh2 if needed or check if sftp.get can return a stream.
        // Actually, sftp.get(path, undefined) returns buffer.
        // But ssh2-sftp-client has sftp.get(path, writeStream)
        // We want a readable stream from SFTP.
        // Let's use sftp.createReadStream() if available? 
        // ssh2-sftp-client does not have createReadStream directly in its public API, 
        // but we can access the underlying sftp object if needed.
        // Wait, check sftp-client source or docs.
        // Standard ssh2-sftp-client get(path, dst) if dst is a stream, it pipes to it.

    // Use PassThrough to bridge ssh2-sftp-client to Web Stream
    const pass = new (require('stream').PassThrough)();
    console.log("Download: PassThrough bridge created for", cleanPath);

    // According to ssh2-sftp-client docs, get(path, writeStream) pipes into it.
    // We don't await because it will finish when the stream is consumed.
    sftp.get(cleanPath, pass).catch((err: any) => {
        console.error("SFTP get background error:", err);
        pass.destroy(err);
    });

    const webStream = Readable.toWeb(pass);
    console.log("Download: Web stream response initiated for", cleanPath);

    return new Response(webStream as any, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Content-Length': stats.size.toString(),
        },
    });

    } catch (error: any) {
        console.error("SFTP Download Error:", error);
        if (error.code === 'ENOENT') {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
    }
}
