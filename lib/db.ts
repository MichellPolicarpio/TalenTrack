import sql from "mssql";

export { sql };

let pool: sql.ConnectionPool | null = null;
let connectPromise: Promise<sql.ConnectionPool> | null = null;

function createConfig(): sql.config {
  const server = process.env.AZURE_SQL_SERVER?.trim() ?? "";
  const database = process.env.AZURE_SQL_DATABASE?.trim() ?? "";
  const clientId = process.env.AZURE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.AZURE_CLIENT_SECRET?.trim() ?? "";
  const tenantId = process.env.AZURE_TENANT_ID?.trim() ?? "";

  if (!server) throw new Error("SAFESHIELD: Missing AZURE_SQL_SERVER");
  if (!database) throw new Error("SAFESHIELD: Missing AZURE_SQL_DATABASE");
  
  const authMode = process.env.AZURE_SQL_AUTH_MODE?.trim().toLowerCase();
  let authentication: sql.config["authentication"];

  if (authMode === "sql") {
    const user = process.env.AZURE_SQL_USER?.trim() ?? process.env.SQL_USER?.trim() ?? "";
    const password = process.env.AZURE_SQL_PASSWORD?.trim() ?? process.env.SQL_PASSWORD?.trim() ?? "";
    if (!user || !password) throw new Error("SAFESHIELD: Missing AZURE_SQL_USER or AZURE_SQL_PASSWORD for sql auth mode");
    authentication = {
      type: "default",
      options: {
        userName: user,
        password: password,
      },
    };
  } else {
    // AAD SP Authentication
    if (!clientId) throw new Error("SAFESHIELD: Missing AZURE_CLIENT_ID for Azure AD Auth");
    if (!clientSecret) throw new Error("SAFESHIELD: Missing AZURE_CLIENT_SECRET for Azure AD Auth");
    if (!tenantId) throw new Error("SAFESHIELD: Missing AZURE_TENANT_ID for Azure AD Auth");
    authentication = {
      type: "azure-active-directory-service-principal-secret",
      options: {
        clientId,
        clientSecret,
        tenantId,
      },
    };
  }

  return {
    server,
    database,
    authentication,
    connectionTimeout: 15000,
    requestTimeout: 15000,
    options: {
      encrypt: true,
      trustServerCertificate: process.env.AZURE_SQL_TRUST_SERVER_CERTIFICATE === "true",
      port: parseInt(process.env.AZURE_SQL_PORT || "1433"),
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool?.connected) {
    return pool;
  }
  
  if (pool && !pool.connected) {
    await disposePoolRef(pool);
    pool = null;
  }

  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        const config = createConfig();
        const newPool = new sql.ConnectionPool(config);
        
        newPool.on("error", (err) => {
          console.error("SQL Pool Error:", err);
          if (pool === newPool) {
            pool = null;
          }
        });

        await newPool.connect();
        pool = newPool;
        return newPool;
      } catch (err) {
        pool = null;
        throw err;
      } finally {
        connectPromise = null;
      }
    })();
  }

  return connectPromise;
}

async function disposePoolRef(p: sql.ConnectionPool | null): Promise<void> {
  if (!p) return;
  try {
    if (p.connected) {
      await p.close();
    }
  } catch (err) {
    console.error("Error closing pool:", err);
  }
}

export async function disposePool(): Promise<void> {
  if (pool) {
    await disposePoolRef(pool);
    pool = null;
    connectPromise = null;
  }
}

function isTransientConnectionError(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err);
  return (
    m.includes("not currently available") ||
    m.includes("currently unavailable") ||
    m.includes("Service is currently busy") ||
    m.includes("ECONNRESET") ||
    m.includes("ETIMEDOUT") ||
    m.includes("socket hang up")
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWithPool<T>(
  work: (pool: sql.ConnectionPool) => Promise<T>,
): Promise<T> {
  const maxAttempts = 4;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const p = await getPool();
      return await work(p);
    } catch (err) {
      if (isTransientConnectionError(err) && attempt < maxAttempts - 1) {
        await disposePoolRef(pool);
        pool = null;
        const waitMs = 1000 * Math.pow(2, attempt);
        await delay(waitMs);
        continue;
      }
      throw err;
    }
  }
  throw new Error("runWithPool: unexpected end");
}

export const getSqlPool = getPool;
