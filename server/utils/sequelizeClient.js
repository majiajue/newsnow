// sequelizeClient.js - 使用 Sequelize ORM 实现的数据库客户端
import { Sequelize, DataTypes, Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保数据库目录存在
const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建 Sequelize 实例
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dbDir, 'newsnow.db'),
  logging: false
});

// 定义模型
const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sourceUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true
  },
  publishDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  categories: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('metadata');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('metadata', value ? JSON.stringify(value) : null);
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'draft'
  },
  quality: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'content',
  timestamps: true,
  indexes: [
    { fields: ['sourceUrl'], unique: true },
    { fields: ['source'] },
    { fields: ['publishDate'] },
    { fields: ['status'] }
  ]
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferences: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('preferences');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('preferences', value ? JSON.stringify(value) : null);
    }
  }
}, {
  tableName: 'user',
  timestamps: true
});

const ReadingRecord = sequelize.define('ReadingRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  contentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Content,
      key: 'id'
    }
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn('datetime', 'now')
  },
  readDuration: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'readingRecord',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['contentId'] },
    { fields: ['readAt'] },
    { fields: ['userId', 'contentId'], unique: true }
  ]
});

const ContentStats = sequelize.define('ContentStats', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Content,
      key: 'id'
    },
    unique: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  likeCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  shareCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'contentStats',
  timestamps: true,
  indexes: [
    { fields: ['contentId'], unique: true }
  ]
});

// 设置关联关系
User.hasMany(ReadingRecord, { foreignKey: 'userId' });
ReadingRecord.belongsTo(User, { foreignKey: 'userId' });

Content.hasMany(ReadingRecord, { foreignKey: 'contentId' });
ReadingRecord.belongsTo(Content, { foreignKey: 'contentId' });

Content.hasOne(ContentStats, { foreignKey: 'contentId' });
ContentStats.belongsTo(Content, { foreignKey: 'contentId' });

// 初始化数据库
async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步模型到数据库
    await sequelize.sync();
    console.log('数据库表已同步');
    
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return false;
  }
}

// 处理 where 条件
function processWhereCondition(where) {
  if (!where) return {};
  
  const sequelizeWhere = {};
  
  for (const [key, value] of Object.entries(where)) {
    if (value === null) {
      sequelizeWhere[key] = null;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // 处理嵌套条件
      const nestedConditions = {};
      
      for (const [op, opValue] of Object.entries(value)) {
        switch (op) {
          case 'equals':
            sequelizeWhere[key] = opValue;
            break;
          case 'not':
            nestedConditions[Op.not] = opValue;
            break;
          case 'in':
            nestedConditions[Op.in] = opValue;
            break;
          case 'notIn':
            nestedConditions[Op.notIn] = opValue;
            break;
          case 'lt':
            nestedConditions[Op.lt] = opValue;
            break;
          case 'lte':
            nestedConditions[Op.lte] = opValue;
            break;
          case 'gt':
            nestedConditions[Op.gt] = opValue;
            break;
          case 'gte':
            nestedConditions[Op.gte] = opValue;
            break;
          case 'contains':
            nestedConditions[Op.substring] = opValue;
            break;
          case 'startsWith':
            nestedConditions[Op.startsWith] = opValue;
            break;
          case 'endsWith':
            nestedConditions[Op.endsWith] = opValue;
            break;
          default:
            // 不支持的操作符
            break;
        }
      }
      
      if (Object.keys(nestedConditions).length > 0) {
        sequelizeWhere[key] = nestedConditions;
      }
    } else {
      // 简单条件
      sequelizeWhere[key] = value;
    }
  }
  
  return sequelizeWhere;
}

// 处理 orderBy
function processOrderBy(orderBy) {
  if (!orderBy) return undefined;
  
  if (typeof orderBy === 'object' && !Array.isArray(orderBy)) {
    const [[field, direction]] = Object.entries(orderBy);
    return [[field, direction.toUpperCase()]];
  }
  
  return undefined;
}

// 处理 select
function processSelect(select) {
  if (!select) return undefined;
  
  return Object.entries(select)
    .filter(([_, include]) => include)
    .map(([field]) => field);
}

