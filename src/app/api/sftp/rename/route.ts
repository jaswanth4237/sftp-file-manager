import { NextRequest, NextResponse } from 'next/server';
import { getSftpClient, sanitizePath } from '@/lib/sftp';

export async function PATCH(req: NextRequest) {
    try {
        const { fromPath, toPath } = await req.json();

        if (!fromPath || !toPath) {
            return NextResponse.json({ error: "Missing fromPath or toPath" }, { status: 400 });
        }

        const sftp = await getSftpClient();
        const cleanFrom = sanitizePath(fromPath);
        const cleanTo = sanitizePath(toPath);

        await sftp.rename(cleanFrom, cleanTo);

        return NextResponse.json({
            message: "Resource renamed successfully",
            fromPath: cleanFrom,
            toPath: cleanTo
        }, { status: 200 });
    } catch (error: any) {
        console.error("SFTP Rename Error:", error);
        if (error.code === 'ENOENT') {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to rename resource" }, { status: 500 });
    }
}
