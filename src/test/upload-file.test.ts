import { POST } from '@/src/app/api/drive/upload-file/route';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { GoogleDriveService } from '@/src/service/GoogleDriveService';

jest.mock('next-auth');
const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

jest.mock('@/src/service/GoogleDriveService');
const MockedGoogleDriveService = GoogleDriveService as jest.MockedClass<typeof GoogleDriveService>;

describe('POST /api/drive/upload-file', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload a file when authenticated and file is provided', async () => {
    // Given
    mockedGetServerSession.mockResolvedValue({
      accessToken: 'test_access_token',
    } as any);

    const mockFile = {
      id: 'file-id-123',
      name: 'test.txt',
      mimeType: 'text/plain',
      modifiedTime: '2021-01-01T00:00:00Z',
    };

    MockedGoogleDriveService.prototype.uploadFile.mockResolvedValue(mockFile);

    // Mock the request and formData
    const req = new NextRequest('http://localhost/api/drive/upload-file', {
      method: 'POST',
    });

    // Mock req.formData()
    const formData = new FormData();
    const fileContent = 'Hello, world!';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    formData.append('file', blob, 'test.txt');

    jest.spyOn(req, 'formData').mockResolvedValue(formData);

    // When
    const response = await POST(req);

    // Then
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ file: mockFile });

    expect(MockedGoogleDriveService).toHaveBeenCalledWith('test_access_token');
    expect(MockedGoogleDriveService.prototype.uploadFile).toHaveBeenCalled();
  });

  it('should return 400 when file is not provided', async () => {
    // Given
    mockedGetServerSession.mockResolvedValue({
      accessToken: 'test_access_token',
    } as any);

    const req = new NextRequest('http://localhost/api/drive/upload-file', {
      method: 'POST',
    });

    // Mock req.formData() to return empty FormData
    jest.spyOn(req, 'formData').mockResolvedValue(new FormData());

    // When
    const response = await POST(req);

    // Then
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'File is required' });
  });

  it('should return 401 when not authenticated', async () => {
    // Given
    mockedGetServerSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/drive/upload-file', {
      method: 'POST',
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

    MockedGoogleDriveService.prototype.uploadFile.mockRejectedValue(new Error('Some error'));

    // Mock the request and formData
    const req = new NextRequest('http://localhost/api/drive/upload-file', {
      method: 'POST',
    });

    // Mock req.formData()
    const formData = new FormData();
    const fileContent = 'Hello, world!';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    formData.append('file', blob, 'test.txt');

    jest.spyOn(req, 'formData').mockResolvedValue(formData);

    // When
    const response = await POST(req);

    // Then
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Error uploading file' });
  });
});