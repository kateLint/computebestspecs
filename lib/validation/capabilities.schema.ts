import { z } from "zod";

export const CpuInstructionSetSchema = z.enum([
  "AVX",
  "AVX2",
  "AVX512",
  "NEON",
  "AMX",
  "SVE",
]);

export const GpuGraphicsApiSchema = z.enum([
  "DIRECTX_11",
  "DIRECTX_12",
  "DIRECTX_12_ULTIMATE",
  "VULKAN_1_2",
  "VULKAN_1_3",
  "METAL_2",
  "METAL_3",
  "OPENGL_4_5",
]);

export const ComputeAcceleratorApiSchema = z.enum([
  "CUDA",
  "ROCM",
  "ONEAPI",
  "METAL_COMPUTE",
  "DIRECTML",
  "OPENCL",
]);

export const HardwareVideoCodecSchema = z.enum([
  "H264",
  "HEVC",
  "AV1",
  "PRORES",
  "VP9",
]);

export const HardwareCapabilitiesSchema = z.object({
  instructionSets: z.array(CpuInstructionSetSchema).optional(),
  avx2: z.boolean().optional(),
  avx512: z.boolean().optional(),
  neon: z.boolean().optional(),
  virtualization: z.boolean().optional(),
  
  graphicsApis: z.array(GpuGraphicsApiSchema).optional(),
  computeApis: z.array(ComputeAcceleratorApiSchema).optional(),
  cudaComputeCapability: z.string().optional(),
  metalFeatureSet: z.string().optional(),
  directXFeatureLevel: z.string().optional(),
  
  rayTracing: z.boolean().optional(),
  tensorCores: z.boolean().optional(),
  npuTops: z.number().min(0).optional(),
  
  hardwareVideoEncode: z.array(z.string()).optional(),
  hardwareVideoDecode: z.array(z.string()).optional(),
});

export const CapabilityRequirementSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["CPU_INSTRUCTION", "GPU_API", "ACCELERATOR", "VIRTUALIZATION", "CODEC", "SECURITY"]),
  isHardRequirement: z.boolean(),
  description: z.string().optional(),
  minCudaCapability: z.string().optional(),
  minMetalVersion: z.string().optional(),
  minDirectXLevel: z.string().optional(),
});
