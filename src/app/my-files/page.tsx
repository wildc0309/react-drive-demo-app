"use client";

import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  Text,
  Button,
  Flex,
  Dialog,
  Card,
} from "@tremor/react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { DownloadIcon, TrashIcon } from "@heroicons/react/outline";
import { DriveFile } from "../../service/GoogleDriveService";

export default function MyFilesPage() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFolderName, setTargetFolderName] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      const fetchFiles = async () => {
        try {
          const res = await fetch("/api/drive/list-files");
          const data = await res.json();
          if (res.ok) {
            setFiles(data.files || []);
          } else {
            console.error("Error fetching files:", data.error);
          }
        } catch (error) {
          console.error("Error fetching files:", error);
        }
      };

      fetchFiles();
    }
  }, [status]);

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const res = await fetch("/api/drive/delete-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFiles(files.filter((file: any) => file.id !== fileId));
      } else {
        alert(`Error deleting file: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("An error occurred while deleting the file.");
    }
  };

  const handleUpload = async () => {
    console.log("Uploading file...");
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    if (targetFolderName.trim() !== "") {
      formData.append("folderName", targetFolderName.trim());
    }

    try {
      const res = await fetch("/api/drive/upload-file", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as any;

      if (res.ok && data) {
        console.log("data.file", data.file);
        const file = {
          id: data.file.id,
          name: data.file.name,
          mimeType: data.file.mimeType,
          modifiedTime: new Date().toISOString(),
        };
        setFiles([file, ...files]);
        alert("File uploaded successfully.");
        setIsModalOpen(false);
        setSelectedFile(null);
        setTargetFolderName("");
      } else {
        alert(`Error uploading file: ${data.error}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading the file.");
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const res = await fetch("/api/drive/download-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Error downloading file: ${data.error}`);
        return;
      }

      const blob = await res.blob();

      // Create a link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("An error occurred while downloading the file.");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all files?")) {
      return;
    }

    try {
      const res = await fetch("/api/drive/delete-all-files", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setFiles([]);
        alert("All files have been deleted.");
      } else {
        alert(`Error deleting all files: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting all files:", error);
      alert("An error occurred while deleting all files.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return (
      <div className="p-6">
        <Text className="text-xl font-semibold mb-4">
          You are not signed in
        </Text>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <Flex className="pt-3 space-x-4" justifyContent="end">
          <Button onClick={() => setIsModalOpen(true)}>Add File</Button>
          <Button
            onClick={() => handleDeleteAll()}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Delete All Files
          </Button>
          <Button
            onClick={() => {
              signOut();
            }}
          >
            Exit
          </Button>
        </Flex>
        <Text className="text-2xl font-semibold mb-4">
          Your Google Drive Files
        </Text>
        {files.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Modified Time</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
              <TableBody>
                {files.map((file: any) => (
                  <TableRow key={file.id}>
                    <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
                      {file.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap hidden sm:table-cell overflow-hidden max-w-xs">
                      {file.mimeType.split("/")[1]}
                    </TableCell>
                    <TableCell className="whitespace-nowrap hidden md:table-cell">
                      {new Date(file.modifiedTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {/* Add Download button if not a folder */}
                      {file.mimeType !==
                        "application/vnd.google-apps.folder" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(file.id, file.name)}
                          title="Download File"
                          aria-label="Download File"
                          className="mr-2"
                        >
                          <DownloadIcon className="h-5 w-5" />
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        title="Delete File"
                        aria-label="Delete File"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Text>No files found.</Text>
        )}
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <Card className="p-6 w-[30rem]">
            <Text className="text-xl font-semibold mb-4">Upload File</Text>
            <input type="file" onChange={handleFileChange} />
            {selectedFile && (
              <Text className="mt-2">Selected file: {selectedFile.name}</Text>
            )}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Target Folder Name (optional)
              </label>
              <input
                type="text"
                value={targetFolderName}
                onChange={(e) => setTargetFolderName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Enter Folder Name"
              />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!selectedFile}>
                Upload
              </Button>
            </div>
          </Card>
        </Dialog>
      </div>
    </>
  );
}
