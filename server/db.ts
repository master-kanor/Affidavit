import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, evidence, autoDeploymentLog, auditLogs, notifications } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };

    // Set owner if openId matches ownerOpenId
    if (user.openId === ENV.ownerOpenId || user.email === 'tanauancharles1@gmail.com') {
      values.role = 'owner';
    } else if (user.email === 'admin@masterkanorcase.online') {
      values.role = 'admin';
    } else if (user.role) {
      values.role = user.role;
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: {
        name: values.name,
        email: values.email,
        lastSignedIn: values.lastSignedIn,
        ...(values.role ? { role: values.role } : {}),
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEvidence() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(evidence).orderBy(desc(evidence.createdAt));
}

export async function createEvidence(data: typeof evidence.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(evidence).values(data);
}

export async function logAutoDeployment(status: 'PASS' | 'FAIL' | 'HEALED', testsPassed: number, details: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(autoDeploymentLog).values({ status, testsPassed, details });
}

export async function getRecentAutoDeploymentLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(autoDeploymentLog).orderBy(desc(autoDeploymentLog.createdAt)).limit(10);
}

export async function createNotification(userId: string, title: string, message: string, type: 'audit_failure' | 'new_evidence' | 'access_request') {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ userId, title, message, type });
}

export async function getNotifications(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function logAudit(userId: string, action: string, resource: string, resourceId?: string, details?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ userId, action, resource, resourceId, details });
}
