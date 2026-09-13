"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { SelectedWorkload } from "@/lib/domain/software";
import {
  Search,
  Plus,
  Check,
  X,
  Layers,
  Sparkles,
  Code,
  Box,
  Film,
  Cpu,
  Palette,
  Compass,
  Gamepad2,
  Music,
  Globe
} from "lucide-react";
import { HorizontalScrollContainer } from "@/components/HorizontalScrollContainer";

export interface AppPresetOption {
  id: string;
  name: string;
  category: string; // e.g. "3D & Game Dev", "Video & VFX", "Local AI & LLMs", "Development & Compilers", "Design & Photography", "Engineering & CAD", "Gaming & Raytracing", "Audio & Music", "Browsing & Productivity"
  shortCategoryBadge: string; // "3D", "VIDEO", "AI", "DEV", "DESIGN", "CAD", "GAME", "AUDIO", "WEB"
  desc: string;
  minRamBadge: string; // e.g. "Rec: 32GB"
  defaultIntensity: "light" | "medium" | "heavy";
  defaultConcurrency: "foreground" | "background" | "occasional";
  versionString: string;
  aliases?: string[];
}

export const EXTENDED_APP_CATALOG: AppPresetOption[] = [
  // ===================== 3D & GAME DEV =====================
  {
    id: "blender",
    name: "Blender 4.2 LTS",
    category: "3D & Game Dev",
    shortCategoryBadge: "3D",
    desc: "Cycles GPU path tracing, geometry nodes & 3D sculpting",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "4.2",
    aliases: ["blender", "cycles", "eevee", "3d sculpting", "geometry nodes", "3d modeling", "render", "animation"],
  },
  {
    id: "unreal-engine",
    name: "Unreal Engine 5.4",
    category: "3D & Game Dev",
    shortCategoryBadge: "3D",
    desc: "Lumen GI, Nanite virtualized geometry & C++ compilation",
    minRamBadge: "Rec: 64GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "5.4",
    aliases: ["ue5", "unreal", "ue", "epic games", "lumen", "nanite", "game engine", "c++", "shader"],
  },
  {
    id: "unity",
    name: "Unity 6",
    category: "3D & Game Dev",
    shortCategoryBadge: "3D",
    desc: "URP / HDRP real-time rendering, C# scripts & asset pipeline",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "6.0",
    aliases: ["unity", "unity3d", "c#", "csharp", "urp", "hdrp", "game dev", "mobile game"],
  },
  {
    id: "autodesk-maya",
    name: "Autodesk Maya 2025",
    category: "3D & Game Dev",
    shortCategoryBadge: "3D",
    desc: "3D character animation, rigging & Arnold raytracing",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2025",
    aliases: ["maya", "autodesk maya", "arnold", "rigging", "character animation", "3d animation"],
  },
  {
    id: "cinema-4d",
    name: "Cinema 4D 2025",
    category: "3D & Game Dev",
    shortCategoryBadge: "3D",
    desc: "Motion graphics, pyro particle physics & Redshift rendering",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2025",
    aliases: ["c4d", "cinema 4d", "redshift", "maxon", "mograph", "motion graphics", "particles"],
  },
  {
    id: "godot",
    name: "Godot 4.3",
    category: "3D & Game Dev",
    shortCategoryBadge: "3D",
    desc: "Vulkan 2D/3D lightweight indie game engine",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "4.3",
    aliases: ["godot", "gdscript", "vulkan", "indie game", "2d", "3d"],
  },
  {
    id: "houdini",
    name: "SideFX Houdini 20",
    category: "3D & Game Dev",
    shortCategoryBadge: "3D",
    desc: "Procedural VFX node networks, FLIP & Pyro fluids",
    minRamBadge: "Rec: 64GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "20.0",
    aliases: ["houdini", "sidefx", "vfx", "procedural", "fluids", "smoke", "pyro", "simulation"],
  },

  // ===================== VIDEO & VFX =====================
  {
    id: "davinci-resolve",
    name: "DaVinci Resolve Studio 19",
    category: "Video & VFX",
    shortCategoryBadge: "VIDEO",
    desc: "4K/8K ProRes multi-node color grading & Fusion VFX",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "19.0",
    aliases: ["davinci", "resolve", "blackmagic", "color grading", "fusion", "fairlight", "video editing", "4k", "8k", "raw"],
  },
  {
    id: "premiere-pro",
    name: "Adobe Premiere Pro 2024",
    category: "Video & VFX",
    shortCategoryBadge: "VIDEO",
    desc: "4K Timeline multi-track editing & Lumetri Color",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2024",
    aliases: ["pr", "premiere", "premiere pro", "adobe premiere", "lumetri", "video edit", "timeline", "youtube"],
  },
  {
    id: "after-effects",
    name: "Adobe After Effects 2024",
    category: "Video & VFX",
    shortCategoryBadge: "VIDEO",
    desc: "Multi-frame 2D/3D compositing & particle VFX",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2024",
    aliases: ["ae", "after effects", "adobe ae", "mograph", "vfx", "compositing", "motion design", "animation"],
  },
  {
    id: "final-cut-pro",
    name: "Final Cut Pro 10.8",
    category: "Video & VFX",
    shortCategoryBadge: "VIDEO",
    desc: "Magnetic Timeline with hardware Apple ProRes raw acceleration",
    minRamBadge: "Rec: 24GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "10.8",
    aliases: ["fcp", "fcpx", "final cut", "final cut pro", "apple video", "prores", "mac video"],
  },

  // ===================== LOCAL AI & LLMS =====================
  {
    id: "ollama-local-ai",
    name: "Ollama / Local LLM Inference",
    category: "Local AI & LLMs",
    shortCategoryBadge: "AI",
    desc: "Llama 3.1 8B / 70B & Qwen 2.5 local inference",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "0.3.12",
    aliases: ["ollama", "llm", "llama", "llama 3", "llama 3.1", "qwen", "mistral", "local ai", "gguf", "chatgpt", "deepseek"],
  },
  {
    id: "comfyui-stable-diffusion",
    name: "ComfyUI / Stable Diffusion XL",
    category: "Local AI & LLMs",
    shortCategoryBadge: "AI",
    desc: "SDXL & Flux.1 Dev local image generation & LoRA",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "0.2.4",
    aliases: ["comfyui", "sdxl", "stable diffusion", "flux", "flux.1", "lora", "diffusion", "image generation", "ai art"],
  },
  {
    id: "lm-studio",
    name: "LM Studio",
    category: "Local AI & LLMs",
    shortCategoryBadge: "AI",
    desc: "GGUF local quantized multi-model runner & chat server",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "0.2.20",
    aliases: ["lm studio", "gguf", "local ai", "llm runner", "offline chat", "hugging face"],
  },
  {
    id: "pytorch-training",
    name: "PyTorch & CUDA Training",
    category: "Local AI & LLMs",
    shortCategoryBadge: "AI",
    desc: "PyTorch 2.4 GPU model fine-tuning & training pipelines",
    minRamBadge: "Rec: 64GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2.4",
    aliases: ["pytorch", "torch", "cuda", "fine-tuning", "machine learning", "deep learning", "neural network", "training", "ai"],
  },
  {
    id: "automatic1111",
    name: "Automatic1111 WebUI",
    category: "Local AI & LLMs",
    shortCategoryBadge: "AI",
    desc: "Stable Diffusion WebUI batch synthesis & inpainting",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "1.9",
    aliases: ["a1111", "automatic1111", "webui", "stable diffusion", "sd", "controlnet", "inpainting"],
  },

  // ===================== DEVELOPMENT & COMPILERS =====================
  {
    id: "android-studio",
    name: "Android Studio Iguana",
    category: "Development & Compilers",
    shortCategoryBadge: "DEV",
    desc: "Gradle build daemon + Kotlin compiler + layout inspector",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2024.1",
    aliases: ["android", "android studio", "gradle", "kotlin", "java", "mobile dev", "apk"],
  },
  {
    id: "android-emulator",
    name: "Android Emulator (AVD)",
    category: "Development & Compilers",
    shortCategoryBadge: "DEV",
    desc: "1080p ARM/x86 hardware-accelerated virtual device",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "34.1",
    aliases: ["avd", "emulator", "android emulator", "virtual device", "simulator"],
  },
  {
    id: "xcode",
    name: "Xcode 16",
    category: "Development & Compilers",
    shortCategoryBadge: "DEV",
    desc: "Swift compiler, SwiftUI previews & iOS simulator",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "16.0",
    aliases: ["xcode", "swift", "swiftui", "ios simulator", "apple dev", "macos dev", "clang"],
  },
  {
    id: "docker-desktop",
    name: "Docker Desktop",
    category: "Development & Compilers",
    shortCategoryBadge: "DEV",
    desc: "4-8 background microservices, PostgreSQL & Redis containers",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "background",
    versionString: "4.30",
    aliases: ["docker", "docker compose", "containers", "kubernetes", "k8s", "postgres", "redis", "microservices"],
  },
  {
    id: "vs-code",
    name: "VS Code Pro",
    category: "Development & Compilers",
    shortCategoryBadge: "DEV",
    desc: "30+ active extensions, TypeScript, ESLint & language servers",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "1.90",
    aliases: ["vscode", "vs code", "visual studio code", "typescript", "javascript", "ide", "editor", "python", "node"],
  },
  {
    id: "intellij-idea",
    name: "IntelliJ IDEA Ultimate",
    category: "Development & Compilers",
    shortCategoryBadge: "DEV",
    desc: "Spring Boot 3, Java 21 enterprise backend & deep indexing",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2024.1",
    aliases: ["intellij", "idea", "jetbrains", "java", "spring boot", "kotlin", "backend", "jvm"],
  },
  {
    id: "pycharm",
    name: "PyCharm Professional",
    category: "Development & Compilers",
    shortCategoryBadge: "DEV",
    desc: "Django / FastAPI, remote Docker interpreters & notebooks",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "2024.1",
    aliases: ["pycharm", "python", "django", "fastapi", "flask", "jetbrains", "pandas", "data science"],
  },
  {
    id: "rust-cargo",
    name: "Rust Cargo & Analyzer",
    category: "Development & Compilers",
    shortCategoryBadge: "DEV",
    desc: "Rust multi-crate parallel LLVM compilation & rust-analyzer",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "1.79",
    aliases: ["rust", "cargo", "rust-analyzer", "rustc", "llvm", "systems programming", "wasm"],
  },

  // ===================== DESIGN & PHOTOGRAPHY =====================
  {
    id: "adobe-photoshop",
    name: "Adobe Photoshop 2024",
    category: "Design & Photography",
    shortCategoryBadge: "DESIGN",
    desc: "24-45MP multi-layered RAW composites & Smart Objects",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2024",
    aliases: ["ps", "photoshop", "adobe photoshop", "photo edit", "raw", "layers", "graphic design"],
  },
  {
    id: "adobe-illustrator",
    name: "Adobe Illustrator 2024",
    category: "Design & Photography",
    shortCategoryBadge: "DESIGN",
    desc: "Complex vector artwork, typography & multi-artboard canvas",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "2024",
    aliases: ["ai", "illustrator", "adobe illustrator", "vector", "svg", "logo", "branding", "illustration"],
  },
  {
    id: "figma-desktop",
    name: "Figma Desktop App",
    category: "Design & Photography",
    shortCategoryBadge: "DESIGN",
    desc: "Large multi-page UI design systems & interactive prototypes",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "124.0",
    aliases: ["figma", "figjam", "ui design", "ux", "prototype", "wireframe", "design system"],
  },
  {
    id: "lightroom-classic",
    name: "Adobe Lightroom Classic",
    category: "Design & Photography",
    shortCategoryBadge: "DESIGN",
    desc: "Batch RAW photo editing, HDR merging & catalog exports",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "13.2",
    aliases: ["lr", "lightroom", "adobe lightroom", "raw photo", "photography", "catalog", "color grading"],
  },
  {
    id: "affinity-photo",
    name: "Affinity Photo 2",
    category: "Design & Photography",
    shortCategoryBadge: "DESIGN",
    desc: "Fast hardware-accelerated photo manipulation & RAW processing",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "2.5",
    aliases: ["affinity", "affinity photo", "serif", "photo editing", "raw"],
  },

  // ===================== ENGINEERING & CAD =====================
  {
    id: "autodesk-fusion360",
    name: "Autodesk Fusion 360",
    category: "Engineering & CAD",
    shortCategoryBadge: "CAD",
    desc: "Cloud parametric 3D CAD modeling, CAM & FEA simulations",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "2024",
    aliases: ["fusion", "fusion 360", "autodesk fusion", "cad", "cam", "3d printing", "parametric", "fea"],
  },
  {
    id: "autocad",
    name: "AutoCAD 2025",
    category: "Engineering & CAD",
    shortCategoryBadge: "CAD",
    desc: "2D/3D architectural floorplans & heavy DWG drafts",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "2025",
    aliases: ["autocad", "dwg", "dxf", "architecture", "drafting", "cad", "floorplan", "2d cad"],
  },
  {
    id: "solidworks",
    name: "SolidWorks 2024",
    category: "Engineering & CAD",
    shortCategoryBadge: "CAD",
    desc: "Large mechanical assemblies & CosmosWorks stress analysis",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2024",
    aliases: ["solidworks", "dassault", "cad", "mechanical engineering", "assemblies", "stress analysis", "simulation"],
  },
  {
    id: "matlab",
    name: "MATLAB & Simulink",
    category: "Engineering & CAD",
    shortCategoryBadge: "CAD",
    desc: "Matrix linear algebra, numerical solvers & system models",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "R2024a",
    aliases: ["matlab", "simulink", "mathworks", "matrix", "numerical computing", "engineering", "simulation", "signal processing"],
  },

  // ===================== GAMING & RAYTRACING =====================
  {
    id: "cyberpunk-2077",
    name: "Cyberpunk 2077",
    category: "Gaming & Raytracing",
    shortCategoryBadge: "GAME",
    desc: "4K Path Tracing Overdrive & DLSS 3.5 Ray Reconstruction",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2.1",
    aliases: ["cyberpunk", "cp2077", "path tracing", "ray tracing", "dlss", "4k gaming", "cd projekt"],
  },
  {
    id: "black-myth-wukong",
    name: "Black Myth: Wukong",
    category: "Gaming & Raytracing",
    shortCategoryBadge: "GAME",
    desc: "Unreal Engine 5 Full Ray Tracing & cinematic graphics",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "1.0",
    aliases: ["wukong", "black myth", "ue5 game", "ray tracing", "aaa gaming", "action rpg"],
  },
  {
    id: "elden-ring",
    name: "Elden Ring",
    category: "Gaming & Raytracing",
    shortCategoryBadge: "GAME",
    desc: "Action RPG open-world exploration at 4K Max Settings",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "1.12",
    aliases: ["elden ring", "fromsoftware", "souls", "shadow of the erdtree", "open world", "rpg"],
  },
  {
    id: "baldurs-gate-3",
    name: "Baldur's Gate 3",
    category: "Gaming & Raytracing",
    shortCategoryBadge: "GAME",
    desc: "DirectX 11 / Vulkan heavy Act 3 city NPC density",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "Patch 7",
    aliases: ["bg3", "baldurs gate", "baldur's gate 3", "larian", "dnd", "rpg", "turn based"],
  },
  {
    id: "flight-simulator",
    name: "Microsoft Flight Simulator 2024",
    category: "Gaming & Raytracing",
    shortCategoryBadge: "GAME",
    desc: "Global satellite photogrammetry & volumetric aerodynamics",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2024",
    aliases: ["msfs", "flight sim", "flight simulator", "msfs 2024", "aviation", "aerodynamics", "vr"],
  },

  // ===================== AUDIO & MUSIC =====================
  {
    id: "ableton-live",
    name: "Ableton Live 12",
    category: "Audio & Music",
    shortCategoryBadge: "AUDIO",
    desc: "64+ audio tracks, low-latency ASIO/CoreAudio & VST3 synths",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "12.0",
    aliases: ["ableton", "live 12", "daw", "music production", "vst", "synths", "audio recording", "edm"],
  },
  {
    id: "fl-studio",
    name: "FL Studio 24",
    category: "Audio & Music",
    shortCategoryBadge: "AUDIO",
    desc: "Pattern sequencer, heavy automation & multi-bus master chain",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "24.1",
    aliases: ["fl studio", "fruity loops", "image-line", "beat making", "daw", "music production", "hip hop"],
  },
  {
    id: "logic-pro",
    name: "Logic Pro 11",
    category: "Audio & Music",
    shortCategoryBadge: "AUDIO",
    desc: "Dolby Atmos spatial mixing, Alchemy synths & Session Players",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "foreground",
    versionString: "11.0",
    aliases: ["logic", "logic pro", "apple logic", "daw", "dolby atmos", "mixing", "mastering", "mac audio"],
  },
  {
    id: "pro-tools",
    name: "Avid Pro Tools Studio",
    category: "Audio & Music",
    shortCategoryBadge: "AUDIO",
    desc: "Multitrack vocal tracking, DSP plugins & post-production mix",
    minRamBadge: "Rec: 32GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "foreground",
    versionString: "2024.6",
    aliases: ["pro tools", "avid", "protools", "post production", "studio mix", "recording studio", "dsp"],
  },

  // ===================== BROWSING & PRODUCTIVITY =====================
  {
    id: "google-chrome",
    name: "Google Chrome",
    category: "Browsing & Productivity",
    shortCategoryBadge: "WEB",
    desc: "30+ active dev tabs + DevTools + media playback",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "heavy",
    defaultConcurrency: "background",
    versionString: "125.0",
    aliases: ["chrome", "google chrome", "browser", "tabs", "devtools", "web"],
  },
  {
    id: "obs-studio",
    name: "OBS Studio",
    category: "Browsing & Productivity",
    shortCategoryBadge: "WEB",
    desc: "4K 60fps NVENC/QuickSync live streaming & multi-source canvas",
    minRamBadge: "Rec: 16GB",
    defaultIntensity: "medium",
    defaultConcurrency: "background",
    versionString: "30.2",
    aliases: ["obs", "obs studio", "streaming", "twitch", "youtube live", "recording", "nvenc", "capture"],
  },
  {
    id: "slack",
    name: "Slack Desktop",
    category: "Browsing & Productivity",
    shortCategoryBadge: "WEB",
    desc: "Multi-workspace team chat, voice huddles & screen sharing",
    minRamBadge: "Rec: 8GB",
    defaultIntensity: "light",
    defaultConcurrency: "background",
    versionString: "4.38",
    aliases: ["slack", "chat", "messaging", "huddles", "team", "communication"],
  },
  {
    id: "notion",
    name: "Notion Desktop",
    category: "Browsing & Productivity",
    shortCategoryBadge: "WEB",
    desc: "Relational database workspaces, markdown documentation & notes",
    minRamBadge: "Rec: 8GB",
    defaultIntensity: "light",
    defaultConcurrency: "background",
    versionString: "2.40",
    aliases: ["notion", "notes", "wiki", "docs", "productivity", "workspace"],
  },
];
interface SearchableApplicationPickerProps {
  onSelectApp: (app: AppPresetOption) => void;
  onClose?: () => void;
  selectedAppIds?: string[];
}

