import { POST } from '@/src/app/api/drive/delete-file/route';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { GoogleDriveService } from '@/src/service/GoogleDriveService';

jest.mock('next-auth');
const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

jest.mock('@/src/service/GoogleDriveService');
const MockedGoogleDriveService = GoogleDriveService as jest.MockedClass<typeof GoogleDriveService>;

describe('POST /api/drive/delete-file', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a file when authenticated and fileId is provided', async () => {
    // Given
    mockedGetServerSession.mockResolvedValue({
      accessToken: 'test_access_token',
    } as any);

    MockedGoogleDriveService.prototype.deleteFile.mockResolvedValue();

    const fileId = 'file-id-123';
    const body = JSON.stringify({ fileId });

    const req = new NextRequest('http://localhost/api/drive/delete-file', {
      method: 'POST',
      body,
    });

    // When
    const response = await POST(req);

    // Then
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ "success": true });

    expect(MockedGoogleDriveService).toHaveBeenCalledWith('test_access_token');
    expect(MockedGoogleDriveService.prototype.deleteFile).toHaveBeenCalledWith(fileId);
  });

  it('should return 400 when fileId is missing', async () => {
    // Given
    mockedGetServerSession.mockResolvedValue({
      accessToken: 'test_access_token',
    } as any);

    const req = new NextRequest('http://localhost/api/drive/delete-file', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    // When
    const response = await POST(req);

    // Then
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'File ID is required' });
  });

  it('should return 401 when not authenticated', async () => {
    // Given
    mockedGetServerSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/drive/delete-file', {
      method: 'POST',
      body: JSON.stringify({ fileId: 'file-id-123' }),
    });

    // When
    const response = await POST(req);

    // Then
    expect(response.status).toBe(401);
  });

  it('should handle errors and return 500', async () => {
    // Given
    mockedGetServerSession.mockResolvedValue({
      accessToken: 'test_access_token',
    } as any);

    MockedGoogleDriveService.prototype.deleteFile.mockRejectedValue(new Error('Some error'));

    const fileId = 'file-id-123';
    const req = new NextRequest('http://localhost/api/drive/delete-file', {
      method: 'POST',
      body: JSON.stringify({ fileId }),
    });

    // When
    const response = await POST(req);

    // Then
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Error deleting file' });
  });
});