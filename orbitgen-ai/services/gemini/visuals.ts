// services/gemini/visuals.ts
import { getClient } from "./client";
import { TransformData } from "../../types";

const base64ToBlobUrl = (base64: string, mimeType: string): string => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
};

// Post-process the image to enforce a 2:1 Aspect Ratio (2048x1024)
// This ensures the exported texture is clean and standardized.
const processTextureForSphere = async (base64: string, mimeType: string): Promise<string> => {
  return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
          const canvas = document.createElement('canvas');
          // Strict Power-of-Two dimensions for game engine compatibility
          canvas.width = 2048; 
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              // Draw the image filling the 2:1 canvas
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              // Export as PNG for lossless texture quality
              canvas.toBlob(blob => {
                  if (blob) resolve(URL.createObjectURL(blob));
                  else resolve(base64ToBlobUrl(base64, mimeType));
              }, 'image/png');
          } else {
              resolve(base64ToBlobUrl(base64, mimeType));
          }
      };
      img.onerror = () => resolve(base64ToBlobUrl(base64, mimeType));
      img.src = `data:${mimeType};base64,${base64}`;
  });
};

export const generatePlanetTexture = async (prompt: string, seedData?: TransformData | null): Promise<string> => {
  try {
    const ai = getClient();
    
    let specificContext = "";
    if (seedData) {
        let worldDetails = "";
        if (seedData.Transforms?.T0_World_Transform) {
             Object.entries(seedData.Transforms.T0_World_Transform).forEach(([category, elements]) => {
                if (elements && Array.isArray(elements)) {
                    const descriptions = elements.map(e => e.Lore).join(" ");
                    worldDetails += `\n- ${category}: ${descriptions}`;
                }
             });
        }

        specificContext = `
        Specific Theme: ${seedData.Object_Name} (${seedData.Location_Metadata.Type} - ${seedData.Location_Metadata.Subtype})
        Visual Description: ${seedData.Location_Metadata.Description}
        Atmosphere/Theme: ${seedData.Location_Metadata.System_Theme}
        
        DETAILED WORLD FEATURES FROM SCAN (Prioritize these visual cues):
        ${worldDetails}
        `;
    }

    const texturePrompt = `
      Generate a seamless, Equirectangular Projection texture map of a planet.
      The image MUST be a flat rectangular map suitable for wrapping around a 3D sphere.
      
      Visual Style:
      - 8k Ultra-HD Satellite Photography / Photorealistic.
      - "Equirectangular" or "Spherical" projection (pixels at the top and bottom should be distorted/stretched horizontally to wrap the poles correctly without pinching).
      - Seamless left and right edges (horizontal tiling).
      
      World Theme: ${prompt}.
      ${specificContext}
      
      Geography Requirements:
      1. CONTINENTS: ~30-40% landmass. Defined coastlines.
      2. CITIES: Visible high-tech city clusters (grey/metallic geometric grids), especially near water.
      3. BIOMES: Mix of rural farmlands, forests, and mountain ranges.
      4. POLAR REGIONS: If applicable, smooth transitions to polar regions at the very top/bottom edges.
      
      Technical Constraints:
      - Full frame, no borders, no vignetting.
      - No clouds (surface only).
      - No text or labels.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: texturePrompt }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: "16:9", 
        }
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
        throw new Error("No content generated");
    }

    const parts = candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return await processTextureForSphere(base64Data, mimeType);
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export type AvatarStyle = 'REALISTIC' | 'CYBERPUNK' | 'PIXEL' | 'DARK_NOIR_SATIRE' | 'DYSTOPIAN_SCI_FI';

export const generateNpcAvatar = async (
    npcName: string,
    npcDescription: string,
    style: AvatarStyle,
    customPrompt?: string
): Promise<string> => {
    try {
        const ai = getClient();
        
        let stylePrompt = "";
        switch(style) {
            case 'REALISTIC': stylePrompt = "Photorealistic, 4k, cinematic lighting, detailed facial features, portrait photography style."; break;
            case 'CYBERPUNK': stylePrompt = "Cyberpunk 2077 style, neon lighting, high tech implants, vibrant pinks and blues, futuristic aesthetic, digital art."; break;
            case 'PIXEL': stylePrompt = "16-bit pixel art, retro RPG style, vibrant colors, dithering."; break;
            case 'DARK_NOIR_SATIRE': stylePrompt = "High contrast noir graphic novel style (Sin City aesthetic), stark black and white with single accent color, dramatic shadowing, cynical expression, detailed ink lines."; break;
            case 'DYSTOPIAN_SCI_FI': stylePrompt = "Gritty dystopian sci-fi concept art, industrial textures, muted cold tones (greys, browns, muted greens), worn technology, atmospheric fog, oppressive mood."; break;
        }

        const prompt = `
            Character Portrait of: ${npcName}
            Description: ${npcDescription}
            ${customPrompt ? `Additional Details: ${customPrompt}` : ''}
            
            Art Style: ${stylePrompt}
            
            Constraint: Head and shoulders portrait, neutral or expressive background, centered composition.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: "1:1" }
            }
        });

        // Loop through parts to find image data (it may not be the first part)
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData?.data) {
                return base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png');
            }
        }

        throw new Error("No avatar image generated.");

    } catch (e) {
        console.error("Avatar Gen Error:", e);
        throw e;
    }
};