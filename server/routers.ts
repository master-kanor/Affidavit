import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  evidence: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllEvidence();
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          type: z.enum(["document", "image", "video", "audio", "physical", "digital"]),
          category: z.string().optional(),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
          mimeType: z.string().optional(),
          fileSize: z.number().optional(),
          status: z.enum(["pending", "verified", "disputed", "archived"]).default("pending"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = String(ctx.user.id);
        await db.createEvidence({
          ...input,
          uploadedBy: userId,
        });
        await db.logAudit(userId, "CREATE_EVIDENCE", "evidence", undefined, `Uploaded evidence: ${input.title}`);
        return { success: true };
      }),
  }),

  audit: router({
    logs: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "owner" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await db.getRecentAutoDeploymentLogs();
    }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNotifications(String(ctx.user.id));
    }),
  }),

  ai: router({
    ask: protectedProcedure
      .input(z.object({ prompt: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const systemPrompt = `You are the Master Kanor Case AI Assistant, specialized in reviewing the authorized cybercrime affidavit, evidence records, testimonies, and timeline events of Charles Tanauan (Master Kanor). 
        Always be professional, objective, grounded strictly in case facts, and cite relevant testimonies or evidence sections when answering. Do not invent unauthorized details.`;
        
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input.prompt },
            ],
          });
          return { reply: response };
        } catch (err: any) {
          return { reply: `AI analysis currently unavailable: ${err?.message || "Please try again later."}` };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
