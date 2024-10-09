import { POST } from '@/src/app/api/drive/delete-all-files/route';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { GoogleDriveService } from '@/src/service/GoogleDriveService';

jest.mock('next-auth');
const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

jest.mock('@/src/service/GoogleDriveService');
const MockedGoogleDriveService = GoogleDriveService as jest.MockedClass<typeof GoogleDriveService>;

describe('POST /api/drive/delete-all-files', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete all files when authenticated', async () => {
    // given
    mockedGetServerSession.mockResolvedValue({
      accessToken: 'test_access_token',
    } as any);

    MockedGoogleDriveService.prototype.deleteAllFiles.mockResolvedValue();

    const req = new NextRequest('http://localhost/api/drive/delete-all-files', {
      method: 'POST',
    });

    // when
    const response = await POST(req);

    // then
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });

    expect(MockedGoogleDriveService).toHaveBeenCalledWith('test_access_token');
    expect(MockedGoogleDriveService.prototype.deleteAllFiles).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    // given
    mockedGetServerSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/drive/delete-all-files', {
      method: 'POST',
    });

    // when
    const response = await POST(req);

    // then
    expect(response.status).toBe(401);
  });

  it('should handle errors and return 500', async () => {
    // given
    mockedGetServerSession.mockResolvedValue({
      accessToken: 'test_access_token',
    } as any);

    MockedGoogleDriveService.prototype.deleteAllFiles.mockRejectedValue(new Error('Some error'));

    const req = new NextRequest('http://localhost/api/drive/delete-all-files', {
      method: 'POST',
    });

    // when
    const response = await POST(req);

    // then
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Error deleting all files' });
  });
});