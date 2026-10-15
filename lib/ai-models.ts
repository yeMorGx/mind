export const AI_MODELS = [
  {
    "name": "Gemini",
    "icon": "gemini-color",
    "aliases": [
      "google gemini",
      "gemini"
    ]
  },
  {
    "name": "ChatGPT",
    "icon": "openai",
    "aliases": [
      "chatgpt",
      "gpt",
      "openai"
    ]
  },
  {
    "name": "Claude",
    "icon": "claude-color",
    "aliases": [
      "claude",
      "cloud",
      "anthropic"
    ]
  },
  {
    "name": "Midjourney",
    "icon": "midjourney",
    "aliases": [
      "midjourney",
      "mid journey"
    ]
  },
  {
    "name": "DeepSeek",
    "icon": "deepseek-color",
    "aliases": [
      "deepseek",
      "deep seek",
      "libsic"
    ]
  },
  {
    "name": "Qwen",
    "icon": "qwen-color",
    "aliases": [
      "qwen",
      "quinn",
      "qwen chat"
    ]
  },
  {
    "name": "Grok",
    "icon": "grok",
    "aliases": [
      "grok"
    ]
  },
  {
    "name": "Llama",
    "icon": "meta-color",
    "aliases": [
      "llama"
    ]
  },
  {
    "name": "Mistral",
    "icon": "mistral-color",
    "aliases": [
      "mistral",
      "mixtral"
    ]
  },
  {
    "name": "Microsoft Copilot",
    "icon": "copilot-color",
    "aliases": [
      "copilot",
      "microsoft copilot"
    ]
  },
  {
    "name": "Perplexity",
    "icon": "perplexity-color",
    "aliases": [
      "perplexity"
    ]
  },
  {
    "name": "DALL·E",
    "icon": "dalle-color",
    "aliases": [
      "dall e",
      "dalle"
    ]
  },
  {
    "name": "Stable Diffusion",
    "icon": "stability-color",
    "aliases": [
      "stable diffusion",
      "stability",
      "sdxl"
    ]
  },
  {
    "name": "FLUX",
    "icon": "flux",
    "aliases": [
      "flux"
    ]
  },
  {
    "name": "Adobe Firefly",
    "icon": "adobefirefly-color",
    "aliases": [
      "adobe firefly",
      "firefly"
    ]
  },
  {
    "name": "Ideogram",
    "icon": "ideogram",
    "aliases": [
      "ideogram"
    ]
  },
  {
    "name": "Runway",
    "icon": "runway",
    "aliases": [
      "runway"
    ]
  },
  {
    "name": "Kling",
    "icon": "kling-color",
    "aliases": [
      "kling"
    ]
  },
  {
    "name": "Luma",
    "icon": "luma-color",
    "aliases": [
      "luma"
    ]
  },
  {
    "name": "Sora",
    "icon": "sora",
    "aliases": [
      "sora"
    ]
  },
  {
    "name": "Suno",
    "icon": "suno",
    "aliases": [
      "suno"
    ]
  },
  {
    "name": "ElevenLabs",
    "icon": "elevenlabs",
    "aliases": [
      "elevenlabs",
      "eleven labs"
    ]
  },
  {
    "name": "Krea",
    "icon": "krea",
    "aliases": [
      "krea"
    ]
  },
  {
    "name": "Recraft",
    "icon": "recraft",
    "aliases": [
      "recraft"
    ]
  }
] as const;

const normalized=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export function findAIModel(value:string){const term=normalized(value);return AI_MODELS.find(model=>[model.name,...model.aliases].some(alias=>{const key=normalized(alias);return term===key||term.startsWith(key+" ");}));}
