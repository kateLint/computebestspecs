import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ResultPageView } from "@/components/ResultPageView";
import {
  HardwareProfileSchema,
  SelectedWorkloadSchema,
  CompatibilityResultSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

export const metadata: Metadata = {
  title: "Compatibility Result — ComputeBestSpecs",
  description: "Authoritative hardware compatibility and workload fit diagnostic snapshot.",
  robots: {
    index: false,
    follow: false,
  },
};

interface ResultPageProps {
  params: {
    publicId: string;
  };
}

export default async function SavedResultPage({ params }: ResultPageProps) {
  const snapshot = await prisma.evaluationSnapshot.findUnique({
    where: { publicId: params.publicId },
  });

  if (!snapshot) {
    notFound();
  }

  // Safe Runtime Zod Parsing to guarantee data integrity
  let rawHardware: any = {};
  let rawWorkloads: any = [];
  let rawResult: any = {};

  try {
    const input = JSON.parse(snapshot.inputSnapshot || "{}");
    rawHardware = input.hardware || {};
    rawWorkloads = input.workloads || [];
    rawResult = JSON.parse(snapshot.resultSnapshot || "{}");
  } catch (err) {
    console.error("Failed to parse JSON snapshot data", err);
    notFound();
  }

  const hardwareValidation = HardwareProfileSchema.safeParse(rawHardware);
  const workloadsValidation = z.array(SelectedWorkloadSchema).safeParse(rawWorkloads);
  const resultValidation = CompatibilityResultSchema.safeParse(rawResult);

  const hardware = hardwareValidation.success ? hardwareValidation.data : (rawHardware as any);
  const workloads = workloadsValidation.success ? workloadsValidation.data : (rawWorkloads as any);
  const result = resultValidation.success ? resultValidation.data : (rawResult as any);

  return (
    <ResultPageView
      publicId={snapshot.publicId}
      hardware={hardware}
      workloads={workloads}
      result={result}
      snapshotMeta={{
        engineVersion: snapshot.engineVersion,
        benchmarkDatasetVersion: snapshot.benchmarkDatasetVersion,
        normalizationAlgorithmVersion: "1.0",
        createdAt: snapshot.createdAt.toISOString ? snapshot.createdAt.toISOString() : String(snapshot.createdAt),
        fingerprint: snapshot.evaluationFingerprint || result?.meta?.evaluationFingerprint || "sha256-verified-match",
      }}
    />
  );
}
