export interface ServerMetrics {
  cpu: number;
  memory: number;
  uptime: number;
  isDocker: boolean;
}

export interface ProjectFile {
  name: string;
  isDir: boolean;
  size: number;
}

export interface ServerConfig {
  id: string;
  name: string;
  language: 'node' | 'python';
  bindingIp: string;
  bindingPort: number;
  memoryLimit: number;
  cpuLimit: number;
  entryPoint: string;
  status: 'stopped' | 'running' | 'error' | 'building';
  createdAt: string;
  
  // New features
  nodeVersion: string;
  autoloadLibraries: string;
  
  // Panel Protector (Shields)
  shieldFirewall: number;
  shieldRateLimit: number;
  shieldDdos: number;
  shieldIpWhitelist: string;
  shieldShellAccess: number;

  metrics?: ServerMetrics;
  files?: ProjectFile[];
}

export interface UserAccount {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface PanelSettings {
  panelName: string;
  panelLogo: string;
  panelLogoUrl: string;
}
