// app/api/drive/upload-file/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { GoogleDriveService } from '@/src/service/GoogleDriveService';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = session.accessToken as string;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const folderName = formData.get('folderName') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  try {
    const driveService = new GoogleDriveService(accessToken);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);


    let folderId: string | undefined = undefined;
    if (folderName) {
        folderId = await driveService.getOrCreateFolder(folderName);
    }

    const uploadedFile = await driveService.uploadFile(buffer, {
      name: file.name,
      mimeType: file.type,
      parents: folderId ? [folderId] : undefined,
    });

    return NextResponse.json({ file: uploadedFile });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}