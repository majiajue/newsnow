// SQLite 客户端实现，替代 Prisma
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库路径
const DB_PATH = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.replace('file:', '') 
  : path.join(__dirname, '../../database/newsnow.db');

console.log('使用数据库路径:', DB_PATH);

// 确保数据库目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(DB_PATH);

// 初始化数据库表
function initDatabase() {
  // 创建 content 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT,
      sourceUrl TEXT,
      author TEXT,
      publishDate TEXT,
      categories TEXT,
      tags TEXT,
      keywords TEXT,
      summary TEXT,
      quality REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      parentId TEXT,
      metadata TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_content_source ON content(source);
    CREATE INDEX IF NOT EXISTS idx_content_sourceUrl ON content(sourceUrl);
    CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
    CREATE INDEX IF NOT EXISTS idx_content_publishDate ON content(publishDate);
  `);
  
  // 创建 user 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // 创建 readingRecord 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS readingRecord (
      id TEXT PRIMARY KEY,
      contentId TEXT NOT NULL,
      userId TEXT,
      clientIp TEXT,
      readAt TEXT DEFAULT CURRENT_TIMESTAMP,
      duration INTEGER,
      metadata TEXT
    );
  `);
  
  // 创建 contentStats 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS contentStats (
      id TEXT PRIMARY KEY,
      contentId TEXT UNIQUE NOT NULL,
      views INTEGER DEFAULT 0,
      uniqueViews INTEGER DEFAULT 0,
      avgReadTime REAL DEFAULT 0,
      lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 初始化数据库
try {
  initDatabase();
  console.log('SQLite 数据库初始化成功');
} catch (error) {
  console.error('SQLite 数据库初始化失败:', error);
}

