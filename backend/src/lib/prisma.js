require('./load-env')();

const { PrismaClient } = require('@prisma/client');

const DB_CONNECT_TIMEOUT_SECONDS = Math.max(
  1,
  Number.parseInt(process.env.DB_CONNECT_TIMEOUT_SECONDS || '10', 10) || 10,
);
const DB_POOL_TIMEOUT_SECONDS = Math.max(
  1,
  Number.parseInt(process.env.DB_POOL_TIMEOUT_SECONDS || '10', 10) || 10,
);
const DB_QUERY_TIMEOUT_MS = Math.max(
  1000,
  Number.parseInt(process.env.DB_QUERY_TIMEOUT_MS || '10000', 10) || 10000,
);

function appendQueryParam(url, key, value) {
  if (!url || url.includes(`${key}=`)) return url;
  return url + (url.includes('?') ? '&' : '?') + `${key}=${value}`;
}

// Supabase Session/Transaction mode fixes
const base = process.env.DATABASE_URL ?? '';
const isPGBouncer = base.includes(':6543'); // Supabase default pooling port

if (!base) {
  console.error("[Prisma] CRITICAL: DATABASE_URL is not set. Check your Vercel Environment Variables.");
}

// Aggressive timeouts for Serverless/Supabase stability
const DB_CONNECT_TIMEOUT = 20; // 20 seconds
const DB_POOL_TIMEOUT = 20;    // 20 seconds
const DB_STATEMENT_TIMEOUT = 15000; // 15 seconds

let url = appendQueryParam(base, 'connection_limit', 1);
url = appendQueryParam(url, 'connect_timeout', DB_CONNECT_TIMEOUT);
url = appendQueryParam(url, 'pool_timeout', DB_POOL_TIMEOUT);

if (isPGBouncer || base.includes('supabase.co')) {
  url = appendQueryParam(url, 'pgbouncer', 'true');
}

// Statement timeout to prevent hanging connections
url = appendQueryParam(url, 'statement_timeout', DB_STATEMENT_TIMEOUT);

// Prisma client should be a singleton in serverless environments
// to prevent exhausting database connections during horizontal scaling.
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ datasources: { db: { url } } });
} else {
  // In development, we use global to allow HMR without leaking connections
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({ datasources: { db: { url } } });
  }
  prisma = global.cachedPrisma;
}

function withDatabaseTimeout(execute, label) {
  let timeoutId;

  return Promise.race([
    execute(),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        const error = new Error(
          `Database request timed out after ${DB_QUERY_TIMEOUT_MS}ms (${label}).`,
        );
        error.code = 'DB_TIMEOUT';
        reject(error);
      }, DB_QUERY_TIMEOUT_MS);
    }),
  ]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

async function withRetry(operation, maxRetries = 2, delayMs = 1000) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const isRetryable = 
        err.message?.includes('pool') || 
        err.message?.includes('timeout') || 
        err.code === 'P2024' || // Connection pool timeout
        err.code === 'P2025';    // Transient not found/connection issues
      
      if (!isRetryable || i === maxRetries) break;
      
      console.warn(`[Prisma] Operation failed (attempt ${i + 1}/${maxRetries + 1}). Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

const prismaWithTimeout = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        return withRetry(() => 
          withDatabaseTimeout(
            () => query(args),
            `${model}.${operation}`,
          )
        );
      },
    },
    async $allOperations({ model, operation, args, query }) {
      return withRetry(() => 
        withDatabaseTimeout(
          () => query(args),
          `${model || 'raw'}.${operation}`,
        )
      );
    },
  },
});

module.exports = prismaWithTimeout;
