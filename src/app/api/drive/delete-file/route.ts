import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { GoogleDriveService } from '@/src/service/GoogleDriveService';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = session.accessToken as string;
  const { fileId } = await request.json();

  if (!fileId) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  }

  try {
    const driveService = new GoogleDriveService(accessToken);
    await driveService.deleteFile(fileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting file ${fileId}:`, error);
    return NextResponse.json({ error: "Error deleting file" }, { status: 500 });
  }
}