// 模拟 Prisma 客户端
class PrismaClient {
  constructor() {
    this.content = {
      findUnique: this.contentFindUnique.bind(this),
      findFirst: this.contentFindFirst.bind(this),
      findMany: this.contentFindMany.bind(this),
      create: this.contentCreate.bind(this),
      update: this.contentUpdate.bind(this),
      upsert: this.contentUpsert.bind(this),
      delete: this.contentDelete.bind(this),
      count: this.contentCount.bind(this)
    };
    
    this.user = {
      findUnique: this.userFindUnique.bind(this),
      findFirst: this.userFindFirst.bind(this),
      findMany: this.userFindMany.bind(this),
      create: this.userCreate.bind(this),
      update: this.userUpdate.bind(this),
      upsert: this.userUpsert.bind(this),
      delete: this.userDelete.bind(this),
      count: this.userCount.bind(this)
    };
    
    this.readingRecord = {
      findUnique: this.readingRecordFindUnique.bind(this),
      findFirst: this.readingRecordFindFirst.bind(this),
      findMany: this.readingRecordFindMany.bind(this),
      create: this.readingRecordCreate.bind(this),
      update: this.readingRecordUpdate.bind(this),
      upsert: this.readingRecordUpsert.bind(this),
      delete: this.readingRecordDelete.bind(this),
      count: this.readingRecordCount.bind(this)
    };
    
    this.contentStats = {
      findUnique: this.contentStatsFindUnique.bind(this),
      findFirst: this.contentStatsFindFirst.bind(this),
      findMany: this.contentStatsFindMany.bind(this),
      create: this.contentStatsCreate.bind(this),
      update: this.contentStatsUpdate.bind(this),
      upsert: this.contentStatsUpsert.bind(this),
      delete: this.contentStatsDelete.bind(this),
      count: this.contentStatsCount.bind(this)
    };
    
    // 初始化数据库
    this.initialized = false;
    this.initPromise = initDatabase().then(success => {
      this.initialized = success;
      return success;
    });
  }
  
  // Content 模型方法
  async contentFindUnique({ where, select }) {
    await this.initPromise;
    console.log('模拟 content.findUnique 调用', { where, select });
    
    const attributes = processSelect(select);
    const result = await Content.findOne({
      where: processWhereCondition(where),
      attributes
    });
    
    return result ? result.toJSON() : null;
  }
  
  async contentFindFirst({ where, orderBy, select, skip, take }) {
    await this.initPromise;
    console.log('模拟 content.findFirst 调用', { where });
    
    const attributes = processSelect(select);
    const result = await Content.findOne({
      where: processWhereCondition(where),
      order: processOrderBy(orderBy),
      attributes,
      offset: skip,
      limit: take ? 1 : undefined
    });
    
    return result ? result.toJSON() : null;
  }
  
  async contentFindMany({ where, orderBy, select, skip, take }) {
    await this.initPromise;
    console.log('模拟 content.findMany 调用', { where, orderBy, take });
    
    const attributes = processSelect(select);
    const results = await Content.findAll({
      where: processWhereCondition(where),
      order: processOrderBy(orderBy),
      attributes,
      offset: skip,
      limit: take
    });
    
    return results.map(result => result.toJSON());
  }
  
  async contentCreate({ data }) {
    await this.initPromise;
    console.log('模拟 content.create 调用', { data });
    
    const result = await Content.create(data);
    return result.toJSON();
  }
  
  async contentUpdate({ where, data }) {
    await this.initPromise;
    console.log('模拟 content.update 调用', { where, data });
    
    const [count, updated] = await Content.update(data, {
      where: processWhereCondition(where),
      returning: true
    });
    
    if (count === 0) return null;
    
    const result = await Content.findOne({
      where: processWhereCondition(where)
    });
    
    return result ? result.toJSON() : null;
  }
  
  async contentUpsert({ where, create, update }) {
    await this.initPromise;
    console.log('模拟 content.upsert 调用', { where });
    
    const existing = await Content.findOne({
      where: processWhereCondition(where)
    });
    
    if (existing) {
      await existing.update(update);
      return existing.toJSON();
    } else {
      const result = await Content.create(create);
      return result.toJSON();
    }
  }
  
  async contentDelete({ where }) {
    await this.initPromise;
    console.log('模拟 content.delete 调用', { where });
    
    const existing = await Content.findOne({
      where: processWhereCondition(where)
    });
    
    if (!existing) return null;
    
    const result = existing.toJSON();
    await existing.destroy();
    return result;
  }
  
  async contentCount({ where }) {
    await this.initPromise;
    console.log('模拟 content.count 调用', { where });
    
    const count = await Content.count({
      where: processWhereCondition(where)
    });
    
    return count;
  }
  
