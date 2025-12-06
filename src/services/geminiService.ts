
import { GoogleGenAI } from "@google/genai";
import { Asset, PlacedLayer } from "@/types/simulator";

/**
 * Helper to strip the data URL prefix (e.g. "data:image/png;base64,")
 */
const getBase64Data = (dataUrl: string): string => {
    return dataUrl.split(',')[1];
};

/**
 * Generates a beauty procedure simulation by modifying the client photo based on references.
 * Uses a 2-step process:
 * 1. Analyze client photo with Gemini 1.5 Flash to get a description.
 * 2. Generate new image with Imagen 3 based on description + instructions.
 */
export const generateMockup = async (
    product: Asset,
    layers: { asset: Asset; placement: PlacedLayer }[],
    instruction: string
): Promise<string> => {
    try {
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
        const ai = new GoogleGenAI({ apiKey });

        // 1. Add Client Base Photo (The subject to be edited)
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

            const vPos = layer.placement.y < 33 ? "top" : layer.placement.y > 66 ? "bottom" : "center";
            const hPos = layer.placement.x < 33 ? "left" : layer.placement.x > 66 ? "right" : "center";
            layoutHints += `\n- Reference Image ${index + 1} (placed at ${vPos}-${hPos}): Use this style.`;
        });

        // 3. Add Instructions for Direct Editing
        const finalPrompt = `
    TASK: Edit the FIRST image (the Client) to apply the beauty styles shown in the subsequent reference images.
    
    USER INSTRUCTION: ${instruction}
    
    GUIDELINES:
    1. PRESERVE IDENTITY: The face, skin texture, and key features of the person in the FIRST image must remain exactly the same. Do NOT generate a new person.
    2. APPLY STYLE: Transfer the makeup, hair color/cut, or nail style from the reference images to the client.
    3. REALISM: The result must look like a real photograph.
    
    Output ONLY the resulting edited image.
    `;

        parts.push({ text: finalPrompt });

        const response = await ai.models.generateContent({
            model: 'nano-banana-pro-preview',
            contents: [{ role: 'user', parts }],
        });

        const candidates = response.candidates;

        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }

        throw new Error("Model generated a response but no image data was found.");

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
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
        const ai = new GoogleGenAI({ apiKey });

        const enhancedPrompt = type === 'style-reference'
            ? `A high-quality beauty photography close-up showing a specific style: ${prompt}. Professional lighting, beauty editorial style. Focus clearly on the hair/makeup/nails described. Isolated or clean background.`
            : `A professional portrait of a person suitable for a beauty salon simulation. ${prompt}. Natural lighting, front facing, clear features.`;

        const response = await ai.models.generateContent({
            model: 'nano-banana-pro-preview',
            contents: {
                parts: [{ text: enhancedPrompt }]
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
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
        const ai = new GoogleGenAI({ apiKey });

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
            model: 'nano-banana-pro-preview',
            contents: { parts },
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
