// 纯 ES 模块的内存模拟 Prisma 客户端实现
// 不使用任何外部依赖，避免 require 相关问题

// 内存数据存储
const store = {
  content: new Map(),
  user: new Map(),
  readingRecord: new Map(),
  contentStats: new Map()
};

// 生成唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 辅助函数：处理 where 条件
function matchesWhere(item, where) {
  if (!where) return true;
  
  for (const [key, value] of Object.entries(where)) {
    if (value === null) {
      if (item[key] !== null) return false;
    } else if (typeof value === 'object') {
      if (value.in) {
        if (!value.in.includes(item[key])) return false;
      } else if (value.notIn) {
        if (value.notIn.includes(item[key])) return false;
      } else if (value.contains) {
        if (!item[key] || !item[key].includes(value.contains)) return false;
      } else if (value.startsWith) {
        if (!item[key] || !item[key].startsWith(value.startsWith)) return false;
      } else if (value.endsWith) {
        if (!item[key] || !item[key].endsWith(value.endsWith)) return false;
      } else if (value.gt) {
        if (item[key] <= value.gt) return false;
      } else if (value.gte) {
        if (item[key] < value.gte) return false;
      } else if (value.lt) {
        if (item[key] >= value.lt) return false;
      } else if (value.lte) {
        if (item[key] > value.lte) return false;
      }
    } else {
      if (item[key] !== value) return false;
    }
  }
  
  return true;
}

