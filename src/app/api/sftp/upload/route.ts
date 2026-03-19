import { NextRequest, NextResponse } from 'next/server';
import { getSftpClient, sanitizePath } from '@/lib/sftp';
import Busboy from 'busboy';
import { PassThrough } from 'stream';

export async function POST(req: NextRequest): Promise<NextResponse | Response> {
    const sftp = await getSftpClient();
    const contentType = req.headers.get('content-type') || '';
    
    console.log("POST /api/sftp/upload started. Content-Type:", contentType);

    const busboy = Busboy({
        headers: { 'content-type': contentType },
        limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
    });

    return new Promise<NextResponse>((resolve) => {
        let filePath = '';
        let destinationDir = '';
        let uploadStarted = false;
        let uploadError: any = null;
        let putPromise: Promise<string> | null = null;

        busboy.on('field', (name, val) => {
            console.log(`Field [${name}]: ${val}`);
            if (name === 'path') {
                destinationDir = sanitizePath(val);
            }
        });

        busboy.on('file', (name, fileStream, info) => {
            const { filename } = info;
            console.log(`File [${name}]: ${filename}`);
            if (!destinationDir) {
                console.error("No destination directory specified in fields");
                fileStream.resume();
                return;
            }

            filePath = `${destinationDir}/${filename}`.replace(/\/+/g, '/');
            uploadStarted = true;

            // Pipe high-performance file streaming: stream to SFTP
            putPromise = sftp.put(fileStream, filePath);
            
            putPromise?.catch((err) => {
                console.error("SFTP Put Error:", err);
                uploadError = err;
            });

            fileStream.on('limit', () => {
                console.error("File size limit reached");
                uploadError = { status: 413, message: "File exceeds 100MB limit" };
                fileStream.resume();
            });
        });

        busboy.on('finish', async () => {
            console.log("Busboy finished parsing");
            // Wait for SFTP put to complete if it started
            if (putPromise) {
               await putPromise.catch(() => {});
            }

            if (uploadError) {
                if (uploadError.status === 413) {
                    return resolve(NextResponse.json({ error: uploadError.message }, { status: 413 }));
                }
                return resolve(NextResponse.json({ error: "Failed to upload file" }, { status: 500 }));
            }
            if (!uploadStarted) {
                console.log(`Busboy finished but next step was missed. destinationDir confirmed as: [${destinationDir}]`);
                return resolve(NextResponse.json({ error: `No file uploaded to ${destinationDir || 'unknown directory'}. Please try again.` }, { status: 400 }));
            }
            resolve(NextResponse.json({
                message: "File uploaded successfully",
                filePath
            }, { status: 201 }));
        });

        busboy.on('error', (err) => {
            console.error("Busboy Error observed:", err);
            resolve(NextResponse.json({ error: "Failed to parse upload" }, { status: 400 }));
        });

        if (req.body) {
            const reader = req.body.getReader();
            const pump = async () => {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        busboy.end();
                        return;
                    }
                    busboy.write(Buffer.from(value));
                    pump();
                } catch (err) {
                    busboy.destroy(err as Error);
                }
            };
            pump();
        } else {
            resolve(NextResponse.json({ error: "Empty request body" }, { status: 400 }));
        }
    });
}
