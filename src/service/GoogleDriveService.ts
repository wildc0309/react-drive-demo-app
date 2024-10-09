import axios from "axios";
import FormData from "form-data";
import { ReadStream } from "fs";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

export interface UploadOptions {
  name?: string;
  mimeType?: string;
  parents?: string[];
}

class GoogleDriveService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * List all files in the user's Google Drive.
   * Handles pagination to retrieve all files.
   */
  async listAllFiles(): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined = undefined;

    try {
      do {
        const params: any = {
          fields: "nextPageToken,files(id,name,mimeType,modifiedTime)",
          q: "trashed = false",
          pageSize: 1000,
        };
        if (pageToken) {
          params.pageToken = pageToken;
        }
        const res = await axios.get(
          "https://www.googleapis.com/drive/v3/files",
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
            params,
          }
        );
        files.push(...(res.data.files || []));
        pageToken = res.data.nextPageToken;
      } while (pageToken);

      return files;
    } catch (error) {
      console.error("Error listing files:", error);
      throw error;
    }
  }

  /**
   * Delete all files in the user's Google Drive.
   */
  async deleteAllFiles(): Promise<void> {
    try {
      const files = await this.listAllFiles();
      for (const file of files) {
        console.log(`Deleting file ${file.id}...`);
        await this.deleteFile(file.id);
      }
    } catch (error) {
      console.error("Error deleting all files:", error);
      throw error;
    }
  }

  /**
   * Delete a single file by its ID.
   * @param fileId - The ID of the file to delete.
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const res = await axios.patch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId
        )}`,
        { trashed: true },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status !== 200) {
        throw new Error(
          `Failed to move file ${fileId} to trash: ${res.status} ${res.statusText}`
        );
      }
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Upload a file to Google Drive.
   * @param file - The file content (Buffer, Stream, or string).
   * @param options - Additional upload options.
   */
  async uploadFile(
    file: Buffer | ReadStream | string,
    options?: UploadOptions
  ): Promise<DriveFile> {
    try {
      const metadata = {
        name: options?.name || "Untitled",
        mimeType: options?.mimeType || "application/octet-stream",
        parents: options?.parents,
      };

      const form = new FormData();
      form.append("metadata", JSON.stringify(metadata), {
        contentType: "application/json; charset=UTF-8",
      });

      form.append("file", file, {
        filename: options?.name || "Untitled",
        contentType: options?.mimeType || "application/octet-stream",
      });

      const res = await axios.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        form,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            ...form.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return res.data;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Get or create a folder by name.
   * @param folderName - The name of the folder.
   * @returns The ID of the folder.
   */
  async getOrCreateFolder(folderName: string): Promise<string> {
    // Try to find the folder
    const folderId = await this.findFolderByName(folderName);
    if (folderId) {
      return folderId;
    } else {
      // Create the folder
      return await this.createFolder(folderName);
    }
  }

  /**
   * Find a folder by name.
   * @param folderName - The name of the folder to search for.
   * @returns The ID of the folder if found, undefined otherwise.
   */
  private async findFolderByName(
    folderName: string
  ): Promise<string | undefined> {
    try {
      const res = await axios.get("https://www.googleapis.com/drive/v3/files", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: "files(id, name)",
          spaces: "drive",
        },
      });

      const files = res.data.files;
      if (files && files.length > 0) {
        return files[0].id;
      } else {
        return undefined;
      }
    } catch (error) {
      console.error("Error finding folder:", error);
      throw error;
    }
  }

  /**
   * Create a folder.
   * @param folderName - The name of the folder to create.
   * @returns The ID of the newly created folder.
   */
  private async createFolder(folderName: string): Promise<string> {
    try {
      const metadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      };

      const res = await axios.post(
        "https://www.googleapis.com/drive/v3/files",
        metadata,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data.id;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  }

  async downloadFile(
    fileId: string
  ): Promise<{ data: Buffer; headers: any; fileName: string }> {
    try {
      // Get file metadata
      const metadataRes = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId
        )}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          params: {
            fields: "mimeType, name",
          },
        }
      );

      const mimeType = metadataRes.data.mimeType;
      const fileName = metadataRes.data.name;

      let downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}?alt=media`;

      if (mimeType.startsWith("application/vnd.google-apps.")) {
        let exportMimeType = "";

        switch (mimeType) {
          case "application/vnd.google-apps.document":
            exportMimeType = "application/pdf";
            break;
          case "application/vnd.google-apps.spreadsheet":
            exportMimeType =
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            break;
          case "application/vnd.google-apps.presentation":
            exportMimeType =
              "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            break;
          default:
            throw new Error("Unsupported Google Docs mimeType");
        }

        downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId
        )}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
      }

      const res = await axios.get(downloadUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        responseType: "arraybuffer",
      });

      return { data: res.data, headers: res.headers, fileName };
    } catch (error) {
      console.error(`Error downloading file ${fileId}:`, error);
      throw error;
    }
  }
}

export { GoogleDriveService };
