const KEY = 'eideus.llmconfig';

export interface LlmConfig {
  baseUrl: string;
  apiKey?: string;
  geminiApiKey?: string;
  geminiTextModel?: string;
  geminiImageModel?: string;
  models: {
    lyra: string;
    navbot: string;
    vizzy: string;
  };
}

const DEFAULT_CONFIG: LlmConfig = {
  baseUrl: 'http://127.0.0.1:11434',
  apiKey: '',
  geminiApiKey: '',
  geminiTextModel: 'gemini-2.0-flash',
  geminiImageModel: 'gemini-1.5-flash',
  models: {
    lyra: 'llama3',
    navbot: 'llama3',
    vizzy: 'llama3',
  },
};

export function loadLlmConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      baseUrl: parsed.baseUrl || DEFAULT_CONFIG.baseUrl,
      apiKey: parsed.apiKey || '',
      geminiApiKey: parsed.geminiApiKey || '',
      geminiTextModel: parsed.geminiTextModel || DEFAULT_CONFIG.geminiTextModel,
      geminiImageModel: parsed.geminiImageModel || DEFAULT_CONFIG.geminiImageModel,
      models: {
        lyra: parsed.models?.lyra || DEFAULT_CONFIG.models.lyra,
        navbot: parsed.models?.navbot || DEFAULT_CONFIG.models.navbot,
        vizzy: parsed.models?.vizzy || DEFAULT_CONFIG.models.vizzy,
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveLlmConfig(cfg: LlmConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}
