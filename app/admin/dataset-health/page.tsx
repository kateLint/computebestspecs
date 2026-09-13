import React from 'react';
import DatasetHealthDashboard from '@/components/DatasetHealthDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dataset Health & Calibration Control Plane | ComputeBestSpecs',
  description: 'Physical validation matrix, calibration profiles, and canonical requirement freshness audits.'
};

export default function DatasetHealthPage() {
  return (
    <div className="min-h-screen bg-surface-base py-12 px-4 sm:px-6 lg:px-8">
      <DatasetHealthDashboard />
    </div>
  );
}
