import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { GoogleDriveService } from '@/src/service/GoogleDriveService';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = session.accessToken as string;

  try {
    const driveService = new GoogleDriveService(accessToken);
    await driveService.deleteAllFiles();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting all files:', error);
    return NextResponse.json({ error: 'Error deleting all files' }, { status: 500 });
  }
}