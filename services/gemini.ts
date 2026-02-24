
import { GoogleGenAI } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for Eshuli Technology Ltd, a premier technical college in Rwanda specializing in Electronics (Flat TV Repair), Embedded Systems Project Development, and Graphic Design.

Key Information about Eshuli Technology Ltd:
- We offer both Online and Physical classes.
- Specialties: Flat TV Repair, Embedded Systems, IoT, Graphic Design.
- Slogan: "Eshuli TV - Source of Knowledge, Engine of Progress".
- Contacts: +250 785 133 511 and +250 787 853 990.
- Social: Eshuli TV on YouTube.

Your goal is to:
1. Help prospective students understand the curriculum.
2. Explain the benefits of learning electronics and embedded systems.
3. Provide contact details and registration guidance.
4. Maintain a professional, encouraging, and tech-savvy tone.
`;

export const getGeminiResponse = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    // Access .text property directly as per guidelines
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the Eshuli brain right now. Please try again or call our support at +250 785 133 511.";
  }
};
