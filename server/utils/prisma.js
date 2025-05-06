// ESM 兼容的 Prisma 客户端包装器
import { PrismaClient } from '../../prisma/client'

const prisma = new PrismaClient()

export { prisma }
export default prisma