  // User 模型方法
  async userFindUnique({ where, select }) {
    await this.initPromise;
    console.log('模拟 user.findUnique 调用', { where });
    
    const attributes = processSelect(select);
    const result = await User.findOne({
      where: processWhereCondition(where),
      attributes
    });
    
    return result ? result.toJSON() : null;
  }
  
  async userFindFirst({ where, orderBy, select, skip, take }) {
    await this.initPromise;
    console.log('模拟 user.findFirst 调用', { where });
    
    const attributes = processSelect(select);
    const result = await User.findOne({
      where: processWhereCondition(where),
      order: processOrderBy(orderBy),
      attributes,
      offset: skip,
      limit: take ? 1 : undefined
    });
    
    return result ? result.toJSON() : null;
  }
  
  async userFindMany({ where, orderBy, select, skip, take }) {
    await this.initPromise;
    console.log('模拟 user.findMany 调用', { where });
    
    const attributes = processSelect(select);
    const results = await User.findAll({
      where: processWhereCondition(where),
      order: processOrderBy(orderBy),
      attributes,
      offset: skip,
      limit: take
    });
    
    return results.map(result => result.toJSON());
  }
  
  async userCreate({ data }) {
    await this.initPromise;
    console.log('模拟 user.create 调用', { data });
    
    const result = await User.create(data);
    return result.toJSON();
  }
  
  async userUpdate({ where, data }) {
    await this.initPromise;
    console.log('模拟 user.update 调用', { where, data });
    
    const [count, updated] = await User.update(data, {
      where: processWhereCondition(where),
      returning: true
    });
    
    if (count === 0) return null;
    
    const result = await User.findOne({
      where: processWhereCondition(where)
    });
    
    return result ? result.toJSON() : null;
  }
  
  async userUpsert({ where, create, update }) {
    await this.initPromise;
    console.log('模拟 user.upsert 调用', { where });
    
    const existing = await User.findOne({
      where: processWhereCondition(where)
    });
    
    if (existing) {
      await existing.update(update);
      return existing.toJSON();
    } else {
      const result = await User.create(create);
      return result.toJSON();
    }
  }
  
  async userDelete({ where }) {
    await this.initPromise;
    console.log('模拟 user.delete 调用', { where });
    
    const existing = await User.findOne({
      where: processWhereCondition(where)
    });
    
    if (!existing) return null;
    
    const result = existing.toJSON();
    await existing.destroy();
    return result;
  }
  
  async userCount({ where }) {
    await this.initPromise;
    console.log('模拟 user.count 调用', { where });
    
    const count = await User.count({
      where: processWhereCondition(where)
    });
    
    return count;
  }
  
  // ReadingRecord 模型方法
  async readingRecordFindUnique({ where, select }) {
    await this.initPromise;
    console.log('模拟 readingRecord.findUnique 调用', { where });
    
    const attributes = processSelect(select);
    const result = await ReadingRecord.findOne({
      where: processWhereCondition(where),
      attributes
    });
    
    return result ? result.toJSON() : null;
  }
  
  async readingRecordFindFirst({ where, orderBy, select, skip, take }) {
    await this.initPromise;
    console.log('模拟 readingRecord.findFirst 调用', { where });
    
    const attributes = processSelect(select);
    const result = await ReadingRecord.findOne({
      where: processWhereCondition(where),
      order: processOrderBy(orderBy),
      attributes,
      offset: skip,
      limit: take ? 1 : undefined
    });
    
    return result ? result.toJSON() : null;
  }
  
  async readingRecordFindMany({ where, orderBy, select, skip, take }) {
    await this.initPromise;
    console.log('模拟 readingRecord.findMany 调用', { where });
    
    const attributes = processSelect(select);
    const results = await ReadingRecord.findAll({
      where: processWhereCondition(where),
      order: processOrderBy(orderBy),
      attributes,
      offset: skip,
      limit: take
    });
    
    return results.map(result => result.toJSON());
  }
  
  async readingRecordCreate({ data }) {
    await this.initPromise;
    console.log('模拟 readingRecord.create 调用', { data });
    
    const result = await ReadingRecord.create(data);
    return result.toJSON();
  }
  
  async readingRecordUpdate({ where, data }) {
    await this.initPromise;
    console.log('模拟 readingRecord.update 调用', { where, data });
    
    const [count, updated] = await ReadingRecord.update(data, {
      where: processWhereCondition(where),
      returning: true
    });
    
    if (count === 0) return null;
    
    const result = await ReadingRecord.findOne({
      where: processWhereCondition(where)
    });
    
    return result ? result.toJSON() : null;
  }
  
