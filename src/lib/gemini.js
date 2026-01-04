
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!API_KEY) {
    console.error('Missing Gemini API Key')
}



const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-image" }) // User specified model

export async function generateCharacterImage(name, description, tool) {
    try {
        const prompt = `
      Create a cute, colorful character illustration for a children's book.
      
      Character Name: ${name}
      Character Description: ${description}
      Holding/Using Tool: ${tool}
      
      Style: 3D playful sticker style, vibrant lighting, white background.
      Quality: High definition, 8k.
    `
        // Note: For image generation models, the response structure might contain 'images' or 'inlineData' depending on SDK version.
        // Assuming standard content generation with output mimetype image/png if supported, 
        // OR if this is an Imagen wrapper, it might differ. 
        // Checking standard Gemini API image generation response pattern:

        // For standard Gemini Image Gen (if supported via generateContent):
        const result = await model.generateContent(prompt)
        const response = await result.response

        // Attempt to retrieve image data (Base64)
        // The API usually returns candidate with 'content' -> 'parts' -> 'inlineData' (mimeType, data)
        // OR simply text if it failed to gen image.

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content.parts;
            for (const part of parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        throw new Error("No image data found in response. The model might have returned text instead.");

    } catch (error) {
        console.error("Gemini Image Gen Error:", error)
        throw error
    }
}

