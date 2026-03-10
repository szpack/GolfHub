
// prisma/prisma.config.ts
import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // 从环境变量获取数据库连接字符串
    },
  },
});