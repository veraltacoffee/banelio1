import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

/**
 * BANELIO - Base de datos (Fase 1A).
 *
 * Fuente única de conexión Prisma del proyecto.
 *
 * Nota sobre rutas SQLite:
 * - Prisma Migrate resuelve `file:./dev.db` RELATIVO al directorio del schema
 *   (prisma/), por lo que la base vive en `prisma/dev.db`.
 * - PrismaClient en runtime resuelve `file:` RELATIVO al CWD del proceso, que
 *   depende de cómo se arranque el servidor.
 *
 * Para que runtime y migrate SIEMPRE usen exactamente la misma base (y no se
 * duplique `dev.db`), este módulo ancla la ruta a la raíz del proyecto y apunta
 * al archivo `prisma/dev.db`. Si el operador define una URL absoluta
 * (`file:C:/...` o `file:///C:/...`) se respeta tal cual (override avanzado).
 */
function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL || 'file:./dev.db';

  // Absolute file: URLs are honored verbatim (advanced override).
  if (raw.startsWith('file:///') || /^file:[A-Za-z]:\//.test(raw)) {
    return raw;
  }

  // Runtime convention: the server is started from the project root
  // (matches how server.ts already resolves the static `dist` folder via
  // process.cwd()). Anchoring here guarantees the SAME db file as prune migrate
  // (which stores it under prisma/), regardless of how the shell resolves cwd.
  const projectRoot = process.cwd();
  const prismaDir = path.join(projectRoot, 'prisma');

  if (!fs.existsSync(prismaDir)) {
    throw new Error(
      `BANELIO: no se encontró el directorio "prisma/" en "${projectRoot}". ` +
        `Ejecuta el servidor desde la raíz del proyecto (npm run dev / npm start).`
    );
  }

  // Canonical development database (same file Prisma Migrate creates at prisma/dev.db).
  const dbFile = path.join(prismaDir, 'dev.db');
  return 'file:' + dbFile.replace(/\\/g, '/');
}

// Singleton PrismaClient for the whole app (avoids connection exhaustion and
// duplicate file handles on dev/HMR).
export const prisma = new PrismaClient({
  datasources: {
    db: { url: resolveDatabaseUrl() }
  }
});

export type { PrismaClient as PrismaClientType } from '@prisma/client';

// Re-export of the Prisma-generated domain types so later server modules
// (catalog, orders, auth) import everything from a single server-side location
// instead of reaching into node_modules/.prisma. This avoids a second source of
// truth for enums/entities during upcoming phases.
export type {
  Customer,
  CatalogItem,
  Order,
  Role,
  CustomerStatus,
  BillingPeriod,
  CatalogCategory,
  OrderStatus,
  PaymentStatus,
  ProvisionStatus
} from '@prisma/client';