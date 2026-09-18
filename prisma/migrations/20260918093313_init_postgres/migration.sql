-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "url" TEXT,
    "official" BOOLEAN NOT NULL DEFAULT false,
    "license" TEXT,
    "commercialUseAllowed" BOOLEAN NOT NULL DEFAULT true,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "confidence" TEXT NOT NULL DEFAULT 'HIGH',
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "rawContentLocation" TEXT,
    "rawContentText" TEXT,
    "contentHash" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parserVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareComponent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "canonicalModel" TEXT NOT NULL,
    "architecture" TEXT NOT NULL DEFAULT 'x86_64',
    "physicalCores" INTEGER,
    "threads" INTEGER,
    "performanceScore" INTEGER NOT NULL DEFAULT 50,
    "singleCoreScore" INTEGER,
    "multiCoreScore" INTEGER,
    "generation" TEXT,
    "releaseYear" INTEGER,
    "laptopVariant" BOOLEAN NOT NULL DEFAULT false,
    "powerClass" TEXT,
    "vramGb" DOUBLE PRECISION DEFAULT 0,
    "memoryType" TEXT,
    "memoryBandwidthGBps" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareAlias" (
    "id" TEXT NOT NULL,
    "hardwareComponentId" TEXT NOT NULL,
    "aliasName" TEXT NOT NULL,
    "source" TEXT DEFAULT 'catalog_seed',

    CONSTRAINT "HardwareAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareCapability" (
    "id" TEXT NOT NULL,
    "hardwareComponentId" TEXT NOT NULL,
    "capabilityName" TEXT NOT NULL,
    "capabilityValue" BOOLEAN NOT NULL DEFAULT true,
    "minimumVersion" TEXT,

    CONSTRAINT "HardwareCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Software" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Software_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareVersion" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "releaseDate" TIMESTAMP(3),
    "releaseYear" INTEGER,
    "dataQuality" TEXT NOT NULL DEFAULT 'VERIFIED',
    "supportedOperatingSystems" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementProfile" (
    "id" TEXT NOT NULL,
    "softwareVersionId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'MINIMUM',
    "osFamily" TEXT NOT NULL,
    "minOsVersion" TEXT,
    "architectures" TEXT NOT NULL DEFAULT '["x86_64","arm64"]',
    "minCpuScore" INTEGER,
    "minCpuCores" INTEGER DEFAULT 4,
    "minRamGb" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "recommendedRamGb" DOUBLE PRECISION,
    "installStorageGb" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "scratchStorageGb" DOUBLE PRECISION DEFAULT 0.0,
    "preferredStorageType" TEXT DEFAULT 'NVME_SSD',
    "requiresDedicatedGpu" BOOLEAN NOT NULL DEFAULT false,
    "minGpuScore" INTEGER,
    "minVramGb" DOUBLE PRECISION DEFAULT 0.0,
    "requiresVirtualization" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementRule" (
    "id" TEXT NOT NULL,
    "requirementProfileId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "operator" TEXT NOT NULL DEFAULT 'REQUIRED',
    "severity" TEXT NOT NULL DEFAULT 'HARD',
    "minimumVersion" TEXT,
    "description" TEXT,

    CONSTRAINT "RequirementRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementRevision" (
    "id" TEXT NOT NULL,
    "softwareVersionId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "sourceId" TEXT,
    "changesSummary" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkloadProfile" (
    "id" TEXT NOT NULL,
    "softwareVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "intensity" TEXT NOT NULL DEFAULT 'medium',
    "typicalRamGb" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "peakRamGb" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "typicalCpuPercent" INTEGER NOT NULL DEFAULT 30,
    "peakCpuPercent" INTEGER NOT NULL DEFAULT 75,
    "typicalGpuPercent" INTEGER NOT NULL DEFAULT 20,
    "peakGpuPercent" INTEGER NOT NULL DEFAULT 50,
    "typicalVramGb" DOUBLE PRECISION DEFAULT 1.0,
    "peakVramGb" DOUBLE PRECISION DEFAULT 2.0,
    "diskScratchGb" DOUBLE PRECISION DEFAULT 10.0,
    "workloadConcurrencyFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "usesVirtualization" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkloadProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkDataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceId" TEXT,
    "version" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkObservation" (
    "id" TEXT NOT NULL,
    "benchmarkDatasetId" TEXT NOT NULL,
    "hardwareComponentId" TEXT,
    "hardwareRawName" TEXT NOT NULL,
    "benchmarkType" TEXT NOT NULL,
    "benchmarkScene" TEXT,
    "scoreValue" DOUBLE PRECISION NOT NULL,
    "normalizedScore" INTEGER,
    "sampleCount" INTEGER NOT NULL DEFAULT 1,
    "osFamily" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareBenchmarkAggregate" (
    "id" TEXT NOT NULL,
    "hardwareComponentId" TEXT NOT NULL,
    "benchmarkType" TEXT NOT NULL,
    "aggregateScore" DOUBLE PRECISION NOT NULL,
    "minScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "sampleCount" INTEGER NOT NULL DEFAULT 1,
    "confidenceLevel" TEXT NOT NULL DEFAULT 'HIGH',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareBenchmarkAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationSnapshot" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "evaluationFingerprint" TEXT NOT NULL,
    "inputSnapshot" TEXT NOT NULL,
    "requirementsSnapshot" TEXT NOT NULL,
    "resultSnapshot" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL DEFAULT '2026.1',
    "benchmarkDatasetVersion" TEXT NOT NULL DEFAULT '2026.1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationFeedback" (
    "id" TEXT NOT NULL,
    "evaluationSnapshotId" TEXT NOT NULL,
    "userRating" INTEGER NOT NULL,
    "feedbackText" TEXT,
    "disagreementComponent" TEXT,
    "actualMachineBehavior" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Source_provider_idx" ON "Source"("provider");

-- CreateIndex
CREATE INDEX "SourceDocument_sourceId_idx" ON "SourceDocument"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareComponent_canonicalModel_key" ON "HardwareComponent"("canonicalModel");

-- CreateIndex
CREATE INDEX "HardwareComponent_type_idx" ON "HardwareComponent"("type");

-- CreateIndex
CREATE INDEX "HardwareComponent_manufacturer_idx" ON "HardwareComponent"("manufacturer");

-- CreateIndex
CREATE INDEX "HardwareComponent_canonicalModel_idx" ON "HardwareComponent"("canonicalModel");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareAlias_aliasName_key" ON "HardwareAlias"("aliasName");

-- CreateIndex
CREATE INDEX "HardwareAlias_aliasName_idx" ON "HardwareAlias"("aliasName");

-- CreateIndex
CREATE INDEX "HardwareAlias_hardwareComponentId_idx" ON "HardwareAlias"("hardwareComponentId");

-- CreateIndex
CREATE INDEX "HardwareCapability_capabilityName_idx" ON "HardwareCapability"("capabilityName");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareCapability_hardwareComponentId_capabilityName_key" ON "HardwareCapability"("hardwareComponentId", "capabilityName");

-- CreateIndex
CREATE UNIQUE INDEX "Software_slug_key" ON "Software"("slug");

-- CreateIndex
CREATE INDEX "Software_slug_idx" ON "Software"("slug");

-- CreateIndex
CREATE INDEX "Software_name_idx" ON "Software"("name");

-- CreateIndex
CREATE INDEX "SoftwareVersion_softwareId_idx" ON "SoftwareVersion"("softwareId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareVersion_softwareId_version_key" ON "SoftwareVersion"("softwareId", "version");

-- CreateIndex
CREATE INDEX "RequirementProfile_softwareVersionId_idx" ON "RequirementProfile"("softwareVersionId");

-- CreateIndex
CREATE INDEX "RequirementRule_requirementProfileId_idx" ON "RequirementRule"("requirementProfileId");

-- CreateIndex
CREATE INDEX "RequirementRule_capability_idx" ON "RequirementRule"("capability");

-- CreateIndex
CREATE INDEX "RequirementRevision_softwareVersionId_idx" ON "RequirementRevision"("softwareVersionId");

-- CreateIndex
CREATE INDEX "WorkloadProfile_softwareVersionId_idx" ON "WorkloadProfile"("softwareVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkDataset_version_key" ON "BenchmarkDataset"("version");

-- CreateIndex
CREATE INDEX "BenchmarkDataset_version_idx" ON "BenchmarkDataset"("version");

-- CreateIndex
CREATE INDEX "BenchmarkObservation_benchmarkDatasetId_idx" ON "BenchmarkObservation"("benchmarkDatasetId");

-- CreateIndex
CREATE INDEX "BenchmarkObservation_hardwareComponentId_idx" ON "BenchmarkObservation"("hardwareComponentId");

-- CreateIndex
CREATE INDEX "BenchmarkObservation_benchmarkType_idx" ON "BenchmarkObservation"("benchmarkType");

-- CreateIndex
CREATE INDEX "HardwareBenchmarkAggregate_hardwareComponentId_idx" ON "HardwareBenchmarkAggregate"("hardwareComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareBenchmarkAggregate_hardwareComponentId_benchmarkTyp_key" ON "HardwareBenchmarkAggregate"("hardwareComponentId", "benchmarkType");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationSnapshot_publicId_key" ON "EvaluationSnapshot"("publicId");

-- CreateIndex
CREATE INDEX "EvaluationSnapshot_publicId_idx" ON "EvaluationSnapshot"("publicId");

-- CreateIndex
CREATE INDEX "EvaluationSnapshot_evaluationFingerprint_idx" ON "EvaluationSnapshot"("evaluationFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationFeedback_evaluationSnapshotId_key" ON "EvaluationFeedback"("evaluationSnapshotId");

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareAlias" ADD CONSTRAINT "HardwareAlias_hardwareComponentId_fkey" FOREIGN KEY ("hardwareComponentId") REFERENCES "HardwareComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareCapability" ADD CONSTRAINT "HardwareCapability_hardwareComponentId_fkey" FOREIGN KEY ("hardwareComponentId") REFERENCES "HardwareComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareVersion" ADD CONSTRAINT "SoftwareVersion_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementProfile" ADD CONSTRAINT "RequirementProfile_softwareVersionId_fkey" FOREIGN KEY ("softwareVersionId") REFERENCES "SoftwareVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementRule" ADD CONSTRAINT "RequirementRule_requirementProfileId_fkey" FOREIGN KEY ("requirementProfileId") REFERENCES "RequirementProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementRevision" ADD CONSTRAINT "RequirementRevision_softwareVersionId_fkey" FOREIGN KEY ("softwareVersionId") REFERENCES "SoftwareVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkloadProfile" ADD CONSTRAINT "WorkloadProfile_softwareVersionId_fkey" FOREIGN KEY ("softwareVersionId") REFERENCES "SoftwareVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkDataset" ADD CONSTRAINT "BenchmarkDataset_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkObservation" ADD CONSTRAINT "BenchmarkObservation_benchmarkDatasetId_fkey" FOREIGN KEY ("benchmarkDatasetId") REFERENCES "BenchmarkDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkObservation" ADD CONSTRAINT "BenchmarkObservation_hardwareComponentId_fkey" FOREIGN KEY ("hardwareComponentId") REFERENCES "HardwareComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareBenchmarkAggregate" ADD CONSTRAINT "HardwareBenchmarkAggregate_hardwareComponentId_fkey" FOREIGN KEY ("hardwareComponentId") REFERENCES "HardwareComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationFeedback" ADD CONSTRAINT "EvaluationFeedback_evaluationSnapshotId_fkey" FOREIGN KEY ("evaluationSnapshotId") REFERENCES "EvaluationSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
