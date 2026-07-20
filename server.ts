import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import db, { dbHelper } from './database.js';
import { dockerManager } from './dockerManager.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON and URL encoded payloads
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper to hash passwords using standard SHA-256
  function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // Seed default admin account if no users exist in database
  const existingUsers = dbHelper.getUsers();
  if (existingUsers.length === 0) {
    const defaultPassword = 'admin'; // Clean default
    const hashed = hashPassword(defaultPassword);
    dbHelper.createUser('admin', hashed, 'admin');
    console.log('🛡️ No user accounts found. Seeded default administrator: admin / admin');
  }

  // Active user sessions stored in-memory for zero-latency, cross-origin iframe compatible authentication
  const activeSessions = new Map<string, { username: string; role: 'admin' | 'user' }>();

  // Express middleware to protect routes
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers['x-panel-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Access denied: No authentication token provided' });
    }

    const session = activeSessions.get(token);
    if (!session) {
      return res.status(401).json({ error: 'Access denied: Session has expired or is invalid' });
    }

    // Attach user credentials to request
    (req as any).user = session;
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    requireAuth(req, res, () => {
      if ((req as any).user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
      }
      next();
    });
  };

  // ==========================================
  // AUTHENTICATION API
  // ==========================================

  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
      }

      const user = dbHelper.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const hash = hashPassword(password);
      if (user.passwordHash !== hash) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Generate session token
      const token = 'token_' + crypto.randomBytes(16).toString('hex');
      activeSessions.set(token, { username: user.username, role: user.role });

      res.json({
        token,
        user: {
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = req.headers['x-panel-token'] as string;
    if (token) {
      activeSessions.delete(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.get('/api/auth/me', (req, res) => {
    const token = req.headers['x-panel-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = activeSessions.get(token);
    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }

    res.json({ user: session });
  });

  // ==========================================
  // USER ACCOUNTS MANAGEMENT (ADMIN ONLY)
  // ==========================================

  app.get('/api/users', requireAdmin, (req, res) => {
    try {
      const users = dbHelper.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/users', requireAdmin, (req, res) => {
    try {
      const { username, password, role } = req.body;
      if (!username || !password || !role) {
        return res.status(400).json({ error: 'Missing username, password, or role' });
      }

      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const existing = dbHelper.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: `Username "${username}" is already taken` });
      }

      const hashed = hashPassword(password);
      const newUser = dbHelper.createUser(username, hashed, role);

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/users/:id', requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deleting self
      const token = req.headers['x-panel-token'] as string;
      const session = activeSessions.get(token);
      
      const users = dbHelper.getUsers();
      const userToDelete = users.find(u => u.id === id);
      
      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (session && userToDelete.username === session.username) {
        return res.status(400).json({ error: 'You cannot delete your own administrator account' });
      }

      dbHelper.deleteUser(id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ==========================================
  // PANEL CUSTOMIZATION SETTINGS
  // ==========================================

  app.get('/api/settings', requireAuth, (req, res) => {
    try {
      const settings = dbHelper.getPanelSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/settings', requireAdmin, (req, res) => {
    try {
      const { panelName, panelLogo, panelLogoUrl } = req.body;
      if (!panelName || !panelLogo) {
        return res.status(400).json({ error: 'Missing panelName or panelLogo' });
      }

      dbHelper.updatePanelSettings(panelName, panelLogo, panelLogoUrl || '');
      res.json({ success: true, settings: { panelName, panelLogo, panelLogoUrl } });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ==========================================
  // HOSTING LIFECYCLE API (PROTECTED BY AUTH)
  // ==========================================

  // Health check (public)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      time: new Date().toISOString(),
      dockerAvailable: dockerManager.isDockerAvailable()
    });
  });

  // Get all registered servers/bots (Protected)
  app.get('/api/servers', requireAuth, (req, res) => {
    try {
      const servers = dbHelper.getServers();
      // Attach real-time metrics for each server if running
      const serversWithMetrics = servers.map(server => {
        const metrics = dockerManager.getMetrics(server.id);
        return {
          ...server,
          metrics: server.status === 'running' ? metrics : { cpu: 0, memory: 0, uptime: 0 }
        };
      });
      res.json(serversWithMetrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get a single server by ID (Protected)
  app.get('/api/servers/:id', requireAuth, (req, res) => {
    try {
      const server = dbHelper.getServerById(req.params.id);
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }
      const metrics = dockerManager.getMetrics(server.id);
      const files = dockerManager.getServerFiles(server.id);
      res.json({
        ...server,
        metrics,
        files
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create a new server/bot config (Protected)
  app.post('/api/servers', requireAuth, (req, res) => {
    try {
      const { 
        name, language, bindingIp, bindingPort, memoryLimit, cpuLimit, entryPoint,
        nodeVersion, autoloadLibraries,
        shieldFirewall, shieldRateLimit, shieldDdos, shieldIpWhitelist, shieldShellAccess
      } = req.body;

      if (!name || !language || !bindingIp || !bindingPort || !memoryLimit || !cpuLimit || !entryPoint) {
        return res.status(400).json({ error: 'Missing required configuration parameters' });
      }

      // Check for unique server name
      const existing = dbHelper.getServerByName(name);
      if (existing) {
        return res.status(400).json({ error: `Server name "${name}" is already taken` });
      }

      // Validate alphanumeric name for Docker friendliness
      const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '');
      if (sanitizedName !== name) {
        return res.status(400).json({ error: 'Server name can only contain alphanumeric characters, hyphens, and underscores' });
      }

      const id = 'srv_' + Math.random().toString(36).substring(2, 11);

      const newServer = dbHelper.createServer({
        id,
        name,
        language,
        bindingIp,
        bindingPort: parseInt(bindingPort, 10),
        memoryLimit: parseInt(memoryLimit, 10),
        cpuLimit: parseFloat(cpuLimit),
        entryPoint,
        nodeVersion: nodeVersion || '24-alpine',
        autoloadLibraries: autoloadLibraries || '',
        shieldFirewall: shieldFirewall ? 1 : 0,
        shieldRateLimit: shieldRateLimit ? parseInt(shieldRateLimit, 10) : 0,
        shieldDdos: shieldDdos ? 1 : 0,
        shieldIpWhitelist: shieldIpWhitelist || '',
        shieldShellAccess: shieldShellAccess ? 1 : 0
      });

      // Initialize project structure (Dockerfile, entrypoints)
      dockerManager.createServerFiles(newServer);

      res.status(201).json(newServer);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Update server config (Protected)
  app.put('/api/servers/:id', requireAuth, (req, res) => {
    try {
      const server = dbHelper.getServerById(req.params.id);
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      if (server.status === 'running' || server.status === 'building') {
        return res.status(400).json({ error: 'Cannot update configuration while the bot is active' });
      }

      const { 
        name, language, bindingIp, bindingPort, memoryLimit, cpuLimit, entryPoint,
        nodeVersion, autoloadLibraries,
        shieldFirewall, shieldRateLimit, shieldDdos, shieldIpWhitelist, shieldShellAccess
      } = req.body;
      
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (language !== undefined) updates.language = language;
      if (bindingIp !== undefined) updates.bindingIp = bindingIp;
      if (bindingPort !== undefined) updates.bindingPort = parseInt(bindingPort, 10);
      if (memoryLimit !== undefined) updates.memoryLimit = parseInt(memoryLimit, 10);
      if (cpuLimit !== undefined) updates.cpuLimit = parseFloat(cpuLimit);
      if (entryPoint !== undefined) updates.entryPoint = entryPoint;
      
      if (nodeVersion !== undefined) updates.nodeVersion = nodeVersion;
      if (autoloadLibraries !== undefined) updates.autoloadLibraries = autoloadLibraries;
      if (shieldFirewall !== undefined) updates.shieldFirewall = shieldFirewall ? 1 : 0;
      if (shieldRateLimit !== undefined) updates.shieldRateLimit = parseInt(shieldRateLimit, 10);
      if (shieldDdos !== undefined) updates.shieldDdos = shieldDdos ? 1 : 0;
      if (shieldIpWhitelist !== undefined) updates.shieldIpWhitelist = shieldIpWhitelist;
      if (shieldShellAccess !== undefined) updates.shieldShellAccess = shieldShellAccess ? 1 : 0;

      dbHelper.updateServerConfig(req.params.id, updates);
      
      // Re-generate Dockerfiles and autoload updates
      const updatedServer = dbHelper.getServerById(req.params.id)!;
      dockerManager.createServerFiles(updatedServer);

      res.json(updatedServer);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Delete a server config and clean up project folders (Protected)
  app.delete('/api/servers/:id', requireAuth, async (req, res) => {
    try {
      const server = dbHelper.getServerById(req.params.id);
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      // Stop container/process first if running
      await dockerManager.stopServer(server.id);

      // Delete filesystem files
      dockerManager.deleteServerDir(server.id);

      // Delete from DB
      dbHelper.deleteServer(server.id);

      res.json({ message: `Server ${server.name} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Bot Lifecycle API - Start Container (Protected)
  app.post('/api/servers/:id/start', requireAuth, async (req, res) => {
    try {
      const server = dbHelper.getServerById(req.params.id);
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      await dockerManager.startServer(server.id);
      res.json({ message: 'Bot service build & start sequence initiated', status: 'running' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Bot Lifecycle API - Stop Container (Protected)
  app.post('/api/servers/:id/stop', requireAuth, async (req, res) => {
    try {
      const server = dbHelper.getServerById(req.params.id);
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      await dockerManager.stopServer(server.id);
      res.json({ message: 'Bot service stopped successfully', status: 'stopped' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Bot Lifecycle API - Restart Container (Protected)
  app.post('/api/servers/:id/restart', requireAuth, async (req, res) => {
    try {
      const server = dbHelper.getServerById(req.params.id);
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      await dockerManager.restartServer(server.id);
      res.json({ message: 'Bot service restarted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Bot Logging API - Read app stdout/stderr (Protected)
  app.get('/api/servers/:id/logs', requireAuth, (req, res) => {
    try {
      const server = dbHelper.getServerById(req.params.id);
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const logs = dockerManager.getLogs(server.id);
      res.json({ logs });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // File Manager API - Read content of specific file (Protected)
  app.get('/api/servers/:id/files/content', requireAuth, (req, res) => {
    try {
      const { filename } = req.query;
      if (!filename) {
        return res.status(400).json({ error: 'Missing filename query parameter' });
      }

      const content = dockerManager.readFile(req.params.id, filename as string);
      res.json({ filename, content });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // File Manager API - Save/Overwrite file (Protected)
  app.post('/api/servers/:id/files', requireAuth, (req, res) => {
    try {
      const { filename, content } = req.body;
      if (!filename || content === undefined) {
        return res.status(400).json({ error: 'Missing filename or content payload' });
      }

      // Security validation: Prevent path traversal
      if (filename.includes('..') || filename.startsWith('/') || filename.startsWith('~')) {
        return res.status(400).json({ error: 'Invalid filename security restriction' });
      }

      dockerManager.writeFile(req.params.id, filename, content);
      res.json({ success: true, message: `File ${filename} saved successfully` });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // File Manager API - Delete a file (Protected)
  app.delete('/api/servers/:id/files', requireAuth, (req, res) => {
    try {
      const { filename } = req.query;
      if (!filename) {
        return res.status(400).json({ error: 'Missing filename parameter' });
      }

      if (filename === 'Dockerfile') {
        return res.status(400).json({ error: 'Cannot delete critical Docker configuration files' });
      }

      dockerManager.deleteFile(req.params.id, filename as string);
      res.json({ success: true, message: `File ${filename} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Integrate Vite frontend bundler / static files route
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind server exclusively to standard port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Web Hosting Panel running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
export default {};
