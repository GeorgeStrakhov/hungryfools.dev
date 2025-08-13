import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api/admin-auth";
import { answerStructured } from "@/lib/services/llm/llm";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.isValid) {
      return authResult.response;
    }

    const body = await request.json();
    const { systemPrompt, userPrompt, schema, isCustomSchema } = body;

    if (!systemPrompt || !userPrompt || !schema) {
      return NextResponse.json(
        { error: "systemPrompt, userPrompt, and schema are required" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    try {
      // Parse the schema string into a Zod schema
      let zodSchema: z.ZodType;
      
      if (isCustomSchema) {
        // For custom schemas, execute the schema directly (user provides full z.object(...))
        const schemaFunction = new Function('z', `return ${schema}`);
        zodSchema = schemaFunction(z);
      } else {
        // For predefined schemas, wrap in z.object()
        const schemaFunction = new Function('z', `return z.object(${schema})`);
        zodSchema = schemaFunction(z);
      }

      const result = await answerStructured({
        systemPrompt,
        userPrompt,
        responseSchema: zodSchema,
      });

      const executionTime = Date.now() - startTime;

      return NextResponse.json({
        result,
        model: 'moonshotai/kimi-k2-instruct',
        executionTime,
      });
    } catch (schemaError) {
      return NextResponse.json(
        { error: `Schema parsing error: ${schemaError instanceof Error ? schemaError.message : 'Invalid schema'}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("LLM test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}