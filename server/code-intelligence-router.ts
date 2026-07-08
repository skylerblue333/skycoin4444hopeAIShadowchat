/**
 * Code Intelligence Router — HOPE AI powered code analysis, review, and suggestions.
 * Provides: repo analysis, code review, bug detection, refactor suggestions,
 * security audit, performance hints, and live code completion context.
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

const HOPE_CODE_SYSTEM = `You are HOPE AI Code Intelligence — an elite AI software engineer embedded in the ShadowChat / SKYCOIN4444 platform.

Your capabilities:
- Deep code review with security, performance, and correctness analysis
- Architecture analysis and design pattern recommendations
- Bug detection with root cause analysis and fix suggestions
- Refactoring recommendations with before/after examples
- Security vulnerability scanning (OWASP Top 10, injection, XSS, CSRF, etc.)
- Performance profiling hints and optimization strategies
- Test coverage analysis and test generation
- Documentation generation
- Dependency analysis and upgrade recommendations

Always respond with structured, actionable insights. Use markdown for formatting.
Be specific, cite line numbers when provided, and explain the WHY behind every recommendation.
Prioritize critical issues first, then high, medium, low severity.`;

export const codeIntelligenceRouter = router({
  // Analyze a code snippet or file
  analyzeCode: protectedProcedure
    .input(z.object({
      code: z.string().min(1).max(50000),
      language: z.string().default("typescript"),
      filename: z.string().optional(),
      analysisType: z.enum(["review", "security", "performance", "refactor", "explain", "test", "document"]).default("review"),
    }))
    .mutation(async ({ input }) => {
      const prompts: Record<string, string> = {
        review: `Perform a comprehensive code review of this ${input.language} code${input.filename ? ` (${input.filename})` : ""}. Identify bugs, code smells, anti-patterns, and improvement opportunities. Rate severity as CRITICAL/HIGH/MEDIUM/LOW.`,
        security: `Perform a security audit of this ${input.language} code. Check for: SQL injection, XSS, CSRF, authentication bypasses, insecure data handling, exposed secrets, and OWASP Top 10 vulnerabilities.`,
        performance: `Analyze performance bottlenecks in this ${input.language} code. Identify: N+1 queries, unnecessary re-renders, memory leaks, inefficient algorithms (with Big-O analysis), and blocking operations.`,
        refactor: `Suggest refactoring improvements for this ${input.language} code. Focus on: DRY principle, SOLID principles, design patterns, readability, and maintainability. Provide before/after examples.`,
        explain: `Explain this ${input.language} code in clear, plain English. Cover: what it does, how it works, key concepts used, and any non-obvious behavior.`,
        test: `Generate comprehensive unit tests for this ${input.language} code. Cover: happy paths, edge cases, error conditions, and boundary values. Use appropriate testing patterns.`,
        document: `Generate complete JSDoc/TSDoc documentation for this ${input.language} code. Include: function descriptions, parameter types, return values, examples, and any important notes.`,
      };

      const response = await invokeLLM({
        messages: [
          { role: "system", content: HOPE_CODE_SYSTEM },
          { role: "user", content: `${prompts[input.analysisType]}\n\n\`\`\`${input.language}\n${input.code}\n\`\`\`` },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      const analysis = typeof content === "string" ? content : JSON.stringify(content);

      return {
        analysis,
        language: input.language,
        analysisType: input.analysisType,
        timestamp: new Date(),
        tokensUsed: response.usage?.total_tokens || 0,
      };
    }),

  // Analyze a full repository structure (provided as file tree + key files)
  analyzeRepo: protectedProcedure
    .input(z.object({
      repoName: z.string(),
      fileTree: z.string().max(10000),
      keyFiles: z.array(z.object({
        path: z.string(),
        content: z.string().max(5000),
      })).max(10).optional(),
      techStack: z.string().optional(),
      goals: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const keyFilesText = input.keyFiles?.map(f =>
        `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``
      ).join("\n\n") || "";

      const response = await invokeLLM({
        messages: [
          { role: "system", content: HOPE_CODE_SYSTEM },
          {
            role: "user",
            content: `Analyze the repository "${input.repoName}".

Tech Stack: ${input.techStack || "Unknown"}
Goals: ${input.goals || "General analysis"}

File Tree:
\`\`\`
${input.fileTree}
\`\`\`

${keyFilesText ? `Key Files:\n${keyFilesText}` : ""}

Provide:
1. **Architecture Overview** — overall structure and patterns used
2. **Strengths** — what's done well
3. **Critical Issues** — must-fix problems
4. **Improvement Roadmap** — prioritized list of upgrades
5. **Security Assessment** — potential vulnerabilities
6. **Scalability Analysis** — bottlenecks and scaling concerns
7. **Tech Debt Score** — 0-100 (100 = clean)`,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      return {
        analysis: typeof content === "string" ? content : JSON.stringify(content),
        repoName: input.repoName,
        timestamp: new Date(),
      };
    }),

  // Smart code completion / suggestion
  suggest: protectedProcedure
    .input(z.object({
      context: z.string().max(5000), // code before cursor
      language: z.string().default("typescript"),
      intent: z.string().optional(), // what the user wants to do
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a code completion AI. Given code context, provide the most likely next code to write.
Return ONLY the code completion (no explanation, no markdown fences). Be concise and precise.`,
          },
          {
            role: "user",
            content: `Language: ${input.language}
${input.intent ? `Intent: ${input.intent}` : ""}
Context (code before cursor):
\`\`\`${input.language}
${input.context}
\`\`\`
Complete the code:`,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      return {
        suggestion: typeof content === "string" ? content : "",
        language: input.language,
      };
    }),

  // Detect bugs in code
  detectBugs: protectedProcedure
    .input(z.object({
      code: z.string().min(1).max(20000),
      language: z.string().default("typescript"),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: HOPE_CODE_SYSTEM },
          {
            role: "user",
            content: `Find and fix bugs in this ${input.language} code.
${input.errorMessage ? `\nError message: ${input.errorMessage}\n` : ""}
\`\`\`${input.language}
${input.code}
\`\`\`

For each bug found, provide:
- **Bug**: Description
- **Location**: Line number or code snippet
- **Severity**: CRITICAL/HIGH/MEDIUM/LOW
- **Root Cause**: Why this is a bug
- **Fix**: Corrected code

Then provide the complete fixed version of the code.`,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      return {
        analysis: typeof content === "string" ? content : JSON.stringify(content),
        language: input.language,
        timestamp: new Date(),
      };
    }),

  // Generate code from description
  generate: protectedProcedure
    .input(z.object({
      description: z.string().min(10).max(2000),
      language: z.string().default("typescript"),
      framework: z.string().optional(),
      style: z.enum(["minimal", "production", "documented"]).default("production"),
    }))
    .mutation(async ({ input }) => {
      const styleGuide = {
        minimal: "Write minimal, clean code without comments.",
        production: "Write production-ready code with error handling, TypeScript types, and best practices.",
        documented: "Write fully documented code with JSDoc comments, examples, and inline explanations.",
      };

      const response = await invokeLLM({
        messages: [
          { role: "system", content: HOPE_CODE_SYSTEM },
          {
            role: "user",
            content: `Generate ${input.language}${input.framework ? ` (${input.framework})` : ""} code for:

${input.description}

Style: ${styleGuide[input.style]}

Return only the code, properly formatted.`,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      return {
        code: typeof content === "string" ? content : JSON.stringify(content),
        language: input.language,
        timestamp: new Date(),
      };
    }),

  // Get AI-powered refactor suggestions with diff
  refactor: protectedProcedure
    .input(z.object({
      code: z.string().min(1).max(20000),
      language: z.string().default("typescript"),
      goal: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: HOPE_CODE_SYSTEM },
          {
            role: "user",
            content: `Refactor this ${input.language} code${input.goal ? ` with goal: ${input.goal}` : ""}.

Original:
\`\`\`${input.language}
${input.code}
\`\`\`

Provide:
1. **What changed and why** (brief summary)
2. **Refactored code** (complete, ready to use)
3. **Key improvements** (bullet points)`,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      return {
        refactored: typeof content === "string" ? content : JSON.stringify(content),
        language: input.language,
        timestamp: new Date(),
      };
    }),

  // Quick AI chat about code
  chat: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(5000),
      codeContext: z.string().max(10000).optional(),
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).max(20).optional(),
    }))
    .mutation(async ({ input }) => {
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: HOPE_CODE_SYSTEM },
      ];

      if (input.codeContext) {
        messages.push({
          role: "user",
          content: `Code context:\n\`\`\`\n${input.codeContext}\n\`\`\``,
        });
        messages.push({ role: "assistant", content: "I've reviewed your code context. How can I help?" });
      }

      if (input.history) {
        messages.push(...input.history.map(h => ({ role: h.role, content: h.content })));
      }

      messages.push({ role: "user", content: input.message });

      const response = await invokeLLM({ messages });
      const content = response.choices?.[0]?.message?.content;
      return {
        reply: typeof content === "string" ? content : JSON.stringify(content),
        timestamp: new Date(),
      };
    }),

  // Analyze the ShadowChat platform itself
  analyzePlatform: publicProcedure.query(async () => {
    const platformSummary = `
ShadowChat / SKYCOIN4444 Platform — Tech Stack:
- Frontend: React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Wouter routing
- Backend: Node.js, Express 4, tRPC 11, Drizzle ORM
- Database: MySQL/TiDB
- Auth: Manus OAuth (JWT sessions)
- Real-time: SSE (Server-Sent Events) via sseManager
- Storage: S3-compatible via storagePut/storageGet
- AI: Built-in LLM via invokeLLM (Claude, GPT-5, Gemini)
- Payments: Stripe integration
- Key features: Social feed, streaming, crypto/staking, marketplace, charity, tournaments, communities, DMs, HOPE AI

Current scale: ~60K+ lines of code across 50+ router files, 25+ test files, 1988 passing tests.
    `.trim();

    return {
      summary: platformSummary,
      techStack: {
        frontend: ["React 19", "TypeScript", "Tailwind CSS 4", "shadcn/ui", "Wouter", "tRPC client", "TanStack Query"],
        backend: ["Node.js", "Express 4", "tRPC 11", "Drizzle ORM", "MySQL/TiDB"],
        ai: ["HOPE AI (Claude/GPT-5/Gemini via invokeLLM)", "LLM moderation", "Feed ranking AI", "Fraud detection AI"],
        infra: ["Manus OAuth", "S3 storage", "SSE real-time", "Stripe payments"],
      },
      stats: {
        linesOfCode: "60K+",
        testFiles: 25,
        passingTests: 1988,
        routerFiles: "50+",
        features: 40,
      },
    };
  }),
});
