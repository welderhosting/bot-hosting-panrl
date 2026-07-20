import React, { useState, useEffect, useRef, FormEvent, MouseEvent } from 'react';
import { 
  Server, Play, Square, RotateCw, Trash2, Plus, Terminal, 
  FileText, Settings, Activity, Cpu, HardDrive, Clock, 
  ChevronRight, AlertCircle, ExternalLink, Code2, Save, 
  Undo2, FolderOpen, FileCode, HelpCircle, CheckCircle2, RefreshCw, X,
  Shield, ShieldAlert, Zap, Lock, Key, Users, Sliders, LogOut, UserPlus, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServerConfig, ProjectFile, UserAccount, PanelSettings } from './types';

// Helper to render preset logo icon based on string key
function PresetLogoIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  switch (name) {
    case 'shield-alert':
      return <ShieldAlert className={`${className} text-rose-400`} />;
    case 'zap':
      return <Zap className={`${className} text-amber-400`} />;
    case 'server':
      return <Server className={`${className} text-blue-400`} />;
    case 'terminal':
      return <Terminal className={`${className} text-emerald-400`} />;
    case 'shield':
    default:
      return <Shield className={`${className} text-cyan-400`} />;
  }
}

export default function App() {
  // Authentication & Session States
  const [token, setToken] = useState<string | null>(localStorage.getItem('panel_token'));
  const [currentUser, setCurrentUser] = useState<{ username: string; role: 'admin' | 'user' } | null>(null);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Global Application State
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dockerAvailable, setDockerAvailable] = useState<boolean>(false);
  const [panelSettings, setPanelSettings] = useState<PanelSettings>({
    panelName: 'Docker Bot Hosting Panel',
    panelLogo: 'shield',
    panelLogoUrl: ''
  });

  // Panel View Tabs: 'servers' | 'protector' | 'users' | 'settings'
  const [panelTab, setPanelTab] = useState<'servers' | 'protector' | 'users' | 'settings'>('servers');

  // Server Detail Drawer State
  const [selectedServer, setSelectedServer] = useState<ServerConfig | null>(null);
  const [drawerTab, setDrawerTab] = useState<'monitor' | 'logs' | 'files' | 'settings'>('monitor');

  // File Editor State
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isSavingFile, setIsSavingFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);

  // Live Logs State
  const [logs, setLogs] = useState<string>('');
  const [logAutoScroll, setLogAutoScroll] = useState<boolean>(true);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const [cmdInput, setCmdInput] = useState<string>('');

  // Users Tab State
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  // Global Customization Form State
  const [formPanelName, setFormPanelName] = useState<string>('');
  const [formPanelLogo, setFormPanelLogo] = useState<string>('shield');
  const [formPanelLogoUrl, setFormPanelLogoUrl] = useState<string>('');
  const [settingsUpdateSuccess, setSettingsUpdateSuccess] = useState<boolean>(false);

  // Create Server Form State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formLanguage, setFormLanguage] = useState<'node' | 'python'>('node');
  const [formBindingIp, setFormBindingIp] = useState<string>('0.0.0.0');
  const [formBindingPort, setFormBindingPort] = useState<string>('4000');
  const [formMemoryLimit, setFormMemoryLimit] = useState<number>(256);
  const [formCpuLimit, setFormCpuLimit] = useState<number>(0.5);
  const [formEntryPoint, setFormEntryPoint] = useState<string>('index.js');
  const [formNodeVersion, setFormNodeVersion] = useState<string>('24-alpine');
  const [formAutoloadLibraries, setFormAutoloadLibraries] = useState<string>('');
  
  // Create Server Shields
  const [formShieldFirewall, setFormShieldFirewall] = useState<boolean>(false);
  const [formShieldRateLimit, setFormShieldRateLimit] = useState<string>('0');
  const [formShieldDdos, setFormShieldDdos] = useState<boolean>(false);
  const [formShieldIpWhitelist, setFormShieldIpWhitelist] = useState<string>('');
  const [formShieldShellAccess, setFormShieldShellAccess] = useState<boolean>(false);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit Server Form State
  const [editBindingIp, setEditBindingIp] = useState<string>('');
  const [editBindingPort, setEditBindingPort] = useState<string>('');
  const [editMemoryLimit, setEditMemoryLimit] = useState<number>(256);
  const [editCpuLimit, setEditCpuLimit] = useState<number>(0.5);
  const [editEntryPoint, setEditEntryPoint] = useState<string>('');
  const [editNodeVersion, setEditNodeVersion] = useState<string>('24-alpine');
  const [editAutoloadLibraries, setEditAutoloadLibraries] = useState<string>('');
  
  // Edit Server Shields
  const [editShieldFirewall, setEditShieldFirewall] = useState<boolean>(false);
  const [editShieldRateLimit, setEditShieldRateLimit] = useState<string>('0');
  const [editShieldDdos, setEditShieldDdos] = useState<boolean>(false);
  const [editShieldIpWhitelist, setEditShieldIpWhitelist] = useState<string>('');
  const [editShieldShellAccess, setEditShieldShellAccess] = useState<boolean>(false);
  
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState<boolean>(false);

  // Threat cockpit master state
  const [cyberShieldEngaging, setCyberShieldEngaging] = useState<boolean>(false);

  // Fetch with Authorization Headers helper
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...(options.headers || {}),
      'x-panel-token': token || ''
    } as any;
    return fetch(url, { ...options, headers });
  };

  // Perform Login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Username and password are required');
      setIsLoggingIn(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid credentials');
      }

      const data = await res.json();
      localStorage.setItem('panel_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      
      // Clear forms
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Log out
  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('panel_token');
    setToken(null);
    setCurrentUser(null);
    setServers([]);
  };

  // Verify dynamic user session on startup
  useEffect(() => {
    if (!token) return;
    const verifySession = async () => {
      try {
        const res = await authFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          // Session stale
          handleLogout();
        }
      } catch (err) {
        handleLogout();
      }
    };
    verifySession();
  }, [token]);

  // Fetch servers from backend
  const fetchServers = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/servers');
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch servers');
      const data = await res.json();
      setServers(data);
      
      // Update selected server reference if drawer is open
      if (selectedServer) {
        const updated = data.find((s: ServerConfig) => s.id === selectedServer.id);
        if (updated) {
          setSelectedServer(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching servers:', err);
      setError('Could not connect to the hosting backend panel.');
    }
  };

  // Fetch panel global settings
  const fetchSettings = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setPanelSettings(data);
        setFormPanelName(data.panelName);
        setFormPanelLogo(data.panelLogo);
        setFormPanelLogoUrl(data.panelLogoUrl);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Fetch registered users (Admin Only)
  const fetchUsers = async () => {
    if (!token || currentUser?.role !== 'admin') return;
    try {
      const res = await authFetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Initial load and health check
  useEffect(() => {
    if (!token) return;
    const init = async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/health');
        if (res.ok) {
          const health = await res.json();
          setDockerAvailable(health.dockerAvailable);
        }
        await fetchSettings();
        await fetchServers();
      } catch (err) {
        setError('Server is offline or unreachable.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  // Poll metrics, servers, and users depending on active tab
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      fetchServers();
      if (panelTab === 'users' && currentUser?.role === 'admin') {
        fetchUsers();
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [token, selectedServer, panelTab, currentUser]);

  // Fetch context depending on panel Tab
  useEffect(() => {
    if (!token) return;
    if (panelTab === 'users') {
      fetchUsers();
    } else if (panelTab === 'settings') {
      fetchSettings();
    }
  }, [panelTab, token]);

  // Load logs and files when selected server/tab changes
  useEffect(() => {
    if (!selectedServer) return;

    if (drawerTab === 'logs') {
      fetchLogs();
      const logsTimer = setInterval(fetchLogs, 3000);
      return () => clearInterval(logsTimer);
    } else if (drawerTab === 'files') {
      fetchFiles();
    } else if (drawerTab === 'settings') {
      setEditBindingIp(selectedServer.bindingIp);
      setEditBindingPort(String(selectedServer.bindingPort));
      setEditMemoryLimit(selectedServer.memoryLimit);
      setEditCpuLimit(selectedServer.cpuLimit);
      setEditEntryPoint(selectedServer.entryPoint);
      setEditNodeVersion(selectedServer.nodeVersion);
      setEditAutoloadLibraries(selectedServer.autoloadLibraries);
      
      setEditShieldFirewall(selectedServer.shieldFirewall === 1);
      setEditShieldRateLimit(String(selectedServer.shieldRateLimit));
      setEditShieldDdos(selectedServer.shieldDdos === 1);
      setEditShieldIpWhitelist(selectedServer.shieldIpWhitelist);
      setEditShieldShellAccess(selectedServer.shieldShellAccess === 1);
      
      setEditError(null);
    }
  }, [selectedServer?.id, drawerTab]);

  // Auto scroll logs
  useEffect(() => {
    if (logAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, logAutoScroll]);

  // Sync default entrypoint when language changes
  useEffect(() => {
    if (formLanguage === 'node') {
      setFormEntryPoint('index.js');
      setFormNodeVersion('24-alpine');
    } else {
      setFormEntryPoint('main.py');
    }
  }, [formLanguage]);

  // Create default next port suggestion
  useEffect(() => {
    if (servers.length > 0) {
      const maxPort = Math.max(...servers.map(s => s.bindingPort));
      if (maxPort >= 4000) {
        setFormBindingPort(String(maxPort + 1));
      }
    }
  }, [servers]);

  const fetchLogs = async () => {
    if (!selectedServer) return;
    try {
      const res = await authFetch(`/api/servers/${selectedServer.id}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const fetchFiles = async () => {
    if (!selectedServer) return;
    try {
      const res = await authFetch(`/api/servers/${selectedServer.id}`);
      if (res.ok) {
        const data = await res.json();
        setProjectFiles(data.files || []);
        
        // Auto-select entry point if no file selected yet
        if (data.files && data.files.length > 0 && !selectedFile) {
          const entryFile = data.files.find((f: ProjectFile) => f.name === data.entryPoint);
          if (entryFile) {
            loadFileContent(entryFile.name);
          } else {
            loadFileContent(data.files[0].name);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const loadFileContent = async (filename: string) => {
    if (!selectedServer) return;
    setSelectedFile(filename);
    try {
      const res = await authFetch(`/api/servers/${selectedServer.id}/files/content?filename=${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
        setOriginalContent(data.content);
      }
    } catch (err) {
      console.error('Error loading file content:', err);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedServer || !selectedFile) return;
    setIsSavingFile(true);
    try {
      const res = await authFetch(`/api/servers/${selectedServer.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile, content: fileContent })
      });
      if (res.ok) {
        setOriginalContent(fileContent);
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save file');
      }
    } catch (err) {
      console.error('Error saving file:', err);
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleCreateFile = async () => {
    if (!selectedServer || !newFileName) return;
    try {
      const res = await authFetch(`/api/servers/${selectedServer.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: newFileName, content: '# New File Created' })
      });
      if (res.ok) {
        setNewFileName('');
        setIsCreatingFile(false);
        await fetchFiles();
        loadFileContent(newFileName);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create file');
      }
    } catch (err) {
      console.error('Error creating file:', err);
    }
  };

  const handleSendCommand = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!selectedServer || !cmdInput.trim()) return;

    const cmd = cmdInput;
    setCmdInput('');

    try {
      const res = await authFetch(`/api/servers/${selectedServer.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      if (res.ok) {
        // Instantly refresh logs
        fetchLogs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send command. Ensure bot is running.');
      }
    } catch (err) {
      console.error('Error sending command:', err);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!selectedServer) return;
    if (filename === 'Dockerfile' || filename === selectedServer.entryPoint) {
      alert('Cannot delete critical service configuration files');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      const res = await authFetch(`/api/servers/${selectedServer.id}/files?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedFile === filename) {
          setSelectedFile(null);
          setFileContent('');
        }
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete file');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  // Server creation submission
  const handleCreateServer = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!formName.trim()) {
      setFormError('Server name is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await authFetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          language: formLanguage,
          bindingIp: formBindingIp,
          bindingPort: formBindingPort,
          memoryLimit: formMemoryLimit,
          cpuLimit: formCpuLimit,
          entryPoint: formEntryPoint,
          nodeVersion: formNodeVersion,
          autoloadLibraries: formAutoloadLibraries,
          shieldFirewall: formShieldFirewall,
          shieldRateLimit: formShieldRateLimit,
          shieldDdos: formShieldDdos,
          shieldIpWhitelist: formShieldIpWhitelist,
          shieldShellAccess: formShieldShellAccess
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create server');
      }

      // Reset Form
      setFormName('');
      setFormBindingIp('0.0.0.0');
      setFormAutoloadLibraries('');
      setFormShieldFirewall(false);
      setFormShieldRateLimit('0');
      setFormShieldDdos(false);
      setFormShieldIpWhitelist('');
      setFormShieldShellAccess(false);
      setIsCreateOpen(false);
      fetchServers();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Server settings update submission
  const handleUpdateConfig = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return;
    setEditError(null);
    setIsUpdatingConfig(true);

    try {
      const res = await authFetch(`/api/servers/${selectedServer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bindingIp: editBindingIp,
          bindingPort: editBindingPort,
          memoryLimit: editMemoryLimit,
          cpuLimit: editCpuLimit,
          entryPoint: editEntryPoint,
          nodeVersion: editNodeVersion,
          autoloadLibraries: editAutoloadLibraries,
          shieldFirewall: editShieldFirewall,
          shieldRateLimit: editShieldRateLimit,
          shieldDdos: editShieldDdos,
          shieldIpWhitelist: editShieldIpWhitelist,
          shieldShellAccess: editShieldShellAccess
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update server configuration');
      }

      const updated = await res.json();
      setSelectedServer(updated);
      fetchServers();
      alert('Configuration updated successfully!');
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // Bot operations: Start, Stop, Restart, Delete
  const handleStartBot = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await authFetch(`/api/servers/${id}/start`, { method: 'POST' });
      if (res.ok) fetchServers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopBot = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await authFetch(`/api/servers/${id}/stop`, { method: 'POST' });
      if (res.ok) fetchServers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartBot = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await authFetch(`/api/servers/${id}/restart`, { method: 'POST' });
      if (res.ok) fetchServers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBot = async (id: string, name: string, e?: MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete bot "${name}" and all of its source files?`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/servers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedServer?.id === id) {
          setSelectedServer(null);
        }
        fetchServers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Panel settings update (Admin Only)
  const handleUpdatePanelSettings = async (e: FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    setSettingsUpdateSuccess(false);

    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelName: formPanelName.trim(),
          panelLogo: formPanelLogo,
          panelLogoUrl: formPanelLogoUrl.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update settings');
      }

      await fetchSettings();
      setSettingsUpdateSuccess(true);
      setTimeout(() => setSettingsUpdateSuccess(false), 3000);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Create user (Admin Only)
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    setIsCreatingUser(true);

    if (!newUsername.trim() || !newPassword.trim()) {
      setUserFormError('Username and password are required');
      setIsCreatingUser(false);
      return;
    }

    try {
      const res = await authFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          role: newUserRole
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }

      setNewUsername('');
      setNewPassword('');
      setNewUserRole('user');
      await fetchUsers();
      alert('User account created successfully!');
    } catch (err) {
      setUserFormError((err as Error).message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Delete user account (Admin Only)
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user account "${username}"?`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      await fetchUsers();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Engage Cyber Shield on all active servers instantly (The massive panel protector action)
  const handleEngageMaximumShield = async () => {
    if (servers.length === 0) {
      alert('No bot servers registered to shield.');
      return;
    }
    
    setCyberShieldEngaging(true);
    let successCount = 0;

    try {
      for (const server of servers) {
        const res = await authFetch(`/api/servers/${server.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shieldFirewall: true,
            shieldDdos: true,
            shieldShellAccess: true,
            shieldRateLimit: '60' // default 60 requests/min rate limit
          })
        });
        if (res.ok) {
          successCount++;
        }
      }
      await fetchServers();
      alert(`🛡️ Cyber Shield defenses activated! Activated protection matrix for ${successCount}/${servers.length} bot services.`);
    } catch (e) {
      console.error(e);
    } finally {
      setCyberShieldEngaging(false);
    }
  };

  const formatUptime = (sec: number) => {
    if (!sec) return '0s';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Calculations for Dashboard overview
  const totalServers = servers.length;
  const runningServers = servers.filter(s => s.status === 'running').length;
  const totalAllocatedRam = servers.reduce((sum, s) => sum + s.memoryLimit, 0);
  const totalAllocatedCpu = servers.reduce((sum, s) => sum + s.cpuLimit, 0);

  // Calculate shield index
  const shieldMetrics = servers.reduce((stats, s) => {
    let count = 0;
    if (s.shieldFirewall === 1) count++;
    if (s.shieldDdos === 1) count++;
    if (s.shieldShellAccess === 1) count++;
    if (s.shieldRateLimit > 0) count++;
    if (s.shieldIpWhitelist) count++;
    return {
      active: stats.active + count,
      totalPossible: stats.totalPossible + 5
    };
  }, { active: 0, totalPossible: 0 });

  const protectionPercent = shieldMetrics.totalPossible > 0 
    ? Math.round((shieldMetrics.active / shieldMetrics.totalPossible) * 100)
    : 0;

  // Render Login page if not authenticated
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 font-sans text-gray-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="w-full max-w-md bg-[#0c1221]/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Top visual strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500" />
          
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-slate-900 border border-slate-800 rounded-2xl mb-4 shadow-inner">
              <PresetLogoIcon name={panelSettings.panelLogo} className="h-8 w-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{panelSettings.panelName}</h2>
            <p className="text-xs text-gray-400 mt-1">Authorized access only. Enter your credentials to manage servers.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-rose-950/40 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block">Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              {isLoggingIn ? 'Verifying Identity...' : 'Access Dashboard'}
            </button>
          </form>

          {/* Quick instructions */}
          <div className="mt-6 border-t border-slate-900 pt-5 text-center text-[11px] text-gray-500">
            <span className="font-semibold text-gray-400">First time starting?</span> The server automatically seeded a default admin: <code className="text-cyan-400 font-mono">admin</code> / <code className="text-cyan-400 font-mono">admin</code>. You can customize users inside the panel or run:
            <div className="mt-2 bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-gray-400 text-left border border-slate-900">
              npm run createuser admin pass admin
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-100 flex flex-col font-sans" id="app_root">
      {/* Header Grid */}
      <header className="border-b border-slate-800 bg-[#0c1220] py-4 px-6 sticky top-0 z-10 shadow-lg shadow-black/30" id="app_header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-inner border border-cyan-500/30 flex items-center justify-center">
              {panelSettings.panelLogoUrl ? (
                <img 
                  src={panelSettings.panelLogoUrl} 
                  alt="Logo" 
                  className="h-6 w-6 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <PresetLogoIcon name={panelSettings.panelLogo} className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                {panelSettings.panelName}
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 rounded-full">
                  v1.5.0
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Scale, monitor, and shield background Node.js & Python scripts 24/7</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Logged User Card */}
            <div className="flex items-center gap-2 bg-[#080d19] border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-gray-400">Logged in as:</span>
              <span className="text-white font-bold">{currentUser.username}</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-950 text-indigo-400 rounded-md border border-indigo-900/30 uppercase">
                {currentUser.role}
              </span>
              <button 
                onClick={handleLogout}
                title="Log Out"
                className="ml-2 p-1 hover:bg-slate-800 text-gray-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* System Status Indicators */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className={`w-2 h-2 rounded-full ${dockerAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-gray-300">
                {dockerAvailable ? 'Docker Engine' : 'Process Sandbox'}
              </span>
            </div>

            <button
              id="btn_create_server"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-md hover:shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Bot Project
            </button>
          </div>
        </div>
      </header>

      {/* Main navigation toolbar */}
      <div className="bg-[#090e1a] border-b border-slate-900 py-2.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs">
          <button
            onClick={() => setPanelTab('servers')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              panelTab === 'servers' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 shadow-xs' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/40'
            }`}
          >
            <Server className="h-4 w-4" /> Servers / Bots
          </button>
          <button
            onClick={() => setPanelTab('protector')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              panelTab === 'protector' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20 shadow-xs' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/40'
            }`}
          >
            <Shield className="h-4 w-4" /> Panel Protector
          </button>
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setPanelTab('users')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  panelTab === 'users' ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/20 shadow-xs' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/40'
                }`}
              >
                <Users className="h-4 w-4" /> User Management
              </button>
              <button
                onClick={() => setPanelTab('settings')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  panelTab === 'settings' ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/40'
                }`}
              >
                <Settings className="h-4 w-4" /> Customization
              </button>
            </>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6" id="app_main">
        {/* Connection Offline Bar */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-200 text-sm shadow-md">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-semibold">Backend Link Lost:</span> {error}
            </div>
            <button 
              onClick={fetchServers} 
              className="ml-auto flex items-center gap-1.5 bg-rose-900/60 hover:bg-rose-800/80 border border-rose-500/30 text-rose-100 text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {/* -------------------------------------- */}
        {/* TAB 1: SERVERS / BOTS VIEW             */}
        {/* -------------------------------------- */}
        {panelTab === 'servers' && (
          <div className="space-y-6">
            {selectedServer ? (
              /* ------------------------------------------- */
              /* DEDICATED COCKPIT / SERVER MANAGEMENT VIEW  */
              /* ------------------------------------------- */
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="server_cockpit">
                {/* Left Side: Sidebar navigation & Mini status card */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Back to server list button */}
                  <button
                    onClick={() => {
                      setSelectedServer(null);
                      fetchServers();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer text-xs font-bold shadow-xs"
                  >
                    ← Back to Servers List
                  </button>

                  {/* Server Status Dashboard card */}
                  <div className="bg-[#0e1526]/80 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${selectedServer.language === 'node' ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-cyan-500'}`} />
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">ACTIVE DECK</span>
                      <h3 className="font-black text-white text-md tracking-tight truncate" title={selectedServer.name}>
                        {selectedServer.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${
                          selectedServer.status === 'running' ? 'bg-emerald-500 animate-pulse' : 
                          selectedServer.status === 'building' ? 'bg-blue-500 animate-pulse' : 
                          selectedServer.status === 'error' ? 'bg-rose-500' : 'bg-slate-500'
                        }`} />
                        <span className="text-xs font-bold text-gray-300 capitalize font-mono">
                          {selectedServer.status}
                        </span>
                      </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/60">
                      {selectedServer.status === 'running' ? (
                        <button
                          onClick={() => handleStopBot(selectedServer.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          <Square className="h-3 w-3 fill-rose-300" /> Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartBot(selectedServer.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-emerald-300" /> Start
                        </button>
                      )}

                      <button
                        onClick={() => handleRestartBot(selectedServer.id)}
                        className="w-full flex items-center justify-center gap-1 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        title="Restart Service"
                      >
                        <RotateCw className="h-3 w-3" /> Restart
                      </button>
                    </div>
                  </div>

                  {/* Navigation Tab Menu */}
                  <div className="bg-[#0e1526]/80 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col gap-1 shadow-sm">
                    <button
                      onClick={() => setDrawerTab('logs')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                        drawerTab === 'logs' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 shadow-xs' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/40 border border-transparent'
                      }`}
                    >
                      <Terminal className="h-4 w-4" /> Live Terminal Console
                    </button>
                    <button
                      onClick={() => setDrawerTab('monitor')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                        drawerTab === 'monitor' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 shadow-xs' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/40 border border-transparent'
                      }`}
                    >
                      <Activity className="h-4 w-4" /> Resource Monitoring
                    </button>
                    <button
                      onClick={() => setDrawerTab('files')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                        drawerTab === 'files' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 shadow-xs' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/40 border border-transparent'
                      }`}
                    >
                      <Code2 className="h-4 w-4" /> Source Code Editor
                    </button>
                    <button
                      onClick={() => setDrawerTab('settings')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                        drawerTab === 'settings' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 shadow-xs' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/40 border border-transparent'
                      }`}
                    >
                      <Settings className="h-4 w-4" /> Bot Config & Protectors
                    </button>
                  </div>
                </div>

                {/* Right Side: Primary interactive workspace */}
                <div className="lg:col-span-3 bg-[#0c1221]/90 border border-slate-800 rounded-2xl p-6 shadow-sm min-h-[500px]" id="server_sub_tab_container">
                  
                  {/* TAB A: INTERACTIVE CONSOLE */}
                  {drawerTab === 'logs' && (
                    <div className="space-y-4 flex flex-col h-full">
                      <div className="flex items-center justify-between text-xs bg-slate-900/50 p-3 border border-slate-800 rounded-xl">
                        <span className="text-gray-400 font-mono flex items-center gap-1.5">
                          <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" /> Live stdout log pipeline stream
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none text-gray-300">
                            <input 
                              type="checkbox" 
                              checked={logAutoScroll} 
                              onChange={(e) => setLogAutoScroll(e.target.checked)}
                              className="accent-cyan-500"
                            />
                            Auto-Scroll Console
                          </label>
                          <button 
                            onClick={fetchLogs} 
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Refresh logs
                          </button>
                        </div>
                      </div>

                      {/* Log Terminal Canvas */}
                      <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-xs overflow-y-auto h-[380px] shadow-inner text-emerald-400 leading-relaxed whitespace-pre-wrap select-text">
                        {logs ? logs : 'Initializing log buffers... Logs will stream here shortly.'}
                        <div ref={logsEndRef} />
                      </div>

                      {/* Interactive Console Terminal Input Command */}
                      <form onSubmit={handleSendCommand} className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <span className="text-emerald-500 font-mono text-xs">bot-srv:~$</span>
                          </div>
                          <input 
                            type="text"
                            value={cmdInput}
                            onChange={(e) => setCmdInput(e.target.value)}
                            placeholder="Enter system terminal command into service stdin (e.g., npm run custom, help, test)..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-20 pr-4 py-3.5 text-xs text-white placeholder-gray-600 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono font-semibold"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <ChevronRight className="h-4 w-4" /> Send Input
                        </button>
                      </form>
                      <div className="text-[10px] text-gray-500 font-mono pl-1">
                        * Inputs are written directly to standard input (stdin) of the running service.
                      </div>
                    </div>
                  )}

                  {/* TAB B: MONITORING GAUGE VIEW */}
                  {drawerTab === 'monitor' && (
                    <div className="space-y-6">
                      {/* Live Gauges */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* CPU */}
                        <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl flex flex-col justify-between">
                          <div className="flex items-center justify-between text-gray-400 text-xs">
                            <span>CPU ALLOCATION</span>
                            <Cpu className="h-4 w-4 text-indigo-400" />
                          </div>
                          <div className="my-4">
                            <h3 className="text-3xl font-extrabold text-white">
                              {selectedServer.status === 'running' && selectedServer.metrics ? `${selectedServer.metrics.cpu}%` : '0%'}
                            </h3>
                            <span className="text-[10px] text-gray-500 font-mono">Limit: {selectedServer.cpuLimit} cores</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000"
                              style={{ width: `${selectedServer.status === 'running' && selectedServer.metrics ? Math.min((selectedServer.metrics.cpu / selectedServer.cpuLimit) * 100, 100) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Memory */}
                        <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl flex flex-col justify-between">
                          <div className="flex items-center justify-between text-gray-400 text-xs">
                            <span>MEMORY IN USE</span>
                            <HardDrive className="h-4 w-4 text-cyan-400" />
                          </div>
                          <div className="my-4">
                            <h3 className="text-3xl font-extrabold text-white">
                              {selectedServer.status === 'running' && selectedServer.metrics ? `${selectedServer.metrics.memory} MB` : '0 MB'}
                            </h3>
                            <span className="text-[10px] text-gray-500 font-mono">Max Limit: {selectedServer.memoryLimit} MB</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-cyan-500 h-1.5 rounded-full transition-all duration-1000"
                              style={{ width: `${selectedServer.status === 'running' && selectedServer.metrics ? Math.min((selectedServer.metrics.memory / selectedServer.memoryLimit) * 100, 100) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Uptime */}
                        <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl flex flex-col justify-between">
                          <div className="flex items-center justify-between text-gray-400 text-xs">
                            <span>CONTAINER UPTIME</span>
                            <Clock className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div className="my-4">
                            <h3 className="text-3xl font-extrabold text-white">
                              {selectedServer.status === 'running' && selectedServer.metrics ? formatUptime(selectedServer.metrics.uptime) : 'Offline'}
                            </h3>
                            <span className="text-[10px] text-gray-500 font-mono">Auto-restart active</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${selectedServer.status === 'running' ? 'bg-emerald-500 w-full animate-pulse' : 'bg-slate-800 w-0'}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Server Configuration Overview */}
                      <div className="bg-[#0c1221] border border-slate-800/80 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Container Isolation Specs</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                          <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg">
                            <span className="text-gray-500 block">Runtime Env</span>
                            <span className="text-gray-200 mt-1 block font-semibold">
                              {selectedServer.language === 'node' ? `Node.js ${selectedServer.nodeVersion}` : 'Python 3.11'}
                            </span>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg">
                            <span className="text-gray-500 block">Local Port Bind</span>
                            <span className="text-gray-200 mt-1 block font-semibold">{selectedServer.bindingIp}:{selectedServer.bindingPort}</span>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg">
                            <span className="text-gray-500 block">Container Type</span>
                            <span className="text-gray-200 mt-1 block font-semibold">{selectedServer.metrics?.isDocker ? 'Docker Container' : 'Isolated Subprocess'}</span>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg">
                            <span className="text-gray-500 block">Autostart Policy</span>
                            <span className="text-emerald-400 mt-1 block font-semibold">unless-stopped</span>
                          </div>
                        </div>
                      </div>

                      {/* Informational Box */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-xs text-gray-400 space-y-2">
                        <h5 className="font-bold text-gray-300 flex items-center gap-1.5">
                          <HelpCircle className="h-4 w-4 text-cyan-400" /> Container isolation explanation
                        </h5>
                        <p>
                          Every background project created receives its own unique folder space inside the hosting directory. The runtime system generates a custom <code className="text-gray-200 bg-slate-950 px-1 py-0.5 rounded font-mono">Dockerfile</code>, exposes your custom port binding, and installs package requirements recursively on launch.
                        </p>
                        <p>
                          In emulated process environments (e.g. cloud deployment sandboxes), the engine deploys isolated system subprocesses under strict PID tracking and maps logs and status directly back to SQLite.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB C: SOURCE CODE MANAGER */}
                  {drawerTab === 'files' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-h-[420px]">
                      {/* Left File List */}
                      <div className="md:col-span-1 bg-[#0c1221] border border-slate-850 rounded-xl p-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <FolderOpen className="h-3.5 w-3.5 text-cyan-400" /> Files
                          </span>
                          <button
                            onClick={() => setIsCreatingFile(!isCreatingFile)}
                            className="p-1 hover:bg-slate-800 text-cyan-400 rounded-md transition-colors cursor-pointer"
                            title="New File"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* File Creator form inline */}
                        {isCreatingFile && (
                          <div className="bg-[#080d19] border border-slate-800 p-2 rounded-lg space-y-2">
                            <input 
                              type="text" 
                              placeholder="script.js" 
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-hidden"
                            />
                            <div className="flex gap-1">
                              <button 
                                onClick={handleCreateFile}
                                className="flex-1 py-1 bg-cyan-600 text-white text-[10px] font-bold rounded-sm cursor-pointer"
                              >
                                Create
                              </button>
                              <button 
                                onClick={() => setIsCreatingFile(false)}
                                className="px-2 py-1 bg-slate-800 text-gray-400 text-[10px] font-bold rounded-sm cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        )}

                        {/* File lists */}
                        <div className="flex-1 overflow-y-auto space-y-1 max-h-[350px]">
                          {projectFiles.map((file) => (
                            <div
                              key={file.name}
                              onClick={() => loadFileContent(file.name)}
                              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                                selectedFile === file.name ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/30'
                              }`}
                            >
                              <span className="text-xs flex items-center gap-1.5 font-mono truncate">
                                <FileCode className="h-3.5 w-3.5 shrink-0" />
                                {file.name}
                              </span>
                              
                              {/* Delete specific files */}
                              {file.name !== 'Dockerfile' && file.name !== selectedServer.entryPoint && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(file.name);
                                  }}
                                  className="p-1 hover:text-rose-400 rounded-md cursor-pointer transition-all"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Editor */}
                      <div className="md:col-span-3 flex flex-col border border-slate-850 rounded-xl overflow-hidden bg-slate-950">
                        {selectedFile ? (
                          <>
                            {/* Editor Header */}
                            <div className="bg-[#0c1221] px-4 py-2 border-b border-slate-900 flex items-center justify-between text-xs">
                              <span className="font-mono text-gray-400 text-[11px] flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-cyan-400" /> Editing: <span className="text-white font-bold">{selectedFile}</span>
                                {fileContent !== originalContent && <span className="text-amber-400 animate-pulse font-bold ml-1">● UNSAVED</span>}
                              </span>

                              <div className="flex items-center gap-2">
                                {fileContent !== originalContent && (
                                  <button
                                    onClick={() => setFileContent(originalContent)}
                                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-gray-300 px-2.5 py-1 rounded-md cursor-pointer transition-all text-[11px]"
                                  >
                                    <Undo2 className="h-3 w-3" /> Revert
                                  </button>
                                )}

                                <button
                                  onClick={handleSaveFile}
                                  disabled={isSavingFile}
                                  className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-md cursor-pointer transition-all text-[11px]"
                                >
                                  <Save className="h-3 w-3" /> {isSavingFile ? 'Saving...' : 'Save File'}
                                </button>
                              </div>
                            </div>

                            {/* Textarea code field */}
                            <textarea
                              value={fileContent}
                              onChange={(e) => setFileContent(e.target.value)}
                              spellCheck={false}
                              className="flex-1 w-full bg-[#050810] text-gray-200 font-mono text-xs p-4 focus:outline-hidden focus:ring-0 leading-relaxed resize-none min-h-[380px]"
                            />
                          </>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500">
                            <Code2 className="h-10 w-10 text-slate-700 mb-2" />
                            <p className="text-xs">Select a project file from the left sidebar to start editing code.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB D: BOT CONFIGURATION */}
                  {drawerTab === 'settings' && (
                    <form onSubmit={handleUpdateConfig} className="space-y-6">
                      <div className="bg-[#0c1221] p-5 border border-slate-850 rounded-2xl space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                          <Sliders className="h-4 w-4 text-cyan-400" /> Bot Core Resources
                        </h3>
                        
                        {editError && (
                          <div className="bg-rose-950/40 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-300">
                            {editError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="text-gray-400 block font-semibold">Binding Network IP</label>
                            <input 
                              type="text" 
                              required
                              value={editBindingIp}
                              onChange={(e) => setEditBindingIp(e.target.value)}
                              className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-gray-400 block font-semibold">Binding External Port</label>
                            <input 
                              type="number" 
                              required
                              value={editBindingPort}
                              onChange={(e) => setEditBindingPort(e.target.value)}
                              className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-gray-400 block font-semibold">Allocated Memory Limit (MB)</label>
                            <select 
                              value={editMemoryLimit}
                              onChange={(e) => setEditMemoryLimit(parseInt(e.target.value, 10))}
                              className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden cursor-pointer"
                            >
                              <option value={128}>128 MB (Lite Bots)</option>
                              <option value={256}>256 MB (Standard bots)</option>
                              <option value={512}>512 MB (Heavy loops / discord.js)</option>
                              <option value={1024}>1024 MB (1GB Production bots)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-gray-400 block font-semibold">Allocated CPU Core Limit</label>
                            <select 
                              value={editCpuLimit}
                              onChange={(e) => setEditCpuLimit(parseFloat(e.target.value))}
                              className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden cursor-pointer"
                            >
                              <option value={0.25}>0.25 Cores</option>
                              <option value={0.5}>0.5 Cores</option>
                              <option value={1.0}>1.0 Cores (Production default)</option>
                              <option value={2.0}>2.0 Cores (Enterprise speed)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-gray-400 block font-semibold">Main Entry point Script</label>
                            <input 
                              type="text" 
                              required
                              value={editEntryPoint}
                              onChange={(e) => setEditEntryPoint(e.target.value)}
                              className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden"
                            />
                          </div>

                          {/* Node select */}
                          {selectedServer.language === 'node' && (
                            <div className="space-y-1.5">
                              <label className="text-gray-400 block font-semibold">Choose Node.js Version</label>
                              <select 
                                value={editNodeVersion}
                                onChange={(e) => setEditNodeVersion(e.target.value)}
                                className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden cursor-pointer"
                              >
                                <option value="24-alpine">Node.js 24 (Alpine)</option>
                                <option value="22-alpine">Node.js 22 (Alpine)</option>
                                <option value="20-alpine">Node.js 20 (Alpine)</option>
                                <option value="18-alpine">Node.js 18 (Alpine)</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Libraries autoloader */}
                        <div className="space-y-1.5 text-xs pt-2">
                          <label className="text-gray-400 block font-semibold">Autoload Libraries (Comma-separated)</label>
                          <input 
                            type="text" 
                            placeholder="express, lodash, requests, canvas"
                            value={editAutoloadLibraries}
                            onChange={(e) => setEditAutoloadLibraries(e.target.value)}
                            className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden"
                          />
                          <p className="text-[10px] text-gray-500 font-normal mt-1">
                            Input package names separated by commas. These will automatically build, install, and load when the server begins execution.
                          </p>
                        </div>
                      </div>

                      {/* Shield configurations */}
                      <div className="bg-[#0c1221] p-5 border border-slate-850 rounded-2xl space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                          <Shield className="h-4 w-4 text-amber-500" /> Server Shield Protector Matrix
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 flex items-center justify-between">
                            <div>
                              <span className="text-gray-400 block font-bold text-[10px]">ENABLE FIREWALL SHIELD</span>
                              <span className="text-gray-500 text-[9px]">Filters unauthorized access ports</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={editShieldFirewall}
                              onChange={(e) => setEditShieldFirewall(e.target.checked)}
                              className="accent-cyan-500 w-4 h-4 cursor-pointer"
                            />
                          </div>

                          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 flex items-center justify-between">
                            <div>
                              <span className="text-gray-400 block font-bold text-[10px]">DDoS ATTACK PROTECTION</span>
                              <span className="text-gray-500 text-[9px]">Protects buffers from high pings</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={editShieldDdos}
                              onChange={(e) => setEditShieldDdos(e.target.checked)}
                              className="accent-cyan-500 w-4 h-4 cursor-pointer"
                            />
                          </div>

                          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 flex items-center justify-between">
                            <div>
                              <span className="text-gray-400 block font-bold text-[10px]">RESTRICT SHELL ACCESS</span>
                              <span className="text-gray-500 text-[9px]">Locks runtime shell commands</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={editShieldShellAccess}
                              onChange={(e) => setEditShieldShellAccess(e.target.checked)}
                              className="accent-cyan-500 w-4 h-4 cursor-pointer"
                            />
                          </div>

                          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
                            <span className="text-gray-400 block font-bold text-[10px]">RATE LIMIT LIMITER</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <input 
                                type="number"
                                min="0"
                                value={editShieldRateLimit}
                                onChange={(e) => setEditShieldRateLimit(e.target.value)}
                                className="w-16 bg-slate-900 border border-slate-800 rounded px-1 text-center font-bold text-white text-xs py-0.5 focus:outline-hidden"
                              />
                              <span className="text-[10px] text-gray-400">requests / second (0 = unlimited)</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono font-bold">
                          <label className="text-gray-400 block font-sans font-bold">IP PACKET WHITELIST FILTER</label>
                          <input 
                            type="text"
                            placeholder="e.g. 192.168.1.1, 10.0.0.5"
                            value={editShieldIpWhitelist}
                            onChange={(e) => setEditShieldIpWhitelist(e.target.value)}
                            className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                          />
                          <p className="text-[10px] text-gray-500 font-sans font-normal">Comma-separated network IPs to exclusively authorize access packages.</p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdatingConfig}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
                      >
                        {isUpdatingConfig ? 'Applying Updates...' : 'Apply Modifications'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              /* ------------------------------------------- */
              /* STANDARD SERVERS LIST HOME VIEW            */
              /* ------------------------------------------- */
              <>
                {/* Overview Cards */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="section_overview">
                  <div className="bg-[#0e1526]/80 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Total Projects</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{totalServers}</h3>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg text-slate-400 border border-slate-800">
                      <Server className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="bg-[#0e1526]/80 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Active Bots</p>
                      <h3 className="text-2xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1.5">
                        {runningServers}
                        {runningServers > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block align-middle" />}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-emerald-950/30 rounded-lg text-emerald-400 border border-emerald-900/30">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="bg-[#0e1526]/80 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Allocated RAM</p>
                      <h3 className="text-2xl font-bold text-cyan-400 mt-1">{totalAllocatedRam} <span className="text-xs text-gray-400">MB</span></h3>
                    </div>
                    <div className="p-2.5 bg-cyan-950/30 rounded-lg text-cyan-400 border border-cyan-900/30">
                      <HardDrive className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="bg-[#0e1526]/80 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Shield Protection</p>
                      <h3 className="text-2xl font-bold text-amber-400 mt-1">{protectionPercent}%</h3>
                    </div>
                    <div className="p-2.5 bg-amber-950/30 rounded-lg text-amber-400 border border-amber-900/30">
                      <Shield className="h-5 w-5" />
                    </div>
                  </div>
                </section>

                {loading && servers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 bg-[#0c1220]/40 border border-slate-800/50 rounded-2xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent mb-4" />
                    <p className="text-gray-400 text-sm">Synchronizing with system containers...</p>
                  </div>
                ) : servers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-24 bg-[#0c1220]/40 border border-slate-800/50 border-dashed rounded-2xl p-6">
                    <div className="p-4 bg-slate-900 rounded-full border border-slate-800 mb-4">
                      <Server className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">No active bot projects found</h3>
                    <p className="text-gray-400 text-xs max-w-sm mt-1 mb-6">Create your first background bot configuration to begin containerized hosting.</p>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Configure First Bot
                    </button>
                  </div>
                ) : (
                  /* SINGLE VERTICAL LIST (NOT SIDE-BY-SIDE GRID) */
                  <section className="space-y-4" id="section_servers_list">
                    {servers.map((server) => {
                      const isRunning = server.status === 'running';
                      const isBuilding = server.status === 'building';
                      const isError = server.status === 'error';

                      // Calculate active shields
                      let activeShieldCount = 0;
                      if (server.shieldFirewall === 1) activeShieldCount++;
                      if (server.shieldDdos === 1) activeShieldCount++;
                      if (server.shieldShellAccess === 1) activeShieldCount++;
                      if (server.shieldRateLimit > 0) activeShieldCount++;

                      return (
                        <div
                          key={server.id}
                          id={`card_${server.id}`}
                          onClick={() => {
                            setSelectedServer(server);
                            setDrawerTab('logs'); // Default to logs/console as requested
                            setSelectedFile(null);
                          }}
                          className="bg-[#0e1526]/80 hover:bg-[#111a30]/95 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:shadow-black/20 group relative overflow-hidden"
                        >
                          {/* Language vertical color strip */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${server.language === 'node' ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-cyan-500'}`} />

                          {/* Left: Server Basic Info */}
                          <div className="flex items-center gap-3 min-w-[200px] max-w-full">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isRunning ? 'bg-emerald-500 animate-pulse' : 
                              isBuilding ? 'bg-blue-500 animate-pulse' : 
                              isError ? 'bg-rose-500' : 'bg-slate-500'
                            }`} />
                            <div className="space-y-0.5 truncate">
                              <h4 className="font-bold text-white text-md tracking-tight truncate group-hover:text-cyan-400 transition-colors">
                                {server.name}
                              </h4>
                              <p className="text-xs text-gray-400 font-mono">
                                Port: <span className="text-gray-200">{server.bindingPort}</span> | Main: <span className="text-gray-300">{server.entryPoint}</span>
                              </p>
                            </div>
                          </div>

                          {/* Middle-Left: Programming Environment Tag */}
                          <div className="shrink-0 flex items-center">
                            <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${
                              server.language === 'node' 
                                ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300' 
                                : 'bg-blue-950/40 border-blue-500/20 text-blue-300'
                            }`}>
                              <Code2 className="h-3.5 w-3.5" />
                              {server.language === 'node' ? `Node.js (${server.nodeVersion})` : 'Python'}
                            </span>
                          </div>

                          {/* Middle: Metrics info row */}
                          <div className="flex-1 grid grid-cols-3 gap-2 max-w-md font-mono text-center md:text-left text-xs">
                            <div>
                              <span className="text-[10px] text-gray-500 block uppercase font-bold">CPU Usage</span>
                              <span className={`font-semibold ${isRunning ? 'text-indigo-400' : 'text-gray-500'}`}>
                                {isRunning && server.metrics ? `${server.metrics.cpu}% / ${server.cpuLimit} cores` : `0% / ${server.cpuLimit} cores`}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block uppercase font-bold">Memory</span>
                              <span className={`font-semibold ${isRunning ? 'text-cyan-400' : 'text-gray-500'}`}>
                                {isRunning && server.metrics ? `${server.metrics.memory} MB / ${server.memoryLimit} MB` : `0 MB / ${server.memoryLimit} MB`}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block uppercase font-bold">Uptime</span>
                              <span className={`font-semibold ${isRunning ? 'text-emerald-400' : 'text-gray-500'} truncate block`}>
                                {isRunning && server.metrics ? formatUptime(server.metrics.uptime) : 'Offline'}
                              </span>
                            </div>
                          </div>

                          {/* Right: Shields Indicator and Action buttons */}
                          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                              <Shield className={`h-4 w-4 ${activeShieldCount > 0 ? 'text-amber-400 fill-amber-400/10' : 'text-slate-600'}`} />
                              <span className={`font-bold ${activeShieldCount >= 3 ? 'text-emerald-400' : activeShieldCount > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                                {activeShieldCount}/4 Protected
                              </span>
                            </div>

                            {/* Actions inline */}
                            <div className="flex items-center gap-2">
                              {isRunning ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStopBot(server.id, e);
                                    }}
                                    title="Stop bot"
                                    className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/20 text-rose-300 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Square className="h-3 w-3 fill-rose-400" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartBot(server.id, e);
                                    }}
                                    disabled={isBuilding}
                                    title="Start bot"
                                    className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/20 text-emerald-300 rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    <Play className="h-3 w-3 fill-emerald-400" />
                                  </button>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestartBot(server.id, e);
                                  }}
                                  title="Restart Container"
                                  className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                >
                                  <RotateCw className="h-3 w-3" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBot(server.id, server.name, e);
                                  }}
                                  title="Delete Bot"
                                  className="p-1.5 bg-slate-900 hover:bg-rose-950/30 hover:text-rose-400 border border-slate-800 hover:border-rose-900/30 text-slate-400 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                            </div>

                            <span className="text-[10px] text-cyan-400 font-bold group-hover:translate-x-1 transition-all flex items-center gap-0.5 font-mono ml-2">
                              OPEN PANEL <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* -------------------------------------- */}
        {/* TAB 2: PANEL PROTECTOR (SHIELDS COCKPIT) */}
        {/* -------------------------------------- */}
        {panelTab === 'protector' && (
          <div className="space-y-6">
            {/* Cybersecurity Header Cockpit */}
            <div className="bg-[#0c1221] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-slate-800 opacity-20 pointer-events-none">
                <Shield className="h-44 w-44" />
              </div>

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-500/20 text-amber-400 text-xs rounded-full font-mono">
                    <Zap className="h-3.5 w-3.5" /> DEFENSIVE ENGINE ONLINE
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Panel Security Protector Cockpit</h2>
                  <p className="text-sm text-gray-400 max-w-2xl">
                    Deploy web-protection shields across your running bot applications. Lock shell access, throttle requests with automated rate-limit thresholds, block unknown requests, and filter connection IP packets instantly.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center md:min-w-[220px]">
                  <span className="text-xs text-gray-400 font-mono">PANEL PROTECTION MATRIX</span>
                  <div className="text-3xl font-black text-amber-400 mt-1 mb-2">{protectionPercent}% Secured</div>
                  
                  <button
                    onClick={handleEngageMaximumShield}
                    disabled={cyberShieldEngaging}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    <Shield className="h-4 w-4 fill-white/10" /> 
                    {cyberShieldEngaging ? 'SHIELD ENGAGING...' : 'ENGAGE MAX DEFENSES'}
                  </button>
                </div>
              </div>
            </div>

            {/* List of servers with shield control toggles */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Bot Protection Shield Matrices ({servers.length})</h3>
              
              {servers.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/20 border border-slate-800 border-dashed rounded-xl text-gray-500 text-sm">
                  No active bot servers registered to configure shields.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {servers.map((server) => {
                    const isRunning = server.status === 'running';
                    
                    return (
                      <div 
                        key={server.id}
                        className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        {/* Server Title and Info */}
                        <div className="space-y-2 md:max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                            <h4 className="font-bold text-white text-md">{server.name}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-gray-400 rounded-md border border-slate-800">
                              {server.language}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono">
                            Port: <span className="text-gray-200 font-semibold">{server.bindingPort}</span> | 
                            Host IP: <span className="text-gray-200">{server.bindingIp}</span>
                          </p>
                        </div>

                        {/* Toggles Grid */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl text-xs font-mono">
                          {/* Firewall */}
                          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 flex items-center justify-between">
                            <div>
                              <span className="text-gray-500 block text-[10px] font-bold">FIREWALL BLOCK</span>
                              <span className={server.shieldFirewall === 1 ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                                {server.shieldFirewall === 1 ? '● PROTECTION ACTIVE' : '○ DISABLED'}
                              </span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={server.shieldFirewall === 1}
                              onChange={async (e) => {
                                const active = e.target.checked ? 1 : 0;
                                await authFetch(`/api/servers/${server.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ shieldFirewall: active })
                                });
                                fetchServers();
                              }}
                              className="accent-cyan-500 w-4 h-4 cursor-pointer"
                            />
                          </div>

                          {/* DDoS protection */}
                          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 flex items-center justify-between">
                            <div>
                              <span className="text-gray-500 block text-[10px] font-bold">DDoS PROTECTION</span>
                              <span className={server.shieldDdos === 1 ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                                {server.shieldDdos === 1 ? '● SHIELD DEPLOYED' : '○ OPEN'}
                              </span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={server.shieldDdos === 1}
                              onChange={async (e) => {
                                const active = e.target.checked ? 1 : 0;
                                await authFetch(`/api/servers/${server.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ shieldDdos: active })
                                });
                                fetchServers();
                              }}
                              className="accent-cyan-500 w-4 h-4 cursor-pointer"
                            />
                          </div>

                          {/* Rate limiter */}
                          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 flex flex-col justify-between">
                            <span className="text-gray-500 block text-[10px] font-bold">RATE LIMIT THRESHOLD</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <input 
                                type="number"
                                min="0"
                                value={server.shieldRateLimit}
                                onChange={async (e) => {
                                  const limit = parseInt(e.target.value, 10) || 0;
                                  await authFetch(`/api/servers/${server.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ shieldRateLimit: limit })
                                  });
                                  fetchServers();
                                }}
                                className="w-12 bg-slate-900 border border-slate-800 rounded px-1 text-center font-bold text-white text-xs py-0.5 focus:outline-hidden"
                              />
                              <span className="text-[10px] text-gray-400">req/s</span>
                            </div>
                          </div>

                          {/* Shell Access Restrictions */}
                          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 flex items-center justify-between">
                            <div>
                              <span className="text-gray-500 block text-[10px] font-bold">SHELL ACCESS LOCK</span>
                              <span className={server.shieldShellAccess === 1 ? 'text-rose-400 font-bold' : 'text-gray-500'}>
                                {server.shieldShellAccess === 1 ? '● RESTRICTED' : '○ OPEN'}
                              </span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={server.shieldShellAccess === 1}
                              onChange={async (e) => {
                                const active = e.target.checked ? 1 : 0;
                                await authFetch(`/api/servers/${server.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ shieldShellAccess: active })
                                });
                                fetchServers();
                              }}
                              className="accent-cyan-500 w-4 h-4 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Packet Filter details */}
                        <div className="text-xs font-mono bg-slate-950/40 p-3 border border-slate-900 rounded-xl md:min-w-[150px]">
                          <span className="text-gray-500 block text-[10px] font-bold">IP PACKET FILTER</span>
                          <input 
                            type="text"
                            placeholder="All IPs allowed"
                            value={server.shieldIpWhitelist}
                            onChange={async (e) => {
                              const val = e.target.value;
                              await authFetch(`/api/servers/${server.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ shieldIpWhitelist: val })
                                });
                              fetchServers();
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 mt-1 text-xs text-cyan-400 font-semibold focus:outline-hidden"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------- */}
        {/* TAB 3: USER MANAGEMENT (ADMIN ONLY)    */}
        {/* -------------------------------------- */}
        {panelTab === 'users' && currentUser.role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create user account column */}
            <div className="lg:col-span-1 bg-[#0c1221] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md h-fit">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <UserPlus className="h-5 w-5 text-indigo-400" />
                Create New User Account
              </h3>

              <form onSubmit={handleCreateUser} className="space-y-4">
                {userFormError && (
                  <div className="bg-rose-950/40 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{userFormError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 block">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="john_doe"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 block">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 block">System Access Privilege</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                    className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="user">User (Standard bot lifecycle control)</option>
                    <option value="admin">Administrator (Complete accounts & settings access)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isCreatingUser ? 'Deploying user...' : 'Create Account'}
                </button>
              </form>
            </div>

            {/* Registered users database column */}
            <div className="lg:col-span-2 bg-[#0c1221] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-indigo-400" />
                Active Panel Accounts ({usersList.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-gray-400">
                      <th className="py-3 px-4">USERNAME</th>
                      <th className="py-3 px-4">ROLE PRIVILEGE</th>
                      <th className="py-3 px-4">CREATED AT</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                        <td className="py-3.5 px-4 font-semibold text-white">{usr.username}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                            usr.role === 'admin' 
                              ? 'bg-indigo-950/80 border-indigo-500/20 text-indigo-400' 
                              : 'bg-slate-900 border-slate-800 text-gray-400'
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-400">{new Date(usr.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.username)}
                            className="p-1.5 hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                            title="Delete User Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------- */}
        {/* TAB 4: PANEL CUSTOMIZATION SETTINGS    */}
        {/* -------------------------------------- */}
        {panelTab === 'settings' && currentUser.role === 'admin' && (
          <div className="max-w-2xl bg-[#0c1221] border border-slate-800 rounded-2xl p-6 shadow-md mx-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Sliders className="h-5 w-5 text-cyan-400" />
              Panel Customization & Identity
            </h3>

            <form onSubmit={handleUpdatePanelSettings} className="space-y-6">
              {settingsUpdateSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Panel customization applied successfully!</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 block">Panel Title Name</label>
                <input
                  type="text"
                  required
                  placeholder="Docker Bot Hosting Panel"
                  value={formPanelName}
                  onChange={(e) => setFormPanelName(e.target.value)}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 block">Choose Panel Logo Icon</label>
                <div className="grid grid-cols-5 gap-3">
                  {['shield', 'shield-alert', 'zap', 'server', 'terminal'].map((logoName) => (
                    <button
                      key={logoName}
                      type="button"
                      onClick={() => setFormPanelLogo(logoName)}
                      className={`p-3 bg-slate-900 hover:bg-slate-850 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                        formPanelLogo === logoName ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-950/10' : 'border-slate-800 text-gray-500'
                      }`}
                    >
                      <PresetLogoIcon name={logoName} className="h-6 w-6" />
                      <span className="text-[9px] font-mono capitalize">{logoName.replace('-', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-900 pt-5">
                <label className="text-xs font-semibold text-gray-400 block">External Logo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formPanelLogoUrl}
                  onChange={(e) => setFormPanelLogoUrl(e.target.value)}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-700 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50 font-mono"
                />
                <p className="text-[10px] text-gray-500">Provide an image link to replace the default vector icons completely.</p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/10 transition-all cursor-pointer"
              >
                Apply Customizations
              </button>
            </form>
          </div>
        )}
      </main>

      {/* --- SIDE-DRAWER / MODAL FOR BOT DETAIL & CONFIG EDITOR --- */}
      <AnimatePresence>
        {selectedServer && (
          <div className="fixed inset-0 z-50 flex justify-end" id="drawer_overlay">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedServer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Content panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl h-full bg-[#0a0f1b] border-l border-slate-800 shadow-2xl flex flex-col z-10"
              id="drawer_body"
            >
              {/* Close Button & Header */}
              <div className="p-5 border-b border-slate-800 bg-[#0e1528] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedServer.language === 'node' ? 'bg-emerald-950/80 border border-emerald-500/20 text-emerald-400' : 'bg-blue-950/80 border border-blue-500/20 text-blue-400'}`}>
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {selectedServer.name}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        selectedServer.status === 'running' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {selectedServer.status}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">ID: {selectedServer.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Direct run controls in drawer header */}
                  {selectedServer.status === 'running' ? (
                    <button
                      onClick={() => handleStopBot(selectedServer.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/20 text-rose-300 text-xs rounded-lg transition-all cursor-pointer"
                    >
                      <Square className="h-3 w-3 fill-rose-300" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartBot(selectedServer.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg transition-all cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-emerald-300" /> Start
                    </button>
                  )}

                  <button
                    onClick={() => handleRestartBot(selectedServer.id)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-all cursor-pointer"
                    title="Restart"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedServer(null)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex border-b border-slate-900 bg-[#0c1221] px-4">
                <button
                  onClick={() => setDrawerTab('monitor')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerTab === 'monitor' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" /> Monitoring
                </button>
                <button
                  onClick={() => setDrawerTab('logs')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerTab === 'logs' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" /> Live Logs
                </button>
                <button
                  onClick={() => setDrawerTab('files')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerTab === 'files' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" /> Source Code
                </button>
                <button
                  onClick={() => setDrawerTab('settings')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerTab === 'settings' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Settings className="h-3.5 w-3.5" /> Configuration & Protectors
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-6" id="drawer_content">
                
                {/* 1. MONITORING TAB */}
                {drawerTab === 'monitor' && (
                  <div className="space-y-6">
                    {/* Live Gauges */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* CPU Metric Card */}
                      <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between text-gray-400 text-xs">
                          <span>CPU ALLOCATION</span>
                          <Cpu className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div className="my-4">
                          <h3 className="text-3xl font-extrabold text-white">
                            {selectedServer.status === 'running' && selectedServer.metrics ? `${selectedServer.metrics.cpu}%` : '0%'}
                          </h3>
                          <span className="text-[10px] text-gray-500 font-mono">Limit: {selectedServer.cpuLimit} cores</span>
                        </div>
                        {/* Custom progress bar */}
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${selectedServer.status === 'running' && selectedServer.metrics ? Math.min((selectedServer.metrics.cpu / selectedServer.cpuLimit) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Memory Metric Card */}
                      <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between text-gray-400 text-xs">
                          <span>MEMORY IN USE</span>
                          <HardDrive className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="my-4">
                          <h3 className="text-3xl font-extrabold text-white">
                            {selectedServer.status === 'running' && selectedServer.metrics ? `${selectedServer.metrics.memory} MB` : '0 MB'}
                          </h3>
                          <span className="text-[10px] text-gray-500 font-mono">Max Limit: {selectedServer.memoryLimit} MB</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-cyan-500 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${selectedServer.status === 'running' && selectedServer.metrics ? Math.min((selectedServer.metrics.memory / selectedServer.memoryLimit) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Uptime Metric Card */}
                      <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between text-gray-400 text-xs">
                          <span>CONTAINER UPTIME</span>
                          <Clock className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="my-4">
                          <h3 className="text-3xl font-extrabold text-white">
                            {selectedServer.status === 'running' && selectedServer.metrics ? formatUptime(selectedServer.metrics.uptime) : 'Offline'}
                          </h3>
                          <span className="text-[10px] text-gray-500 font-mono">Auto-restart active</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${selectedServer.status === 'running' ? 'bg-emerald-500 w-full animate-pulse' : 'bg-slate-800 w-0'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Server Configuration Overview */}
                    <div className="bg-[#0c1221] border border-slate-800/80 rounded-xl p-5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Container Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                        <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg">
                          <span className="text-gray-500 block">Runtime Env</span>
                          <span className="text-gray-200 mt-1 block font-semibold">
                            {selectedServer.language === 'node' ? `Node.js ${selectedServer.nodeVersion}` : 'Python 3.11'}
                          </span>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg">
                          <span className="text-gray-500 block">Local Port Bind</span>
                          <span className="text-gray-200 mt-1 block font-semibold">{selectedServer.bindingIp}:{selectedServer.bindingPort}</span>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg">
                          <span className="text-gray-500 block">Container Type</span>
                          <span className="text-gray-200 mt-1 block font-semibold">{selectedServer.metrics?.isDocker ? 'Docker Container' : 'Isolated Subprocess'}</span>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg">
                          <span className="text-gray-500 block">Autostart Policy</span>
                          <span className="text-emerald-400 mt-1 block font-semibold">unless-stopped</span>
                        </div>
                      </div>
                    </div>

                    {/* How to run instructions */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-xs text-gray-400 space-y-2">
                      <h5 className="font-bold text-gray-300 flex items-center gap-1.5">
                        <HelpCircle className="h-4 w-4 text-cyan-400" /> Container isolation explanation
                      </h5>
                      <p>
                        Every background project created receives its own unique folder space inside the hosting directory. The runtime system generates a custom <code className="text-gray-200 bg-slate-950 px-1 py-0.5 rounded font-mono">Dockerfile</code>, exposes your custom port binding, and installs package requirements recursively on launch.
                      </p>
                      <p>
                        In emulated process environments (e.g. cloud deployment sandboxes), the engine deploys isolated system subprocesses under strict PID tracking and maps logs and status directly back to SQLite.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. LOGS TAB */}
                {drawerTab === 'logs' && (
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="flex items-center justify-between text-xs bg-slate-900/50 p-2 border border-slate-800 rounded-lg">
                      <span className="text-gray-400 font-mono">STDOUT/STDERR log pipeline</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-gray-300">
                          <input 
                            type="checkbox" 
                            checked={logAutoScroll} 
                            onChange={(e) => setLogAutoScroll(e.target.checked)}
                            className="accent-cyan-500"
                          />
                          Auto-Scroll
                        </label>
                        <button 
                          onClick={fetchLogs} 
                          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-gray-300 px-2 py-1 rounded cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3" /> Refresh
                        </button>
                      </div>
                    </div>

                    {/* Log Terminal Canvas */}
                    <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[450px] min-h-[300px] shadow-inner text-emerald-400 leading-relaxed whitespace-pre-wrap select-text">
                      {logs ? logs : 'Initializing log buffers... Logs will stream here shortly.'}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                )}

                {/* 3. FILE MANAGER / EDITOR TAB */}
                {drawerTab === 'files' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-h-[450px]">
                    {/* Left File List Column */}
                    <div className="md:col-span-1 bg-[#0c1221] border border-slate-850 rounded-xl p-3 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                          <FolderOpen className="h-3.5 w-3.5 text-cyan-400" /> Files
                        </span>
                        <button
                          onClick={() => setIsCreatingFile(!isCreatingFile)}
                          className="p-1 hover:bg-slate-800 text-cyan-400 rounded-md transition-colors cursor-pointer"
                          title="New File"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* New file creation form inline */}
                      {isCreatingFile && (
                        <div className="bg-[#080d19] border border-slate-800 p-2 rounded-lg space-y-2">
                          <input 
                            type="text" 
                            placeholder="script.js" 
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-hidden"
                          />
                          <div className="flex gap-1">
                            <button 
                              onClick={handleCreateFile}
                              className="flex-1 py-1 bg-cyan-600 text-white text-[10px] font-bold rounded-sm cursor-pointer"
                            >
                              Create
                            </button>
                            <button 
                              onClick={() => setIsCreatingFile(false)}
                              className="px-2 py-1 bg-slate-800 text-gray-400 text-[10px] font-bold rounded-sm cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        </div>
                      )}

                      {/* File Items */}
                      <div className="flex-1 overflow-y-auto space-y-1 max-h-[350px]">
                        {projectFiles.map((file) => (
                          <div
                            key={file.name}
                            onClick={() => loadFileContent(file.name)}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                              selectedFile === file.name ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/30'
                            }`}
                          >
                            <span className="text-xs flex items-center gap-1.5 font-mono truncate">
                              <FileCode className="h-3.5 w-3.5 shrink-0" />
                              {file.name}
                            </span>
                            
                            {/* Delete specific files */}
                            {file.name !== 'Dockerfile' && file.name !== selectedServer.entryPoint && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFile(file.name);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded-md"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Editor Canvas Column */}
                    <div className="md:col-span-3 flex flex-col border border-slate-850 rounded-xl overflow-hidden bg-slate-950">
                      {selectedFile ? (
                        <>
                          {/* Editor header panel */}
                          <div className="bg-[#0c1221] px-4 py-2 border-b border-slate-900 flex items-center justify-between text-xs">
                            <span className="font-mono text-gray-400 text-[11px] flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 text-cyan-400" /> Editing: <span className="text-white font-bold">{selectedFile}</span>
                              {fileContent !== originalContent && <span className="text-amber-400 animate-pulse font-bold ml-1">● UNSAVED</span>}
                            </span>

                            <div className="flex items-center gap-2">
                              {fileContent !== originalContent && (
                                <button
                                  onClick={() => setFileContent(originalContent)}
                                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-400 px-2.5 py-1 rounded-md cursor-pointer transition-all text-[11px]"
                                >
                                  <Undo2 className="h-3 w-3" /> Revert
                                </button>
                              )}

                              <button
                                onClick={handleSaveFile}
                                disabled={isSavingFile}
                                className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-md cursor-pointer transition-all text-[11px]"
                              >
                                <Save className="h-3 w-3" /> {isSavingFile ? 'Saving...' : 'Save File'}
                              </button>
                            </div>
                          </div>

                          {/* Editor Code Area */}
                          <textarea
                            value={fileContent}
                            onChange={(e) => setFileContent(e.target.value)}
                            spellCheck={false}
                            className="flex-1 w-full bg-[#050810] text-gray-200 font-mono text-xs p-4 focus:outline-hidden focus:ring-0 leading-relaxed resize-none min-h-[380px]"
                          />
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500">
                          <Code2 className="h-10 w-10 text-slate-700 mb-2" />
                          <p className="text-xs">Select a project file from the left sidebar to start editing code.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. CONFIGURATION & PROTECTION TAB */}
                {drawerTab === 'settings' && (
                  <form onSubmit={handleUpdateConfig} className="space-y-6">
                    <div className="bg-[#0c1221] p-5 border border-slate-850 rounded-2xl space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                        <Sliders className="h-4 w-4 text-cyan-400" /> Bot Core Resources
                      </h3>
                      
                      {currentUser?.role !== 'admin' && (
                        <div className="bg-amber-950/20 border border-amber-500/25 p-3 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>Core resources (IP, Port, RAM, CPU) are locked and can only be updated by an Administrator.</span>
                        </div>
                      )}
                      
                      {editError && (
                        <div className="bg-rose-950/40 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-300">
                          {editError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="text-gray-400 block font-semibold">Binding Network IP</label>
                          <input 
                            type="text" 
                            required
                            disabled={currentUser?.role !== 'admin'}
                            value={editBindingIp}
                            onChange={(e) => setEditBindingIp(e.target.value)}
                            className={`w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden ${currentUser?.role !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-gray-400 block font-semibold">Binding External Port</label>
                          <input 
                            type="number" 
                            required
                            disabled={currentUser?.role !== 'admin'}
                            value={editBindingPort}
                            onChange={(e) => setEditBindingPort(e.target.value)}
                            className={`w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden ${currentUser?.role !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-gray-400 block font-semibold">Allocated Memory Limit (MB)</label>
                          <select 
                            disabled={currentUser?.role !== 'admin'}
                            value={editMemoryLimit}
                            onChange={(e) => setEditMemoryLimit(parseInt(e.target.value, 10))}
                            className={`w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden cursor-pointer ${currentUser?.role !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <option value={128}>128 MB (Lite Bots)</option>
                            <option value={256}>256 MB (Standard bots)</option>
                            <option value={512}>512 MB (Heavy loops / discord.js)</option>
                            <option value={1024}>1024 MB (1GB Production bots)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-gray-400 block font-semibold">Allocated CPU Core Limit</label>
                          <select 
                            disabled={currentUser?.role !== 'admin'}
                            value={editCpuLimit}
                            onChange={(e) => setEditCpuLimit(parseFloat(e.target.value))}
                            className={`w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden cursor-pointer ${currentUser?.role !== 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <option value={0.25}>0.25 Cores</option>
                            <option value={0.5}>0.5 Cores</option>
                            <option value={1.0}>1.0 Cores (Production default)</option>
                            <option value={2.0}>2.0 Cores (Enterprise speed)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-gray-400 block font-semibold">Main Entry point Script</label>
                          <input 
                            type="text" 
                            required
                            value={editEntryPoint}
                            onChange={(e) => setEditEntryPoint(e.target.value)}
                            className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden"
                          />
                        </div>

                        {/* Node Version Selector */}
                        {selectedServer.language === 'node' && (
                          <div className="space-y-1.5">
                            <label className="text-gray-400 block font-semibold">Choose Node.js Version</label>
                            <select 
                              value={editNodeVersion}
                              onChange={(e) => setEditNodeVersion(e.target.value)}
                              className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden cursor-pointer"
                            >
                              <option value="24-alpine">Node.js 24 (Alpine)</option>
                              <option value="22-alpine">Node.js 22 (Alpine)</option>
                              <option value="20-alpine">Node.js 20 (Alpine)</option>
                              <option value="18-alpine">Node.js 18 (Alpine)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Autoload Libraries */}
                      <div className="space-y-1.5 text-xs pt-2">
                        <label className="text-gray-400 block font-semibold">Autoload Libraries (Comma-separated)</label>
                        <input 
                          type="text" 
                          placeholder="express, lodash, request, canvas"
                          value={editAutoloadLibraries}
                          onChange={(e) => setEditAutoloadLibraries(e.target.value)}
                          className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden"
                        />
                        <p className="text-[10px] text-gray-500">
                          Input package names separated by commas. These will automatically build, install, and load when the server begins execution.
                        </p>
                      </div>
                    </div>

                    {/* Shield protector configs */}
                    <div className="bg-[#0c1221] p-5 border border-slate-850 rounded-2xl space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                        <Shield className="h-4 w-4 text-amber-500" /> Server Shield Protector Matrix
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 flex items-center justify-between">
                          <div>
                            <span className="text-gray-400 block font-bold text-[10px]">ENABLE FIREWALL SHIELD</span>
                            <span className="text-gray-500 text-[9px]">Filters unauthorized access ports</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={editShieldFirewall}
                            onChange={(e) => setEditShieldFirewall(e.target.checked)}
                            className="accent-cyan-500 w-4 h-4 cursor-pointer"
                          />
                        </div>

                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 flex items-center justify-between">
                          <div>
                            <span className="text-gray-400 block font-bold text-[10px]">DDoS ATTACK PROTECTION</span>
                            <span className="text-gray-500 text-[9px]">Protects buffers from high pings</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={editShieldDdos}
                            onChange={(e) => setEditShieldDdos(e.target.checked)}
                            className="accent-cyan-500 w-4 h-4 cursor-pointer"
                          />
                        </div>

                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 flex items-center justify-between">
                          <div>
                            <span className="text-gray-400 block font-bold text-[10px]">RESTRICT SHELL ACCESS</span>
                            <span className="text-gray-500 text-[9px]">Locks runtime shell commands</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={editShieldShellAccess}
                            onChange={(e) => setEditShieldShellAccess(e.target.checked)}
                            className="accent-cyan-500 w-4 h-4 cursor-pointer"
                          />
                        </div>

                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
                          <span className="text-gray-400 block font-bold text-[10px]">RATE LIMIT LIMITER</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <input 
                              type="number"
                              min="0"
                              value={editShieldRateLimit}
                              onChange={(e) => setEditShieldRateLimit(e.target.value)}
                              className="w-16 bg-slate-900 border border-slate-800 rounded px-1 text-center font-bold text-white text-xs py-0.5 focus:outline-hidden"
                            />
                            <span className="text-[10px] text-gray-400">requests / second (0 = unlimited)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <label className="text-gray-400 block font-bold">IP PACKET WHITELIST FILTER</label>
                        <input 
                          type="text"
                          placeholder="e.g. 192.168.1.1, 10.0.0.5"
                          value={editShieldIpWhitelist}
                          onChange={(e) => setEditShieldIpWhitelist(e.target.value)}
                          className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                        />
                        <p className="text-[10px] text-gray-500">Comma-separated network IPs to exclusively authorize access packages.</p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingConfig}
                      className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
                    >
                      {isUpdatingConfig ? 'Applying Updates...' : 'Apply Modifications'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CREATE SERVER MODAL --- */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="modal_create_server">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#0c1221] border border-slate-800 w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl z-10 overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-950 border border-cyan-500/20 text-cyan-400 rounded-lg">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Create Bot Hosting Container</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Define your background service specs and deployment sandbox.</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-lg text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateServer} className="space-y-6">
                {formError && (
                  <div className="bg-rose-950/40 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-300">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-gray-400 block font-semibold">Bot Application Name</label>
                    <input
                      type="text"
                      required
                      placeholder="telegram-alert-bot"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-400 block font-semibold">Primary Programming Environment</label>
                    <select
                      value={formLanguage}
                      onChange={(e) => setFormLanguage(e.target.value as 'node' | 'python')}
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden cursor-pointer"
                    >
                      <option value="node">Node.js Engine (JavaScript/TS)</option>
                      <option value="python">Python 3.11 Runtime (AI/Data)</option>
                    </select>
                  </div>

                  {/* Dynamic Node Version select */}
                  {formLanguage === 'node' ? (
                    <div className="space-y-1.5">
                      <label className="text-gray-400 block font-semibold">Node.js Engine Version</label>
                      <select
                        value={formNodeVersion}
                        onChange={(e) => setFormNodeVersion(e.target.value)}
                        className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden cursor-pointer"
                      >
                        <option value="24-alpine">Node.js 24 (Alpine)</option>
                        <option value="22-alpine">Node.js 22 (Alpine)</option>
                        <option value="20-alpine">Node.js 20 (Alpine)</option>
                        <option value="18-alpine">Node.js 18 (Alpine)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-gray-400 block font-semibold">Python Runtime Version</label>
                      <input 
                        type="text" 
                        disabled 
                        value="3.11-alpine" 
                        className="w-full bg-[#080d19]/50 border border-slate-800/50 text-gray-500 rounded-xl px-3 py-2 text-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-gray-400 block font-semibold">Service Entrypoint File</label>
                    <input
                      type="text"
                      required
                      placeholder="index.js"
                      value={formEntryPoint}
                      onChange={(e) => setFormEntryPoint(e.target.value)}
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-400 block font-semibold">Sandbox Port Binding</label>
                    <input
                      type="number"
                      required
                      placeholder="4000"
                      value={formBindingPort}
                      onChange={(e) => setFormBindingPort(e.target.value)}
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-400 block font-semibold">Allocated RAM Buffer (MB)</label>
                    <select
                      value={formMemoryLimit}
                      onChange={(e) => setFormMemoryLimit(parseInt(e.target.value, 10))}
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden cursor-pointer"
                    >
                      <option value={128}>128 MB (Lite Bots)</option>
                      <option value={256}>256 MB (Standard bots)</option>
                      <option value={512}>512 MB (Heavy loops / discord.js)</option>
                      <option value={1024}>1024 MB (1GB Production bots)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-400 block font-semibold">Allocated CPU Core Isolation</label>
                    <select
                      value={formCpuLimit}
                      onChange={(e) => setFormCpuLimit(parseFloat(e.target.value))}
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden cursor-pointer"
                    >
                      <option value={0.25}>0.25 Cores</option>
                      <option value={0.5}>0.5 Cores</option>
                      <option value={1.0}>1.0 Cores (Production default)</option>
                    </select>
                  </div>
                </div>

                {/* Library Autoloader */}
                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-900">
                  <label className="text-gray-400 block font-semibold">Dynamic Libraries Autoloader</label>
                  <input
                    type="text"
                    placeholder="e.g. lodash, express, dotenv, discord.js, requests"
                    value={formAutoloadLibraries}
                    onChange={(e) => setFormAutoloadLibraries(e.target.value)}
                    className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <p className="text-[10px] text-gray-500">
                    Input library names separated by commas. The system automatically fetches, installs, and locks these on boot execution.
                  </p>
                </div>

                {/* Shields on creation */}
                <div className="space-y-3 pt-3 border-t border-slate-900 text-xs font-mono">
                  <label className="text-gray-400 block font-bold font-sans">Deploy Initial Shield Protector settings</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 bg-[#080d19] p-3 rounded-xl border border-slate-850 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formShieldFirewall}
                        onChange={(e) => setFormShieldFirewall(e.target.checked)}
                        className="accent-cyan-500 h-4 w-4"
                      />
                      <div>
                        <span className="block font-bold">Firewall</span>
                        <span className="text-[9px] text-gray-500">Block extra ports</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 bg-[#080d19] p-3 rounded-xl border border-slate-850 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formShieldDdos}
                        onChange={(e) => setFormShieldDdos(e.target.checked)}
                        className="accent-cyan-500 h-4 w-4"
                      />
                      <div>
                        <span className="block font-bold">DDoS Lock</span>
                        <span className="text-[9px] text-gray-500">Defend query buffers</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 bg-[#080d19] p-3 rounded-xl border border-slate-850 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formShieldShellAccess}
                        onChange={(e) => setFormShieldShellAccess(e.target.checked)}
                        className="accent-cyan-500 h-4 w-4"
                      />
                      <div>
                        <span className="block font-bold">Shell Lock</span>
                        <span className="text-[9px] text-gray-500">Block shell exec</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Provisioning Container...' : 'Provision Bot Sandbox'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
