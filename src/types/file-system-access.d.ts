interface FileSystemWritableFileStream {
  write(data: Blob | string): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  name: string
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface Window {
  showOpenFilePicker?: (options?: Record<string, unknown>) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (options?: Record<string, unknown>) => Promise<FileSystemFileHandle>
}
