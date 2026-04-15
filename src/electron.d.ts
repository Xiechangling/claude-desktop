interface ElectronAPI {
  isElectron: boolean;
  getPlatform: () => Promise<string>;
  getAppPath: () => Promise<string>;
  selectDirectory: () => Promise<string | null>;
  exportWorkspace: (workspaceId: string, contextMarkdown: string, defaultFilename: string) => Promise<any>;
  showItemInFolder: (filePath: string) => Promise<boolean>;
  openFolder: (folderPath: string) => Promise<boolean>;
  resizeWindow: (width: number, height: number) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  onUpdateStatus: (callback: (status: any) => void) => void;
  installUpdate: () => Promise<void>;
  onZoomChanged: (callback: (factor: number) => void) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
  electron?: ElectronAPI;
}
