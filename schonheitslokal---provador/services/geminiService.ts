
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from "@google/genai";
import { Asset, PlacedLayer } from "../types";

/**
 * Helper to strip the data URL prefix (e.g. "data:image/png;base64,")
 */
const getBase64Data = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

/**
 * Generates a beauty procedure simulation by modifying the client photo based on references.
 */
export const generateMockup = async (
  product: Asset,
  layers: { asset: Asset; placement: PlacedLayer }[],
  instruction: string
): Promise<string> => {
  try {
    // Create instance here to get latest key
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error("CRITICAL ERROR: API Key is missing in geminiService!");
      console.log("process.env.API_KEY:", process.env.API_KEY);
      console.log("process.env.GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
      console.log("import.meta.env.VITE_GEMINI_API_KEY:", import.meta.env.VITE_GEMINI_API_KEY);
    }

    const ai = new GoogleGenAI({ apiKey: apiKey || '' });
    const model = 'gemini-2.0-flash-exp'; // Updated to flash-exp as pro-preview might be deprecated/private

    // 1. Add Client Base Photo
    const parts: any[] = [
      {
        inlineData: {
          mimeType: product.mimeType,
          data: getBase64Data(product.data),
        },
      },
    ];

    // 2. Add All Style References
    let layoutHints = "";
    layers.forEach((layer, index) => {
      parts.push({
        inlineData: {
          mimeType: layer.asset.mimeType,
          data: getBase64Data(layer.asset.data),
        },
      });

      // Construct simple positioning hint (though less critical for beauty than logos)
      const vPos = layer.placement.y < 33 ? "top" : layer.placement.y > 66 ? "bottom" : "center";
      const hPos = layer.placement.x < 33 ? "left" : layer.placement.x > 66 ? "right" : "center";

      layoutHints += `\n- Reference Style Image ${index + 1} (User placed at ${vPos}-${hPos}): Use this as a visual reference for the desired style.`;
    });

    // 3. Add Instructions
    const finalPrompt = `
    User Request / Procedure: ${instruction}
    
    Context:
    - Image 1 is the CLIENT (The person to receive the procedure).
    - Subsequent images are STYLE REFERENCES (Examples of hair colors, cuts, makeup styles, or nail art).
    
    System Task: 
    Act as a professional beauty stylist and AI image editor.
    Apply the visual style/procedure described by the User Request and shown in the Style References to the Client in Image 1.
    
    CRITICAL RULES:
    1. PRESERVE IDENTITY: Do not change the client's facial features, identity, or skin texture unnecessarily. Only modify the target area (e.g., hair, lips, eyes, nails) as requested.
    2. REALISM: The result must look like a real photograph taken after the salon procedure. Match lighting, shadows, and perspective of the original client photo.
    3. BLENDING: If applying a hair color or cut, ensure it flows naturally with the client's head shape.
    
    Output ONLY the resulting image.
    `;

    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Simulation failed:", error);
    throw error;
  }
};

/**
 * Generates a new style reference (hair, makeup, etc) from scratch using text.
 */
export const generateAsset = async (prompt: string, type: 'client-photo' | 'style-reference'): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey || '' });
    const model = 'gemini-2.0-flash-exp';

    const enhancedPrompt = type === 'style-reference'
      ? `A high-quality beauty photography close-up showing a specific style: ${prompt}. Professional lighting, beauty editorial style. Focus clearly on the hair/makeup/nails described. Isolated or clean background.`
      : `A professional portrait of a person suitable for a beauty salon simulation. ${prompt}. Natural lighting, front facing, clear features.`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        responseModalities: [Modality.IMAGE],
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated");

  } catch (error) {
    console.error("Asset generation failed:", error);
    throw error;
  }
}

/**
 * Takes a raw AR composite and makes it photorealistic.
 */
export const generateRealtimeComposite = async (
  compositeImageBase64: string,
  prompt: string = "Make this look like a real photo"
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey || '' });
    const model = 'gemini-2.0-flash-exp';

    const parts = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: getBase64Data(compositeImageBase64),
        },
      },
      {
        text: `Input is a rough composite. Task: ${prompt}. 
          Render the overlaid effect naturally onto the person. 
          Match the lighting, skin tone, and perspective. 
          Output ONLY the resulting image.`,
      },
    ];

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("AR Composite generation failed:", error);
    throw error;
  }
};