// 模拟 Prisma 客户端接口
class PrismaClient {
  constructor() {
    console.log('使用 SQLite 客户端');
    
    // Content 模型
    this.content = {
      findUnique: async (args) => {
        const { where } = args;
        const id = where.id;
        
        const stmt = db.prepare('SELECT * FROM content WHERE id = ?');
        return stmt.get(id);
      },
      
      findFirst: async (args) => {
        const { where } = args;
        let query = 'SELECT * FROM content WHERE 1=1';
        const params = [];
        
        if (where) {
          if (where.sourceUrl) {
            query += ' AND sourceUrl = ?';
            params.push(where.sourceUrl);
          }
          
          if (where.source) {
            query += ' AND source = ?';
            params.push(where.source);
          }
          
          if (where.status) {
            query += ' AND status = ?';
            params.push(where.status);
          }
        }
        
        query += ' LIMIT 1';
        
        const stmt = db.prepare(query);
        return stmt.get(...params);
      },
      
      findMany: async (args) => {
        const { where, orderBy, take, skip } = args || {};
        let query = 'SELECT * FROM content WHERE 1=1';
        const params = [];
        
        if (where) {
          if (where.source) {
            query += ' AND source = ?';
            params.push(where.source);
          }
          
          if (where.status) {
            query += ' AND status = ?';
            params.push(where.status);
          }
          
          if (where.sourceUrl && where.sourceUrl.in) {
            const placeholders = where.sourceUrl.in.map(() => '?').join(',');
            query += ` AND sourceUrl IN (${placeholders})`;
            params.push(...where.sourceUrl.in);
          }
        }
        
        if (orderBy) {
          const field = Object.keys(orderBy)[0];
          const direction = orderBy[field] === 'desc' ? 'DESC' : 'ASC';
          query += ` ORDER BY ${field} ${direction}`;
        }
        
        if (take) {
          query += ' LIMIT ?';
          params.push(take);
        }
        
        if (skip) {
          query += ' OFFSET ?';
          params.push(skip);
        }
        
        const stmt = db.prepare(query);
        return stmt.all(...params);
      },
      
      create: async (args) => {
        const { data } = args;
        const id = data.id || crypto.randomUUID();
        
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(',');
        const values = fields.map(field => data[field]);
        
        const query = `INSERT INTO content (id, ${fields.join(',')}) VALUES (?, ${placeholders})`;
        
        try {
          const stmt = db.prepare(query);
          stmt.run(id, ...values);
          
          return { id, ...data };
        } catch (error) {
          console.error('创建内容失败:', error);
          throw error;
        }
      },
      
      update: async (args) => {
        const { where, data } = args;
        const id = where.id;
        
        const fields = Object.keys(data);
        const setClause = fields.map(field => `${field} = ?`).join(',');
        const values = fields.map(field => data[field]);
        
        const query = `UPDATE content SET ${setClause} WHERE id = ?`;
        
        try {
          const stmt = db.prepare(query);
          stmt.run(...values, id);
          
          return { id, ...data };
        } catch (error) {
          console.error('更新内容失败:', error);
          throw error;
        }
      },
      
      upsert: async (args) => {
        const { where, create, update } = args;
        
        // 先尝试查找
        const existing = await this.content.findFirst({ where });
        
        if (existing) {
          // 更新
          return this.content.update({
            where: { id: existing.id },
            data: update
          });
        } else {
          // 创建
          return this.content.create({ data: create });
        }
      },
      
      count: async (args) => {
        const { where } = args || {};
        let query = 'SELECT COUNT(*) as count FROM content WHERE 1=1';
        const params = [];
        
        if (where) {
          if (where.source) {
            query += ' AND source = ?';
            params.push(where.source);
          }
          
          if (where.status) {
            query += ' AND status = ?';
            params.push(where.status);
          }
        }
        
        const stmt = db.prepare(query);
        const result = stmt.get(...params);
        return result.count;
      },
      
      delete: async (args) => {
        const { where } = args;
        const id = where.id;
        
        const query = 'DELETE FROM content WHERE id = ?';
        
        try {
          const stmt = db.prepare(query);
          stmt.run(id);
          
          return { id };
        } catch (error) {
          console.error('删除内容失败:', error);
          throw error;
        }
      }
    };
    
    // User 模型
    this.user = {
      findUnique: async (args) => {
        const { where } = args;
        let query = 'SELECT * FROM user WHERE 1=1';
        const params = [];
        
        if (where.id) {
          query += ' AND id = ?';
          params.push(where.id);
        }
        
        if (where.username) {
          query += ' AND username = ?';
          params.push(where.username);
        }
        
        if (where.email) {
          query += ' AND email = ?';
          params.push(where.email);
        }
        
        const stmt = db.prepare(query);
        return stmt.get(...params);
      },
      
      findMany: async (args) => {
        const { where } = args || {};
        let query = 'SELECT * FROM user WHERE 1=1';
        const params = [];
        
        if (where && where.role) {
          query += ' AND role = ?';
          params.push(where.role);
        }
        
        const stmt = db.prepare(query);
        return stmt.all(...params);
      }
    };
    
    // ReadingRecord 模型
    this.readingRecord = {
      create: async (args) => {
        const { data } = args;
        const id = data.id || crypto.randomUUID();
        
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(',');
        const values = fields.map(field => data[field]);
        
        const query = `INSERT INTO readingRecord (id, ${fields.join(',')}) VALUES (?, ${placeholders})`;
        
        try {
          const stmt = db.prepare(query);
          stmt.run(id, ...values);
          
          return { id, ...data };
        } catch (error) {
          console.error('创建阅读记录失败:', error);
          throw error;
        }
      },
      
      findMany: async (args) => {
        const { where } = args || {};
        let query = 'SELECT * FROM readingRecord WHERE 1=1';
        const params = [];
        
        if (where) {
          if (where.contentId) {
            query += ' AND contentId = ?';
            params.push(where.contentId);
          }
          
          if (where.userId) {
            query += ' AND userId = ?';
            params.push(where.userId);
          }
        }
        
        const stmt = db.prepare(query);
        return stmt.all(...params);
      }
    };
    
    // ContentStats 模型
    this.contentStats = {
      upsert: async (args) => {
        const { where, create, update } = args;
        
        // 查找现有记录
        const stmt = db.prepare('SELECT * FROM contentStats WHERE contentId = ?');
        const existing = stmt.get(where.contentId);
        
        if (existing) {
          // 更新
          const fields = Object.keys(update);
          const setClause = fields.map(field => `${field} = ?`).join(',');
          const values = fields.map(field => update[field]);
          
          const updateStmt = db.prepare(`UPDATE contentStats SET ${setClause} WHERE id = ?`);
          updateStmt.run(...values, existing.id);
          
          return { ...existing, ...update };
        } else {
          // 创建
          const id = create.id || crypto.randomUUID();
          
          const fields = Object.keys(create);
          const placeholders = fields.map(() => '?').join(',');
          const values = fields.map(field => create[field]);
          
          const insertStmt = db.prepare(`INSERT INTO contentStats (id, ${fields.join(',')}) VALUES (?, ${placeholders})`);
          insertStmt.run(id, ...values);
          
          return { id, ...create };
        }
      }
    };
  }
  
  async $connect() { 
    console.log('SQLite 客户端已连接');
    return this; 
  }
  
  async $disconnect() { 
    console.log('SQLite 客户端已断开连接');
    return this; 
  }
}

// 创建并导出实例
export const prisma = new PrismaClient();
export { PrismaClient };
export default prisma;
