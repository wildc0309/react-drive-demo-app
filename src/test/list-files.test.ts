
import { GET } from '@/src/app/api/drive/list-files/route';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { GoogleDriveService } from '@/src/service/GoogleDriveService';

jest.mock('next-auth');
const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

jest.mock('@/src/service/GoogleDriveService');
const MockedGoogleDriveService = GoogleDriveService as jest.MockedClass<typeof GoogleDriveService>;

describe('GET /api/drive/list-files', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of files when authenticated', async () => {
    // given
    mockedGetServerSession.mockResolvedValue({
      accessToken: 'test_access_token',
    } as any);

    const mockFiles = [
      { id: '1', name: 'File1', mimeType: 'text/plain', modifiedTime: '2021-01-01T00:00:00Z' },
    ];
    MockedGoogleDriveService.prototype.listAllFiles.mockResolvedValue(mockFiles);

    const req = new NextRequest('http://localhost/api/drive/list-files');

    // when
    const response = await GET(req);

    // then
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({ files: mockFiles });

    expect(MockedGoogleDriveService).toHaveBeenCalledWith('test_access_token');
    expect(MockedGoogleDriveService.prototype.listAllFiles).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    // given
    mockedGetServerSession.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/drive/list-files');

    // when
    const response = await GET(req);

    // then
    expect(response.status).toBe(401);
  });
});