  async readingRecordUpsert({ where, create, update }) {
    await this.initPromise;
    console.log('模拟 readingRecord.upsert 调用', { where });
    
    const existing = await ReadingRecord.findOne({
      where: processWhereCondition(where)
    });
    
    if (existing) {
      await existing.update(update);
      return existing.toJSON();
    } else {
      const result = await ReadingRecord.create(create);
      return result.toJSON();
    }
  }
  
  async readingRecordDelete({ where }) {
    await this.initPromise;
    console.log('模拟 readingRecord.delete 调用', { where });
    
    const existing = await ReadingRecord.findOne({
      where: processWhereCondition(where)
    });
    
    if (!existing) return null;
    
    const result = existing.toJSON();
    await existing.destroy();
    return result;
  }
  
  async readingRecordCount({ where }) {
    await this.initPromise;
    console.log('模拟 readingRecord.count 调用', { where });
    
    const count = await ReadingRecord.count({
      where: processWhereCondition(where)
    });
    
    return count;
  }
  
  // ContentStats 模型方法
  async contentStatsFindUnique({ where, select }) {
    await this.initPromise;
    console.log('模拟 contentStats.findUnique 调用', { where });
    
    const attributes = processSelect(select);
    const result = await ContentStats.findOne({
      where: processWhereCondition(where),
      attributes
    });
    
    return result ? result.toJSON() : null;
  }
  
  async contentStatsFindFirst({ where, orderBy, select, skip, take }) {
    await this.initPromise;
    console.log('模拟 contentStats.findFirst 调用', { where });
    
    const attributes = processSelect(select);
    const result = await ContentStats.findOne({
      where: processWhereCondition(where),
      order: processOrderBy(orderBy),
      attributes,
      offset: skip,
      limit: take ? 1 : undefined
    });
    
    return result ? result.toJSON() : null;
  }
  
  async contentStatsFindMany({ where, orderBy, select, skip, take }) {
    await this.initPromise;
    console.log('模拟 contentStats.findMany 调用', { where });
    
    const attributes = processSelect(select);
    const results = await ContentStats.findAll({
      where: processWhereCondition(where),
      order: processOrderBy(orderBy),
      attributes,
      offset: skip,
      limit: take
    });
    
    return results.map(result => result.toJSON());
  }
  
  async contentStatsCreate({ data }) {
    await this.initPromise;
    console.log('模拟 contentStats.create 调用', { data });
    
    const result = await ContentStats.create(data);
    return result.toJSON();
  }
  
  async contentStatsUpdate({ where, data }) {
    await this.initPromise;
    console.log('模拟 contentStats.update 调用', { where, data });
    
    const [count, updated] = await ContentStats.update(data, {
      where: processWhereCondition(where),
      returning: true
    });
    
    if (count === 0) return null;
    
    const result = await ContentStats.findOne({
      where: processWhereCondition(where)
    });
    
    return result ? result.toJSON() : null;
  }
  
  async contentStatsUpsert({ where, create, update }) {
    await this.initPromise;
    console.log('模拟 contentStats.upsert 调用', { where });
    
    const existing = await ContentStats.findOne({
      where: processWhereCondition(where)
    });
    
    if (existing) {
      await existing.update(update);
      return existing.toJSON();
    } else {
      const result = await ContentStats.create(create);
      return result.toJSON();
    }
  }
  
  async contentStatsDelete({ where }) {
    await this.initPromise;
    console.log('模拟 contentStats.delete 调用', { where });
    
    const existing = await ContentStats.findOne({
      where: processWhereCondition(where)
    });
    
    if (!existing) return null;
    
    const result = existing.toJSON();
    await existing.destroy();
    return result;
  }
  
  async contentStatsCount({ where }) {
    await this.initPromise;
    console.log('模拟 contentStats.count 调用', { where });
    
    const count = await ContentStats.count({
      where: processWhereCondition(where)
    });
    
    return count;
  }
  
  // 连接/断开连接方法
  async connect() {
    await this.initPromise;
    console.log('Sequelize 客户端已连接');
  }
  
  async disconnect() {
    await sequelize.close();
    console.log('Sequelize 客户端已断开连接');
  }
}

// 创建并导出 PrismaClient 实例
const prisma = new PrismaClient();
console.log('使用 Sequelize ORM 实现的持久化数据库客户端');

export { PrismaClient };
export default prisma;
