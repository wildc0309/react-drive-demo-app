import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {
  DriveFile,
  GoogleDriveService,
  UploadOptions,
} from "../service/GoogleDriveService";

describe("GoogleDriveService", () => {
  let mock: MockAdapter;
  let service: GoogleDriveService;
  const accessToken = "test_access_token";

  beforeEach(() => {
    mock = new MockAdapter(axios);
    service = new GoogleDriveService(accessToken);
  });

  afterEach(() => {
    mock.reset();
  });

  describe("listAllFiles", () => {
    it("should list all files", async () => {
      // given
      const mockFiles: DriveFile[] = [
        {
          id: "1",
          name: "File1",
          mimeType: "text/plain",
          modifiedTime: "2021-01-01T00:00:00Z",
        },
        {
          id: "2",
          name: "File2",
          mimeType: "text/plain",
          modifiedTime: "2021-01-02T00:00:00Z",
        },
      ];

      mock.onGet("https://www.googleapis.com/drive/v3/files").reply(200, {
        files: mockFiles,
        nextPageToken: null,
      });

      // when
      const files = await service.listAllFiles();

      // then
      expect(files).toEqual(mockFiles);
      const request: any = mock.history.get[0];
      expect(request.headers["Authorization"]).toBe(`Bearer ${accessToken}`);
      expect(request.params).toMatchObject({
        fields: "nextPageToken,files(id,name,mimeType,modifiedTime)",
        q: "trashed = false",
        pageSize: 1000,
      });
    });

    it("should handle pagination", async () => {
      // given
      const mockFilesPage1: DriveFile[] = [
        {
          id: "1",
          name: "File1",
          mimeType: "text/plain",
          modifiedTime: "2021-01-01T00:00:00Z",
        },
      ];
      const mockFilesPage2: DriveFile[] = [
        {
          id: "2",
          name: "File2",
          mimeType: "text/plain",
          modifiedTime: "2021-01-02T00:00:00Z",
        },
      ];

      mock
        .onGet("https://www.googleapis.com/drive/v3/files")
        .replyOnce(200, {
          files: mockFilesPage1,
          nextPageToken: "next-page-token",
        })
        .onGet("https://www.googleapis.com/drive/v3/files")
        .replyOnce(200, {
          files: mockFilesPage2,
          nextPageToken: null,
        });

      // when
      const files = await service.listAllFiles();

      // then
      expect(files).toEqual([...mockFilesPage1, ...mockFilesPage2]);
    });

    it("should throw an error when the request fails", async () => {
      mock.onGet("https://www.googleapis.com/drive/v3/files").reply(500);

      await expect(service.listAllFiles()).rejects.toThrow();
    });
  });

  describe("deleteFile", () => {
    it("should move a file to trash", async () => {
      // given
      const fileId = "file-id-123";

      mock
        .onPatch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
            fileId
          )}`
        )
        .reply(200, {});

      // when
      await service.deleteFile(fileId);

      // then
      const request: any = mock.history.patch[0];
      expect(request.headers["Authorization"]).toBe(`Bearer ${accessToken}`);
      expect(request.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(request.data)).toEqual({ trashed: true });
    });

    it("should throw an error if the request fails", async () => {
      const fileId = "file-id-123";

      mock
        .onPatch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
            fileId
          )}`
        )
        .reply(500);

      await expect(service.deleteFile(fileId)).rejects.toThrow();
    });
  });

  describe("deleteAllFiles", () => {
    it("should delete all files by moving them to trash", async () => {
      // given
      const mockFiles: DriveFile[] = [
        {
          id: "1",
          name: "File1",
          mimeType: "text/plain",
          modifiedTime: "2021-01-01T00:00:00Z",
        },
        {
          id: "2",
          name: "File2",
          mimeType: "text/plain",
          modifiedTime: "2021-01-02T00:00:00Z",
        },
      ];

      jest.spyOn(service, "listAllFiles").mockResolvedValue(mockFiles);

      const deleteFileSpy = jest
        .spyOn(service, "deleteFile")
        .mockResolvedValue();

      // when
      await service.deleteAllFiles();

      // then
      expect(service.listAllFiles).toHaveBeenCalled();
      expect(deleteFileSpy).toHaveBeenCalledTimes(mockFiles.length);
      expect(deleteFileSpy).toHaveBeenCalledWith("1");
      expect(deleteFileSpy).toHaveBeenCalledWith("2");
    });

    it("should throw an error if deleting a file fails", async () => {
      // given
      const mockFiles: DriveFile[] = [
        {
          id: "1",
          name: "File1",
          mimeType: "text/plain",
          modifiedTime: "2021-01-01T00:00:00Z",
        },
      ];

      jest.spyOn(service, "listAllFiles").mockResolvedValue(mockFiles);

      jest
        .spyOn(service, "deleteFile")
        .mockRejectedValue(new Error("Failed to delete file"));

      // when // then
      await expect(service.deleteAllFiles()).rejects.toThrow(
        "Failed to delete file"
      );
    });
  });

  describe("uploadFile", () => {
    it("should upload a file successfully", async () => {
      // given
      const fileContent = Buffer.from("Hello, world!");
      const options: UploadOptions = {
        name: "hello.txt",
        mimeType: "text/plain",
      };
      const expectedResponse: DriveFile = {
        id: "uploaded-file-id",
        name: "hello.txt",
        mimeType: "text/plain",
        modifiedTime: new Date().toISOString(),
      };

      mock
        .onPost(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
        )
        .reply(200, expectedResponse);

      // when
      const uploadedFile = await service.uploadFile(fileContent, options);

      // then
      expect(uploadedFile).toEqual(expectedResponse);
      const request: any = mock.history.post[0];
      expect(request.headers["Authorization"]).toBe(`Bearer ${accessToken}`);
      expect(request.headers["Content-Type"]).toContain("multipart/form-data");
    });

    it("should throw an error if the upload fails", async () => {
      const fileContent = Buffer.from("Hello, world!");
      const options: UploadOptions = {
        name: "hello.txt",
        mimeType: "text/plain",
      };

      mock
        .onPost("https://www.googleapis.com/upload/drive/v3/files")
        .reply(500);

      await expect(service.uploadFile(fileContent, options)).rejects.toThrow();
    });
  });
});
