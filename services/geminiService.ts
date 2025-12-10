import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const POLICY_CONTEXT = `
You are an HR Policy Assistant for Nexus HR.
Policies:
1. Annual Leave: 20 days per year. Requires manager approval.
2. Sick Leave: 10 days per year. Requires medical certificate if > 2 days.
3. Remote Work: Allowed 2 days a week with manager consent.
4. Maternity/Paternity: 6 months / 2 weeks paid.
5. Payslips: Released on the 25th of every month.
6. Expense Claims: Must be submitted by the 5th of the following month.

Answer employee questions briefly and professionally based on these policies.
`;

export const askPolicyBot = async (query: string): Promise<string> => {
  if (!apiKey) return "AI service is not configured (Missing API Key).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: POLICY_CONTEXT,
      }
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm having trouble connecting to the policy database right now.";
  }
};
