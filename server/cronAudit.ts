import { Request, Response } from "express";
import * as db from "./db";

export async function midnightAuditHandler(req: Request, res: Response) {
  try {
    // Perform verification checks
    let testsPassed = 0;
    const totalTests = 3;
    let details = "";

    // Test 1: DB connectivity
    const dbInstance = await db.getDb();
    if (dbInstance) {
      testsPassed++;
      details += "Database connectivity: OK. ";
    } else {
      details += "Database connectivity: FAILED. ";
    }

    // Test 2: Core evidence records check
    const evidenceList = await db.getAllEvidence();
    if (Array.isArray(evidenceList)) {
      testsPassed++;
      details += `Evidence registry query: OK (${evidenceList.length} items). `;
    } else {
      details += "Evidence registry query: FAILED. ";
    }

    // Test 3: Environment verification
    if (process.env.DATABASE_URL) {
      testsPassed++;
      details += "Environment configuration: OK. ";
    } else {
      details += "Environment configuration: FAILED. ";
    }

    const status = testsPassed === totalTests ? "PASS" : "FAIL";

    await db.logAutoDeployment(status, testsPassed, details);

    if (status === "FAIL") {
      // Create system notification for audit failure
      await db.createNotification(
        "system",
        "Nightly System Audit Failure",
        `Automated health audit failed: ${details}`,
        "audit_failure"
      );
    }

    return res.json({
      status,
      testsPassed,
      totalTests,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    await db.logAutoDeployment("FAIL", 0, `Audit execution error: ${err?.message}`);
    return res.status(500).json({ error: err?.message });
  }
}
