/**
 * Compliance Layer
 * KYC workflows, GDPR controls, consent management, data deletion
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

type KYCStatus = "not_started" | "pending" | "in_review" | "approved" | "rejected" | "expired";
type ConsentType = "terms" | "privacy" | "marketing" | "analytics" | "cookies" | "age_verification";

// ─── DB Setup ─────────────────────────────────────────────────────────────────

let tableEnsured = false;
async function ensureComplianceTables() {
  if (tableEnsured) return;
  const db = await getDb();
  if (!db) return;

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS kyc_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      status ENUM('not_started','pending','in_review','approved','rejected','expired') NOT NULL DEFAULT 'not_started',
      level ENUM('basic','standard','enhanced') NOT NULL DEFAULT 'basic',
      first_name VARCHAR(128),
      last_name VARCHAR(128),
      date_of_birth DATE,
      country VARCHAR(64),
      document_type VARCHAR(64),
      document_number VARCHAR(128),
      document_url VARCHAR(512),
      selfie_url VARCHAR(512),
      risk_score INT DEFAULT 0,
      rejection_reason TEXT,
      submitted_at DATETIME,
      reviewed_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_user (user_id)
    )
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS consent_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      consent_type VARCHAR(64) NOT NULL,
      granted TINYINT(1) NOT NULL DEFAULT 0,
      version VARCHAR(32) NOT NULL DEFAULT '1.0',
      ip_address VARCHAR(64),
      user_agent TEXT,
      granted_at DATETIME,
      revoked_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_consent (user_id, consent_type),
      INDEX idx_user_id (user_id)
    )
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS data_deletion_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      request_type ENUM('full_deletion','partial_deletion','data_export','correction') NOT NULL,
      status ENUM('pending','processing','completed','rejected') NOT NULL DEFAULT 'pending',
      reason TEXT,
      scope JSON,
      scheduled_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      INDEX idx_status (status)
    )
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS compliance_audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action VARCHAR(128) NOT NULL,
      entity_type VARCHAR(64),
      entity_id INT,
      details JSON,
      ip_address VARCHAR(64),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      INDEX idx_action (action),
      INDEX idx_created (created_at)
    )
  `));

  tableEnsured = true;
}

async function logComplianceAction(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number | null,
  action: string,
  entityType: string | null,
  entityId: number | null,
  details: Record<string, unknown>,
) {
  const detailsJson = JSON.stringify(details).replace(/'/g, "''");
  await db.execute(sql.raw(
    `INSERT INTO compliance_audit_log (user_id, action, entity_type, entity_id, details) VALUES (${userId ?? "NULL"}, '${action}', ${entityType ? `'${entityType}'` : "NULL"}, ${entityId ?? "NULL"}, '${detailsJson}')`,
  ));
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const complianceRouter = router({
  // ── KYC ──────────────────────────────────────────────────────────────────

  /** Get current user's KYC status */
  getKYCStatus: protectedProcedure.query(async ({ ctx }) => {
    await ensureComplianceTables();
    const db = await getDb();
    if (!db) return { status: "not_started" as KYCStatus, level: "basic", record: null };

    const [rows] = await db.execute(sql.raw(
      `SELECT * FROM kyc_records WHERE user_id=${ctx.user.id} LIMIT 1`,
    )) as any[];
    const data: any[] = Array.isArray(rows) ? rows : [];
    const record = data[0] ?? null;

    return {
      status: (record?.status ?? "not_started") as KYCStatus,
      level: record?.level ?? "basic",
      riskScore: record?.risk_score ?? 0,
      submittedAt: record?.submitted_at ?? null,
      reviewedAt: record?.reviewed_at ?? null,
      expiresAt: record?.expires_at ?? null,
      rejectionReason: record?.rejection_reason ?? null,
      record: record ? {
        firstName: record.first_name,
        lastName: record.last_name,
        country: record.country,
        documentType: record.document_type,
      } : null,
    };
  }),

  /** Submit KYC application */
  submitKYC: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1).max(128),
      lastName: z.string().min(1).max(128),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      country: z.string().min(2).max(64),
      documentType: z.enum(["passport", "national_id", "drivers_license", "residence_permit"]),
      documentNumber: z.string().min(1).max(128),
      level: z.enum(["basic", "standard", "enhanced"]).default("basic"),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureComplianceTables();
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // AI risk assessment
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a KYC risk assessment AI. Return a JSON object with: riskScore (0-100, where 0=low risk, 100=high risk) and flags (array of strings). Be conservative." },
          { role: "user", content: `KYC submission: country=${input.country}, documentType=${input.documentType}, level=${input.level}. Assess risk.` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "kyc_risk",
            strict: true,
            schema: {
              type: "object",
              properties: {
                riskScore: { type: "integer" },
                flags: { type: "array", items: { type: "string" } },
              },
              required: ["riskScore", "flags"],
              additionalProperties: false,
            },
          },
        },
      });

      let riskScore = 20;
      try {
        const rawContent = response.choices?.[0]?.message?.content;
        const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : "{}");
        riskScore = Math.min(100, Math.max(0, parsed.riskScore ?? 20));
      } catch { /* use default */ }

      const status: KYCStatus = riskScore > 70 ? "in_review" : "pending";
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await db.execute(sql.raw(`
        INSERT INTO kyc_records (user_id, status, level, first_name, last_name, date_of_birth, country, document_type, document_number, risk_score, submitted_at, expires_at)
        VALUES (${ctx.user.id}, '${status}', '${input.level}', '${input.firstName.replace(/'/g, "''")}', '${input.lastName.replace(/'/g, "''")}', '${input.dateOfBirth}', '${input.country.replace(/'/g, "''")}', '${input.documentType}', '${input.documentNumber.replace(/'/g, "''")}', ${riskScore}, NOW(), '${expiresAt.toISOString().slice(0, 19)}')
        ON DUPLICATE KEY UPDATE status='${status}', level='${input.level}', first_name='${input.firstName.replace(/'/g, "''")}', last_name='${input.lastName.replace(/'/g, "''")}', date_of_birth='${input.dateOfBirth}', country='${input.country.replace(/'/g, "''")}', document_type='${input.documentType}', document_number='${input.documentNumber.replace(/'/g, "''")}', risk_score=${riskScore}, submitted_at=NOW(), expires_at='${expiresAt.toISOString().slice(0, 19)}', updated_at=NOW()
      `));

      await logComplianceAction(db, ctx.user.id, "kyc_submitted", "kyc", null, { level: input.level, country: input.country, riskScore });

      return { success: true, status, riskScore };
    }),

  // ── GDPR / Consent ────────────────────────────────────────────────────────

  /** Get all consent records for current user */
  getConsents: protectedProcedure.query(async ({ ctx }) => {
    await ensureComplianceTables();
    const db = await getDb();
    if (!db) return { consents: [] };

    const [rows] = await db.execute(sql.raw(
      `SELECT * FROM consent_records WHERE user_id=${ctx.user.id}`,
    )) as any[];
    const data: any[] = Array.isArray(rows) ? rows : [];

    // Fill in defaults for missing consent types
    const consentTypes: ConsentType[] = ["terms", "privacy", "marketing", "analytics", "cookies", "age_verification"];
    const existing = new Map(data.map((r) => [r.consent_type, r]));

    return {
      consents: consentTypes.map((type) => {
        const r = existing.get(type);
        return {
          type,
          granted: r ? !!r.granted : false,
          version: r?.version ?? "1.0",
          grantedAt: r?.granted_at ?? null,
          revokedAt: r?.revoked_at ?? null,
          required: ["terms", "privacy", "age_verification"].includes(type),
        };
      }),
    };
  }),

  /** Update consent for a specific type */
  updateConsent: protectedProcedure
    .input(z.object({
      consentType: z.enum(["terms", "privacy", "marketing", "analytics", "cookies", "age_verification"]),
      granted: z.boolean(),
      version: z.string().default("1.0"),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureComplianceTables();
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const grantedAt = input.granted ? "NOW()" : "NULL";
      const revokedAt = input.granted ? "NULL" : "NOW()";

      await db.execute(sql.raw(`
        INSERT INTO consent_records (user_id, consent_type, granted, version, granted_at, revoked_at)
        VALUES (${ctx.user.id}, '${input.consentType}', ${input.granted ? 1 : 0}, '${input.version}', ${grantedAt}, ${revokedAt})
        ON DUPLICATE KEY UPDATE granted=${input.granted ? 1 : 0}, version='${input.version}', granted_at=${grantedAt}, revoked_at=${revokedAt}
      `));

      await logComplianceAction(db, ctx.user.id, input.granted ? "consent_granted" : "consent_revoked", "consent", null, { consentType: input.consentType, version: input.version });

      return { success: true };
    }),

  // ── Data Rights (GDPR Article 17/20) ─────────────────────────────────────

  /** Request data export (GDPR Article 20 - Data Portability) */
  requestDataExport: protectedProcedure.mutation(async ({ ctx }) => {
    await ensureComplianceTables();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h processing time
    await db.execute(sql.raw(`
      INSERT INTO data_deletion_requests (user_id, request_type, status, scheduled_at)
      VALUES (${ctx.user.id}, 'data_export', 'pending', '${scheduledAt.toISOString().slice(0, 19)}')
    `));

    await logComplianceAction(db, ctx.user.id, "data_export_requested", "user", ctx.user.id, {});

    return { success: true, scheduledAt, message: "Your data export will be ready within 24 hours." };
  }),

  /** Request account deletion (GDPR Article 17 - Right to Erasure) */
  requestDeletion: protectedProcedure
    .input(z.object({
      type: z.enum(["full_deletion", "partial_deletion"]),
      reason: z.string().max(500).optional(),
      scope: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureComplianceTables();
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const scheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 day grace period
      const scopeJson = input.scope ? JSON.stringify(input.scope).replace(/'/g, "''") : "NULL";
      const reason = input.reason ? `'${input.reason.replace(/'/g, "''")}'` : "NULL";

      await db.execute(sql.raw(`
        INSERT INTO data_deletion_requests (user_id, request_type, status, reason, scope, scheduled_at)
        VALUES (${ctx.user.id}, '${input.type}', 'pending', ${reason}, ${scopeJson !== "NULL" ? `'${scopeJson}'` : "NULL"}, '${scheduledAt.toISOString().slice(0, 19)}')
      `));

      await logComplianceAction(db, ctx.user.id, "deletion_requested", "user", ctx.user.id, { type: input.type, reason: input.reason });

      return {
        success: true,
        scheduledAt,
        gracePeriodDays: 30,
        message: "Your deletion request has been submitted. You have 30 days to cancel this request.",
      };
    }),

  /** Get pending data requests */
  getDataRequests: protectedProcedure.query(async ({ ctx }) => {
    await ensureComplianceTables();
    const db = await getDb();
    if (!db) return { requests: [] };

    const [rows] = await db.execute(sql.raw(
      `SELECT * FROM data_deletion_requests WHERE user_id=${ctx.user.id} ORDER BY created_at DESC LIMIT 20`,
    )) as any[];
    const data: any[] = Array.isArray(rows) ? rows : [];

    return {
      requests: data.map((r) => ({
        id: r.id,
        type: r.request_type,
        status: r.status,
        reason: r.reason,
        scheduledAt: r.scheduled_at,
        completedAt: r.completed_at,
        createdAt: r.created_at,
      })),
    };
  }),

  /** Cancel a pending deletion request */
  cancelDeletionRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ensureComplianceTables();
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.execute(sql.raw(
        `UPDATE data_deletion_requests SET status='rejected' WHERE id=${input.requestId} AND user_id=${ctx.user.id} AND status='pending'`,
      ));

      await logComplianceAction(db, ctx.user.id, "deletion_cancelled", "request", input.requestId, {});
      return { success: true };
    }),

  /** Get compliance audit log for current user */
  getAuditLog: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      await ensureComplianceTables();
      const db = await getDb();
      if (!db) return { events: [] };

      const [rows] = await db.execute(sql.raw(
        `SELECT * FROM compliance_audit_log WHERE user_id=${ctx.user.id} ORDER BY created_at DESC LIMIT ${input.limit}`,
      )) as any[];
      const data: any[] = Array.isArray(rows) ? rows : [];

      return {
        events: data.map((r) => ({
          id: r.id,
          action: r.action,
          entityType: r.entity_type,
          entityId: r.entity_id,
          details: r.details,
          createdAt: r.created_at,
        })),
      };
    }),

  /** Get compliance summary / health score */
  getComplianceSummary: protectedProcedure.query(async ({ ctx }) => {
    await ensureComplianceTables();
    const db = await getDb();
    if (!db) return { score: 0, issues: [], kycStatus: "not_started" as KYCStatus };

    const [kycRows] = await db.execute(sql.raw(
      `SELECT status, level FROM kyc_records WHERE user_id=${ctx.user.id} LIMIT 1`,
    )) as any[];
    const kycData: any[] = Array.isArray(kycRows) ? kycRows : [];
    const kyc = kycData[0];

    const [consentRows] = await db.execute(sql.raw(
      `SELECT consent_type, granted FROM consent_records WHERE user_id=${ctx.user.id}`,
    )) as any[];
    const consentData: any[] = Array.isArray(consentRows) ? consentRows : [];
    const consents = new Map(consentData.map((r) => [r.consent_type, !!r.granted]));

    const issues: string[] = [];
    let score = 100;

    // KYC checks
    if (!kyc || kyc.status === "not_started") { issues.push("KYC verification not started"); score -= 30; }
    else if (kyc.status === "rejected") { issues.push("KYC verification rejected"); score -= 25; }
    else if (kyc.status === "expired") { issues.push("KYC verification expired"); score -= 20; }

    // Consent checks
    if (!consents.get("terms")) { issues.push("Terms of Service not accepted"); score -= 20; }
    if (!consents.get("privacy")) { issues.push("Privacy Policy not accepted"); score -= 15; }
    if (!consents.get("age_verification")) { issues.push("Age verification not completed"); score -= 10; }

    return {
      score: Math.max(0, score),
      issues,
      kycStatus: (kyc?.status ?? "not_started") as KYCStatus,
      kycLevel: kyc?.level ?? "basic",
      consentsGranted: consentData.filter((r) => r.granted).length,
      consentsTotal: 6,
    };
  }),
});
