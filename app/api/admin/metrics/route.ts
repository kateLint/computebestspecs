import { NextResponse } from 'next/server';
import { computeDatasetQualityReport } from '@/lib/data/dataset-metrics';
import { runPhysicalValidationMatrix } from '@/lib/validation/physical/physical-validation-runner';
import { CANONICAL_CALIBRATION_PROFILES } from '@/lib/calibration/calibration-models';

export async function GET() {
  const qualityReport = computeDatasetQualityReport();
  const validationSummary = runPhysicalValidationMatrix();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    datasetQuality: qualityReport,
    physicalValidation: validationSummary,
    calibrationProfiles: CANONICAL_CALIBRATION_PROFILES
  });
}
