import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, evidence, auditLogs, notifications } from "../drizzle/schema";
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
    let assignedRole: "owner" | "admin" | "user" = "user";
    if (user.openId === ENV.ownerOpenId || user.email === 'tanauancharles1@gmail.com') {
      assignedRole = 'owner';
    } else if (user.email === 'admin@masterkanorcase.online') {
      assignedRole = 'admin';
    } else if (user.role) {
      assignedRole = user.role as any;
    }

    const values: InsertUser = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: assignedRole,
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: {
        name: values.name,
        email: values.email,
        role: values.role,
        lastSignedIn: values.lastSignedIn,
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
  await db.execute(
    sql`INSERT INTO AUTO_DEPLOYMENT_LOG (status, tests_passed, details) VALUES (${status}, ${testsPassed}, ${details})`
  );
}

export async function getRecentAutoDeploymentLogs() {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(
    sql`SELECT id, status, tests_passed as testsPassed, details, created_at as createdAt FROM AUTO_DEPLOYMENT_LOG ORDER BY created_at DESC LIMIT 10`
  );
  return rows as unknown as any[];
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
