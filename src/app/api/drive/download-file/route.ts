import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GoogleDriveService } from '@/src/service/GoogleDriveService';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return new Response(JSON.stringify({ error: 'Missing fileId in request body.' }), { status: 400 });
    }

    const driveService = new GoogleDriveService(session.accessToken);
    const { data, headers, fileName } = await driveService.downloadFile(fileId);

    const contentType = headers['content-type'] || 'application/octet-stream';
    const contentDisposition = `attachment; filename="${fileName}"`;

    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}