// 模拟 PrismaClient 类
export class PrismaClient {
  constructor() {
    console.log('使用纯 ES 模块的内存模拟 PrismaClient');
    
    // 初始化 content 对象
    this.content = {
      findUnique: async (args) => {
        console.log('模拟 content.findUnique 调用', args);
        const { where } = args;
        
        if (where.id) {
          return store.content.get(where.id) || null;
        }
        
        // 如果没有 id，尝试其他字段
        for (const item of store.content.values()) {
          if (matchesWhere(item, where)) {
            return item;
          }
        }
        
        return null;
      },
      
      findFirst: async (args) => {
        console.log('模拟 content.findFirst 调用', args);
        const { where } = args;
        
        for (const item of store.content.values()) {
          if (matchesWhere(item, where)) {
            return item;
          }
        }
        
        return null;
      },
      
      findMany: async (args) => {
        console.log('模拟 content.findMany 调用', args);
        const { where, orderBy, take, skip } = args || {};
        
        // 过滤
        let results = Array.from(store.content.values()).filter(item => matchesWhere(item, where));
        
        // 排序
        if (orderBy) {
          const field = Object.keys(orderBy)[0];
          const direction = orderBy[field];
          
          results.sort((a, b) => {
            if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
            if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        }
        
        // 分页
        if (skip) {
          results = results.slice(skip);
        }
        
        if (take !== undefined) {
          results = results.slice(0, take);
        }
        
        return results;
      },
      
      create: async (args) => {
        console.log('模拟 content.create 调用', args);
        const { data } = args;
        const id = data.id || generateId();
        const now = new Date().toISOString();
        
        const item = {
          id,
          ...data,
          createdAt: data.createdAt || now,
          updatedAt: data.updatedAt || now
        };
        
        store.content.set(id, item);
        
        return item;
      },
      
      update: async (args) => {
        console.log('模拟 content.update 调用', args);
        const { where, data } = args;
        const id = where.id;
        
        const existingItem = store.content.get(id);
        if (!existingItem) {
          throw new Error(`找不到 ID 为 ${id} 的内容`);
        }
        
        const updatedItem = {
          ...existingItem,
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        store.content.set(id, updatedItem);
        
        return updatedItem;
      },
      
      upsert: async (args) => {
        console.log('模拟 content.upsert 调用', args);
        const { where, create, update } = args;
        
        // 先尝试查找
        const existingItem = await this.content.findFirst({ where });
        
        if (existingItem) {
          // 更新
          return this.content.update({
            where: { id: existingItem.id },
            data: update
          });
        } else {
          // 创建
          return this.content.create({ data: create });
        }
      },
      
      count: async (args) => {
        console.log('模拟 content.count 调用', args);
        const { where } = args || {};
        
        let count = 0;
        for (const item of store.content.values()) {
          if (matchesWhere(item, where)) {
            count++;
          }
        }
        
        return count;
      },
      
      delete: async (args) => {
        console.log('模拟 content.delete 调用', args);
        const { where } = args;
        const id = where.id;
        
        const existingItem = store.content.get(id);
        if (!existingItem) {
          throw new Error(`找不到 ID 为 ${id} 的内容`);
        }
        
        store.content.delete(id);
        
        return existingItem;
      }
    };
    
    // 初始化 user 对象
    this.user = {
      findUnique: async (args) => {
        console.log('模拟 user.findUnique 调用', args);
        const { where } = args;
        
        if (where.id) {
          return store.user.get(where.id) || null;
        }
        
        // 如果没有 id，尝试其他字段
        for (const item of store.user.values()) {
          if (matchesWhere(item, where)) {
            return item;
          }
        }
        
        return null;
      },
      
      findMany: async (args) => {
        console.log('模拟 user.findMany 调用', args);
        const { where } = args || {};
        
        let results = Array.from(store.user.values());
        
        if (where) {
          results = results.filter(item => matchesWhere(item, where));
        }
        
        return results;
      },
      
      create: async (args) => {
        console.log('模拟 user.create 调用', args);
        const { data } = args;
        const id = data.id || generateId();
        const now = new Date().toISOString();
        
        const item = {
          id,
          ...data,
          createdAt: data.createdAt || now,
          updatedAt: data.updatedAt || now
        };
        
        store.user.set(id, item);
        
        return item;
      },
      
      update: async (args) => {
        console.log('模拟 user.update 调用', args);
        const { where, data } = args;
        const id = where.id;
        
        const existingItem = store.user.get(id);
        if (!existingItem) {
          throw new Error(`找不到 ID 为 ${id} 的用户`);
        }
        
        const updatedItem = {
          ...existingItem,
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        store.user.set(id, updatedItem);
        
        return updatedItem;
      }
    };
    
    // 初始化 readingRecord 对象
    this.readingRecord = {
      create: async (args) => {
        console.log('模拟 readingRecord.create 调用', args);
        const { data } = args;
        const id = data.id || generateId();
        const now = new Date().toISOString();
        
        const item = {
          id,
          ...data,
          readAt: data.readAt || now
        };
        
        store.readingRecord.set(id, item);
        
        return item;
      },
      
      findMany: async (args) => {
        console.log('模拟 readingRecord.findMany 调用', args);
        const { where } = args || {};
        
        let results = Array.from(store.readingRecord.values());
        
        if (where) {
          results = results.filter(item => matchesWhere(item, where));
        }
        
        return results;
      }
    };
    
    // 初始化 contentStats 对象
    this.contentStats = {
      upsert: async (args) => {
        console.log('模拟 contentStats.upsert 调用', args);
        const { where, create, update } = args;
        
        // 查找现有记录
        let existingItem = null;
        
        for (const item of store.contentStats.values()) {
          if (item.contentId === where.contentId) {
            existingItem = item;
            break;
          }
        }
        
        if (existingItem) {
          // 更新
          const updatedItem = {
            ...existingItem,
            ...update,
            lastUpdated: new Date().toISOString()
          };
          
          store.contentStats.set(existingItem.id, updatedItem);
          
          return updatedItem;
        } else {
          // 创建
          const id = create.id || generateId();
          const now = new Date().toISOString();
          
          const newItem = {
            id,
            ...create,
            lastUpdated: now
          };
          
          store.contentStats.set(id, newItem);
          
          return newItem;
        }
      }
    };
  }
  
  async $connect() { 
    console.log('模拟 PrismaClient.$connect 调用');
    return this; 
  }
  
  async $disconnect() { 
    console.log('模拟 PrismaClient.$disconnect 调用');
    return this; 
  }
}

// 创建单例实例
export const prisma = new PrismaClient();
export default prisma;
