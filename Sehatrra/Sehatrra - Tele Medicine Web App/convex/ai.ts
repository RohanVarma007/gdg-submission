import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const symptomChecker = action({
  args: {
    symptoms: v.array(v.string()),
    responses: v.array(v.object({
      question: v.string(),
      answer: v.string(),
    })),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create a prompt for AI analysis
    const symptomsText = args.symptoms.join(", ");
    const responsesText = args.responses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join("\n");
    
    const prompt = `
You are a medical AI assistant for rural healthcare in India. Analyze the following symptoms and responses:

Symptoms: ${symptomsText}
${args.age ? `Age: ${args.age}` : ''}
${args.gender ? `Gender: ${args.gender}` : ''}

Patient Responses:
${responsesText}

Provide:
1. A brief assessment (2-3 sentences)
2. Urgency level (low/medium/high/emergency)
3. Recommended action
4. Whether follow-up is needed

Keep the response simple and accessible for rural patients. If it's an emergency, clearly state to seek immediate medical attention.
`;

    try {
      // Use the bundled OpenAI API
      const response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Parse the response to extract urgency level
      let urgencyLevel: "low" | "medium" | "high" | "emergency" = "medium";
      if (aiResponse.toLowerCase().includes("emergency") || aiResponse.toLowerCase().includes("immediate")) {
        urgencyLevel = "emergency";
      } else if (aiResponse.toLowerCase().includes("urgent") || aiResponse.toLowerCase().includes("high")) {
        urgencyLevel = "high";
      } else if (aiResponse.toLowerCase().includes("low") || aiResponse.toLowerCase().includes("minor")) {
        urgencyLevel = "low";
      }

      const followUpNeeded = aiResponse.toLowerCase().includes("follow") || urgencyLevel !== "low";

      // Save the symptom check result
      await ctx.runMutation(api.ai.saveSymptomCheck, {
        symptoms: args.symptoms,
        responses: args.responses,
        aiSuggestion: aiResponse,
        urgencyLevel,
        recommendedAction: aiResponse,
        followUpNeeded,
      });

      return {
        suggestion: aiResponse,
        urgencyLevel,
        followUpNeeded,
      };
    } catch (error) {
      console.error("AI symptom checker error:", error);
      return {
        suggestion: "I'm unable to analyze your symptoms right now. Please consult with a doctor for proper medical advice.",
        urgencyLevel: "medium" as const,
        followUpNeeded: true,
      };
    }
  },
});

export const saveSymptomCheck = mutation({
  args: {
    symptoms: v.array(v.string()),
    responses: v.array(v.object({
      question: v.string(),
      answer: v.string(),
    })),
    aiSuggestion: v.string(),
    urgencyLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("emergency")),
    recommendedAction: v.string(),
    followUpNeeded: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const patient = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!patient) throw new Error("Profile not found");

    return await ctx.db.insert("symptomChecks", {
      patientId: patient._id,
      ...args,
    });
  },
});