export const POPULAR_APP_SEARCHES = [
  { label: "Blender", query: "blender", icon: "🎨" },
  { label: "UE5 / Unreal", query: "ue5", icon: "🎮" },
  { label: "Premiere Pro", query: "premiere", icon: "🎬" },
  { label: "DaVinci Resolve", query: "resolve", icon: "🎞️" },
  { label: "Ollama / LLMs", query: "ollama", icon: "🤖" },
  { label: "ComfyUI / SDXL", query: "sdxl", icon: "✨" },
  { label: "VS Code", query: "vscode", icon: "💻" },
  { label: "Docker", query: "docker", icon: "🐳" },
  { label: "Photoshop", query: "photoshop", icon: "🖌️" },
  { label: "Cyberpunk 2077", query: "cyberpunk", icon: "🚀" },
];

export function SearchableApplicationPicker({
  onSelectApp,
  onClose,
  selectedAppIds = []
}: SearchableApplicationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Quick categories for pill filters
  const categoryFilters = [
    "All",
    "3D & Game Dev",
    "Video & VFX",
    "Local AI & LLMs",
    "Development & Compilers",
    "Design & Photography",
    "Engineering & CAD",
    "Gaming & Raytracing",
    "Audio & Music",
    "Browsing & Productivity"
  ];

  // Filter options based on search query, category filter, and rich aliases
  const filteredOptions = useMemo(() => {
    let list = EXTENDED_APP_CATALOG;

    if (selectedCategoryFilter !== "All") {
      list = list.filter(opt => opt.category === selectedCategoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(opt => {
        const matchName = opt.name.toLowerCase().includes(q);
        const matchCat = opt.category.toLowerCase().includes(q);
        const matchBadge = opt.shortCategoryBadge.toLowerCase().includes(q);
        const matchDesc = opt.desc.toLowerCase().includes(q);
        const matchRam = opt.minRamBadge.toLowerCase().includes(q);
        const matchAliases = opt.aliases?.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase())) || false;
        return matchName || matchCat || matchBadge || matchDesc || matchRam || matchAliases;
      });
    }

    return list;
  }, [searchQuery, selectedCategoryFilter]);

  // Group filtered options by category
  const groupedCategories = useMemo(() => {
    const map = new Map<string, AppPresetOption[]>();
    filteredOptions.forEach(opt => {
      const list = map.get(opt.category) || [];
      list.push(opt);
      map.set(opt.category, list);
    });
    return Array.from(map.entries());
  }, [filteredOptions]);

  // Handle item selection
  const handleSelect = (app: AppPresetOption) => {
    onSelectApp(app);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[activeIndex]) {
        handleSelect(filteredOptions[activeIndex]);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "3D & Game Dev":
        return <Box className="w-3.5 h-3.5 text-orange-500" />;
      case "Video & VFX":
        return <Film className="w-3.5 h-3.5 text-purple-500" />;
      case "Local AI & LLMs":
        return <Cpu className="w-3.5 h-3.5 text-emerald-500" />;
      case "Development & Compilers":
        return <Code className="w-3.5 h-3.5 text-blue-500" />;
      case "Design & Photography":
        return <Palette className="w-3.5 h-3.5 text-pink-500" />;
      case "Engineering & CAD":
        return <Compass className="w-3.5 h-3.5 text-cyan-500" />;
      case "Gaming & Raytracing":
        return <Gamepad2 className="w-3.5 h-3.5 text-red-500" />;
      case "Audio & Music":
        return <Music className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-surface-card border border-border-strong rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col"
      style={{ maxHeight: "480px" }}
    >
      {/* Search Header */}
      <div className="p-3 border-b border-border-subtle bg-surface-subtle sticky top-0 z-10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase font-bold tracking-wider text-brand-primary flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Select Application to Append ({EXTENDED_APP_CATALOG.length} Available)
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-content-muted hover:text-content-strong hover:bg-surface-elevated transition-colors"
              aria-label="Close application picker"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border border-border-subtle focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
          <Search className="w-4 h-4 text-content-muted flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search 35+ apps (e.g. Unreal Engine, Photoshop, Ollama, Docker, Cyberpunk)..."
            className="w-full bg-transparent text-xs sm:text-sm text-content-strong placeholder:text-content-muted focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-md text-content-muted hover:text-content-strong"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Popular Searches */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[10px]">
          <span className="text-content-muted font-mono font-bold flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-brand-primary" />
            Quick:
          </span>
          {POPULAR_APP_SEARCHES.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setSearchQuery(item.query);
                setActiveIndex(0);
              }}
              className="px-2 py-0.5 rounded-md bg-surface-card hover:bg-surface-elevated text-content-body hover:text-content-strong border border-border-subtle hover:border-brand-primary/40 font-mono transition-all shrink-0 flex items-center gap-1"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Category Filter Pills with Scroll Buttons */}
        <HorizontalScrollContainer scrollStep={200} className="text-[11px]">
          {categoryFilters.map(cat => {
            const isSelected = selectedCategoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter(cat);
                  setActiveIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isSelected
                    ? "bg-brand-primary text-white shadow-xs"
                    : "bg-surface-card text-content-muted hover:text-content-strong border border-border-subtle"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </HorizontalScrollContainer>
      </div>

      {/* Categorized List */}
      <div ref={listRef} className="overflow-y-auto flex-1 p-2 space-y-3 divide-y divide-border-subtle/50">
        {groupedCategories.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-content-strong">
              No applications found matching &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-xs text-content-muted">
              Try searching by product name, category, or workflow keywords (e.g. &ldquo;3D&rdquo;, &ldquo;VFX&rdquo;, &ldquo;LLM&rdquo;, &ldquo;CAD&rdquo;).
            </p>
          </div>
        ) : (
          groupedCategories.map(([category, items]) => (
            <div key={category} className="pt-2 first:pt-0 space-y-1">
              {/* Category Subheader */}
              <div className="px-2 py-1 text-[10px] font-bold text-content-muted uppercase tracking-wider sticky top-0 bg-surface-card/95 backdrop-blur-sm z-5 flex items-center gap-1.5">
                {getCategoryIcon(category)}
                <span>{category}</span>
                <span className="text-[10px] text-content-muted/60 font-normal">({items.length})</span>
              </div>

              {/* Category Items */}
              <div className="space-y-0.5">
                {items.map(app => {
                  const isAlreadyAdded = selectedAppIds.includes(app.id);
                  const isHovered = filteredOptions[activeIndex]?.id === app.id;

                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleSelect(app)}
                      onMouseEnter={() => {
                        const idx = filteredOptions.findIndex(o => o.id === app.id);
                        if (idx !== -1) setActiveIndex(idx);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors touch-target ${
                        isHovered
                          ? "bg-surface-elevated text-content-strong border border-border-strong/50"
                          : "text-content-body hover:bg-surface-elevated/70 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-content-strong text-xs">
                            {app.name}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-surface-elevated text-content-muted border border-border-subtle font-semibold">
                            {app.shortCategoryBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-content-muted truncate mt-0.5">
                          {app.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                          {app.minRamBadge}
                        </span>
                        {isAlreadyAdded ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            Added
                          </span>
                        ) : (
                          <span className="p-1 rounded-md bg-surface-subtle text-content-muted group-hover:text-brand-primary">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-border-subtle bg-surface-subtle/80 flex items-center justify-between text-xs text-content-muted px-4">
        <span>
          {filteredOptions.length} application profiles available
        </span>
        <span className="text-[11px] text-content-muted">
          Click any app to append to your active stack
        </span>
      </div>
    </div>
  );
}
