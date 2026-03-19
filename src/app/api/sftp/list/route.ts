import { NextRequest, NextResponse } from 'next/server';
import { getSftpClient, sanitizePath } from '@/lib/sftp';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) {
        return NextResponse.json({ error: "Path parameter is missing" }, { status: 400 });
    }

    try {
        const sftp = await getSftpClient();
        const cleanPath = sanitizePath(path);
        console.log(`Listing items for path: [${cleanPath}]`);
        const list = await sftp.list(cleanPath);

        const formattedList = list.map((item: any) => ({
            name: item.name,
            type: item.type, // 'd' for directory, '-' for file, 'l' for link
            size: item.size,
            modifyTime: item.modifyTime, // Unix timestamp in milliseconds
            rights: {
                user: item.rights.user,
                group: item.rights.group,
                other: item.rights.other,
            },
        }));

        return NextResponse.json(formattedList);
    } catch (error: any) {
        console.error("SFTP List Error:", error);
        if (error.code === 'ENOENT' || error.message.includes('No such file')) {
            return NextResponse.json({ error: "Directory not found" }, { status: 404 });
        }
        if (error.code === 'EACCES' || error.message.includes('Permission denied')) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }
        return NextResponse.json({ error: "Failed to list directory: " + error.message, code: error.code }, { status: 500 });
    }
}
