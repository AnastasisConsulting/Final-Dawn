// PATH: services/export/workspaceSaver.ts
import JSZip from 'jszip';
import { Workspace } from '../../types';

export async function createWorkspaceGenFile(workspace: Workspace): Promise<{ blob: Blob, filename: string }> {
    const zip = new JSZip();
    
    // Handle texture
    let textureBlob: Blob | null = null;
    const state = { ...workspace.planetState };
    
    // If we have a runtime texture URL, fetch the binary data
    if (state.textureUrl) {
        try {
            const resp = await fetch(state.textureUrl);
            textureBlob = await resp.blob();
        } catch (e) {
            console.error("Failed to fetch texture for save", e);
        }
    }
    
    // Modify state to point to relative file in zip, NOT a blob URL or base64 string
    if (textureBlob) {
        zip.file("texture.png", textureBlob);
        state.textureUrl = "texture.png"; // Placeholder for the file inside the zip
    } else {
        state.textureUrl = null;
    }

    const workspaceToSave = {
        ...workspace,
        planetState: state
    };

    zip.file("workspace.json", JSON.stringify(workspaceToSave, null, 2));
    
    const content = await zip.generateAsync({ type: "blob" });
    return { 
        blob: content, 
        filename: `${workspace.worldId}.gen` 
    };
}

export async function parseWorkspaceGenFile(file: File): Promise<Workspace> {
    const zip = await JSZip.loadAsync(file);
    
    const jsonFile = zip.file("workspace.json");
    if (!jsonFile) throw new Error("Invalid .gen file: missing workspace.json");
    
    const jsonStr = await jsonFile.async("string");
    const workspace = JSON.parse(jsonStr) as Workspace;
    
    // Rehydrate texture
    if (workspace.planetState.textureUrl === "texture.png") {
        const texFile = zip.file("texture.png");
        if (texFile) {
            const blob = await texFile.async("blob");
            workspace.planetState.textureUrl = URL.createObjectURL(blob);
        } else {
            workspace.planetState.textureUrl = null;
        }
    }
    
    return workspace;
}
