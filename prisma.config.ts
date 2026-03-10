// prisma.config.ts
import { defineConfig } from 'prisma';

export default defineConfig({
  datasource: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL, // 数据库连接字符串
    },
  },
});
