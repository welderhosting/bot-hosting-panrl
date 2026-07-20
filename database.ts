import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Define the Server configuration structure
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
  shieldFirewall: number;      // 0 = off, 1 = on
  shieldRateLimit: number;     // requests/sec (0 = off)
  shieldDdos: number;          // 0 = off, 1 = on
  shieldIpWhitelist: string;   // comma-separated
  shieldShellAccess: number;   // 0 = off, 1 = on
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
}

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'dashboard.db');
const db = new Database(dbPath);

// Initialize core SQLite database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    language TEXT NOT NULL,
    binding_ip TEXT NOT NULL,
    binding_port INTEGER NOT NULL,
    memory_limit INTEGER NOT NULL,
    cpu_limit REAL NOT NULL,
    entry_point TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'stopped',
    created_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS panel_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

// Try-catch blocks to safely evolve the database schema (add columns if not exists)
const addColumnSafely = (table: string, column: string, definition: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Successfully added column ${column} to table ${table}`);
  } catch (error) {
    // Column already exists, ignore
  }
};

addColumnSafely('servers', 'node_version', "TEXT DEFAULT '24-alpine'");
addColumnSafely('servers', 'autoload_libraries', "TEXT DEFAULT ''");
addColumnSafely('servers', 'shield_firewall', "INTEGER DEFAULT 0");
addColumnSafely('servers', 'shield_rate_limit', "INTEGER DEFAULT 0");
addColumnSafely('servers', 'shield_ddos', "INTEGER DEFAULT 0");
addColumnSafely('servers', 'shield_ip_whitelist', "TEXT DEFAULT ''");
addColumnSafely('servers', 'shield_shell_access', "INTEGER DEFAULT 0");

// Helper to seed default settings
const seedSetting = (key: string, defaultValue: string) => {
  try {
    db.prepare('INSERT OR IGNORE INTO panel_settings (key, value) VALUES (?, ?)').run(key, defaultValue);
  } catch (e) {
    console.error(`Failed to seed panel setting ${key}`, e);
  }
};

seedSetting('panel_name', 'Docker Bot Hosting Panel');
seedSetting('panel_logo', 'shield'); // icon name: shield, zap, terminal, etc.
seedSetting('panel_logo_url', '');  // Optional external logo URL

export const dbHelper = {
  // Get all registered servers
  getServers(): ServerConfig[] {
    const rows = db.prepare('SELECT * FROM servers ORDER BY created_at DESC').all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      language: row.language,
      bindingIp: row.binding_ip,
      bindingPort: row.binding_port,
      memoryLimit: row.memory_limit,
      cpuLimit: row.cpu_limit,
      entryPoint: row.entry_point,
      status: row.status,
      createdAt: row.created_at,
      nodeVersion: row.node_version || '24-alpine',
      autoloadLibraries: row.autoload_libraries || '',
      shieldFirewall: row.shield_firewall || 0,
      shieldRateLimit: row.shield_rate_limit || 0,
      shieldDdos: row.shield_ddos || 0,
      shieldIpWhitelist: row.shield_ip_whitelist || '',
      shieldShellAccess: row.shield_shell_access || 0,
    }));
  },

  // Get a single server by ID
  getServerById(id: string): ServerConfig | null {
    const row = db.prepare('SELECT * FROM servers WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      language: row.language,
      bindingIp: row.binding_ip,
      bindingPort: row.binding_port,
      memoryLimit: row.memory_limit,
      cpuLimit: row.cpu_limit,
      entryPoint: row.entry_point,
      status: row.status,
      createdAt: row.created_at,
      nodeVersion: row.node_version || '24-alpine',
      autoloadLibraries: row.autoload_libraries || '',
      shieldFirewall: row.shield_firewall || 0,
      shieldRateLimit: row.shield_rate_limit || 0,
      shieldDdos: row.shield_ddos || 0,
      shieldIpWhitelist: row.shield_ip_whitelist || '',
      shieldShellAccess: row.shield_shell_access || 0,
    };
  },

  // Get a single server by Name
  getServerByName(name: string): ServerConfig | null {
    const row = db.prepare('SELECT * FROM servers WHERE name = ?').get(name) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      language: row.language,
      bindingIp: row.binding_ip,
      bindingPort: row.binding_port,
      memoryLimit: row.memory_limit,
      cpuLimit: row.cpu_limit,
      entryPoint: row.entry_point,
      status: row.status,
      createdAt: row.created_at,
      nodeVersion: row.node_version || '24-alpine',
      autoloadLibraries: row.autoload_libraries || '',
      shieldFirewall: row.shield_firewall || 0,
      shieldRateLimit: row.shield_rate_limit || 0,
      shieldDdos: row.shield_ddos || 0,
      shieldIpWhitelist: row.shield_ip_whitelist || '',
      shieldShellAccess: row.shield_shell_access || 0,
    };
  },

  // Add a new server
  createServer(config: Omit<ServerConfig, 'status' | 'createdAt'>): ServerConfig {
    const status = 'stopped';
    const createdAt = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO servers (
        id, name, language, binding_ip, binding_port, memory_limit, cpu_limit, entry_point, status, created_at,
        node_version, autoload_libraries, shield_firewall, shield_rate_limit, shield_ddos, shield_ip_whitelist, shield_shell_access
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      config.id,
      config.name,
      config.language,
      config.bindingIp,
      config.bindingPort,
      config.memoryLimit,
      config.cpuLimit,
      config.entryPoint,
      status,
      createdAt,
      config.nodeVersion || '24-alpine',
      config.autoloadLibraries || '',
      config.shieldFirewall || 0,
      config.shieldRateLimit || 0,
      config.shieldDdos || 0,
      config.shieldIpWhitelist || '',
      config.shieldShellAccess || 0
    );

    return {
      ...config,
      status,
      createdAt,
    };
  },

  // Update server status
  updateServerStatus(id: string, status: ServerConfig['status']): void {
    db.prepare('UPDATE servers SET status = ? WHERE id = ?').run(status, id);
  },

  // Update complete server config
  updateServerConfig(id: string, updates: Partial<Omit<ServerConfig, 'id' | 'createdAt'>>): void {
    const fields: string[] = [];
    const values: any[] = [];
    
    const mapping: Record<string, string> = {
      name: 'name',
      language: 'language',
      bindingIp: 'binding_ip',
      bindingPort: 'binding_port',
      memoryLimit: 'memory_limit',
      cpuLimit: 'cpu_limit',
      entryPoint: 'entry_point',
      status: 'status',
      nodeVersion: 'node_version',
      autoloadLibraries: 'autoload_libraries',
      shieldFirewall: 'shield_firewall',
      shieldRateLimit: 'shield_rate_limit',
      shieldDdos: 'shield_ddos',
      shieldIpWhitelist: 'shield_ip_whitelist',
      shieldShellAccess: 'shield_shell_access'
    };

    Object.keys(updates).forEach(key => {
      const dbCol = mapping[key];
      if (dbCol !== undefined && (updates as any)[key] !== undefined) {
        fields.push(`${dbCol} = ?`);
        values.push((updates as any)[key]);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    db.prepare(`UPDATE servers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  // Delete a server
  deleteServer(id: string): void {
    db.prepare('DELETE FROM servers WHERE id = ?').run(id);
  },

  // USER MANAGEMENT HELPERS
  getUsers(): Omit<UserAccount, 'passwordHash'>[] {
    const rows = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at ASC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      username: r.username,
      role: r.role,
      createdAt: r.created_at
    }));
  },

  getUserByUsername(username: string): UserAccount | null {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at
    };
  },

  createUser(username: string, passwordHash: string, role: 'admin' | 'user' = 'user'): UserAccount {
    const id = 'usr_' + Math.random().toString(36).substring(2, 11);
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, username, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, username, passwordHash, role, createdAt);

    return {
      id,
      username,
      passwordHash,
      role,
      createdAt
    };
  },

  deleteUser(id: string): void {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  // PANEL SETTINGS HELPERS
  getPanelSettings(): { panelName: string; panelLogo: string; panelLogoUrl: string } {
    const nameRow = db.prepare('SELECT value FROM panel_settings WHERE key = "panel_name"').get() as any;
    const logoRow = db.prepare('SELECT value FROM panel_settings WHERE key = "panel_logo"').get() as any;
    const logoUrlRow = db.prepare('SELECT value FROM panel_settings WHERE key = "panel_logo_url"').get() as any;

    return {
      panelName: nameRow?.value || 'Docker Bot Hosting Panel',
      panelLogo: logoRow?.value || 'shield',
      panelLogoUrl: logoUrlRow?.value || ''
    };
  },

  updatePanelSettings(name: string, logo: string, logoUrl: string): void {
    db.prepare('INSERT OR REPLACE INTO panel_settings (key, value) VALUES ("panel_name", ?)').run(name);
    db.prepare('INSERT OR REPLACE INTO panel_settings (key, value) VALUES ("panel_logo", ?)').run(logo);
    db.prepare('INSERT OR REPLACE INTO panel_settings (key, value) VALUES ("panel_logo_url", ?)').run(logoUrl);
  }
};

export default db;
