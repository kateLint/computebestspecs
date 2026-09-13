'use client';

import React, { useState } from 'react';
import { computeDatasetQualityReport, DatasetQualityReport } from '../lib/data/dataset-metrics';
import { runPhysicalValidationMatrix, ValidationSummaryReport } from '../lib/validation/physical/physical-validation-runner';
import { CANONICAL_CALIBRATION_PROFILES } from '../lib/calibration/calibration-models';
import { Database, ShieldCheck, Cpu, Activity, RefreshCw, AlertTriangle, CheckCircle, Flame, Layers } from 'lucide-react';

export default function DatasetHealthDashboard() {
  const [report, setReport] = useState<DatasetQualityReport>(() => computeDatasetQualityReport());
  const [validationMatrix, setValidationMatrix] = useState<ValidationSummaryReport>(() => runPhysicalValidationMatrix());
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PHYSICAL_MATRIX' | 'CALIBRATION'>('OVERVIEW');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setReport(computeDatasetQualityReport());
      setValidationMatrix(runPhysicalValidationMatrix());
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Alpha v0.1 Production Audit
            </span>
            <span className="text-xs text-content-muted">
              Updated {new Date(report.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-content-strong mt-2">
            Dataset Integrity & Calibration Control Plane
          </h1>
          <p className="text-sm text-content-body mt-1">
            Real-world physical machine telemetry, mathematical calibration layers, and requirement freshness.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Re-Auditing...' : 'Run Live Audit'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle gap-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'border-brand-primary text-brand-primary font-semibold'
              : 'border-transparent text-content-muted hover:text-content-strong'
          }`}
        >
          Data Health & Quality ({report.overallHealthScore}/100)
        </button>
        <button
          onClick={() => setActiveTab('PHYSICAL_MATRIX')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'PHYSICAL_MATRIX'
              ? 'border-brand-primary text-brand-primary font-semibold'
              : 'border-transparent text-content-muted hover:text-content-strong'
          }`}
        >
          Physical Machine Matrix ({validationMatrix.overallAccuracyPercent}% Match)
        </button>
        <button
          onClick={() => setActiveTab('CALIBRATION')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'CALIBRATION'
              ? 'border-brand-primary text-brand-primary font-semibold'
              : 'border-transparent text-content-muted hover:text-content-strong'
          }`}
        >
          Calibration Profiles ({CANONICAL_CALIBRATION_PROFILES.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-surface-card border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-content-muted text-xs font-semibold uppercase tracking-wider">
                <span>Health Grade</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {report.overallHealthGrade.replace('GRADE_', '').replace('_', ' ')}
              </div>
              <p className="text-xs text-content-body">
                Composite Score: <strong className="text-content-strong">{report.overallHealthScore}/100</strong>
              </p>
            </div>

            <div className="p-5 rounded-xl bg-surface-card border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-content-muted text-xs font-semibold uppercase tracking-wider">
                <span>Verified Software</span>
                <Database className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="text-2xl font-bold text-content-strong">
                {report.softwareMetrics.verifiedRatioPercent}%
              </div>
              <p className="text-xs text-content-body">
                {report.softwareMetrics.verifiedCount} of {report.softwareMetrics.totalSoftwareCount} active profiles
              </p>
            </div>

            <div className="p-5 rounded-xl bg-surface-card border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-content-muted text-xs font-semibold uppercase tracking-wider">
                <span>Hardware Coverage</span>
                <Cpu className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-content-strong">
                {report.hardwareMetrics.benchmarkCoveragePercent}%
              </div>
              <p className="text-xs text-content-body">
                {report.hardwareMetrics.benchmarkCoveredCount} benchmark-indexed devices
              </p>
            </div>

            <div className="p-5 rounded-xl bg-surface-card border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-content-muted text-xs font-semibold uppercase tracking-wider">
                <span>Requirement Freshness</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-content-strong">
                {report.freshnessMetrics.freshUnder30DaysPercent}%
              </div>
              <p className="text-xs text-content-body">
                &lt;30 days since last canonical audit
              </p>
            </div>
          </div>

          {/* Actionable Insights */}
          <div className="p-6 rounded-2xl bg-surface-subtle border border-border-subtle space-y-3">
            <h3 className="text-sm font-semibold text-content-strong flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Auditor Insights & Integrity Checks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.actionableInsights.map((insight, idx) => (
                <div key={idx} className="p-3 bg-surface-card rounded-lg border border-border-subtle text-xs text-content-body">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Physical Machine Matrix */}
      {activeTab === 'PHYSICAL_MATRIX' && (
        <div className="space-y-6">
          <div className="bg-surface-card border border-border-subtle p-5 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-content-strong text-base">
                Physical Validation Suite: {validationMatrix.totalPhysicalRuns} Telemetry Runs
              </h3>
              <p className="text-xs text-content-body mt-0.5">
                Comparing deterministic engine predictions against real-world measured RAM, VRAM, and thermal throttling.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                {validationMatrix.exactOrMinorMatches} Matches
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                {validationMatrix.moderateDisagreements} Moderate Drift
              </span>
              <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                {validationMatrix.criticalDisagreements} Critical
              </span>
            </div>
          </div>

          {/* Telemetry Run Cards */}
          <div className="space-y-3">
            {validationMatrix.discrepancies.map((disc) => (
              <div
                key={disc.runId}
                className="p-4 bg-surface-card border border-border-subtle rounded-xl space-y-3 hover:border-brand-primary/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-content-strong">
                      {disc.machineName}
                    </h4>
                    <p className="text-xs text-content-muted">
                      Workload: {disc.workloadName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      disc.severity === 'MATCH'
                        ? 'bg-emerald-100 text-emerald-800'
                        : disc.severity === 'MINOR_BIAS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {disc.severity.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-content-strong px-2 py-0.5 bg-surface-subtle border border-border-subtle rounded">
                      Pred: {disc.predictedVerdict} ({disc.predictedScore}) vs Real: {disc.groundTruthExperience}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-surface-subtle p-3 rounded-lg border border-border-subtle">
                  <div>
                    <span className="text-content-muted">RAM Peak:</span>{' '}
                    <strong className="text-content-strong">{disc.telemetryDelta.measuredPeakRamGib}GB / {disc.telemetryDelta.ramCapacityGib}GB</strong>
                  </div>
                  <div>
                    <span className="text-content-muted">Swap Thrash:</span>{' '}
                    <strong className={disc.telemetryDelta.swapUsedGib > 2 ? 'text-amber-600 font-bold' : 'text-content-strong'}>
                      {disc.telemetryDelta.swapUsedGib} GB
                    </strong>
                  </div>
                  <div>
                    <span className="text-content-muted">Thermal Throttled:</span>{' '}
                    <strong className={disc.telemetryDelta.thermalThrottled ? 'text-rose-600' : 'text-emerald-600'}>
                      {disc.telemetryDelta.thermalThrottled ? 'YES' : 'NO'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-content-muted">Bottleneck:</span>{' '}
                    <strong className="text-content-strong">{disc.observedBottleneck}</strong>
                  </div>
                </div>

                <p className="text-xs text-content-body italic">
                  &ldquo;{disc.analysis}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Calibration Profiles */}
      {activeTab === 'CALIBRATION' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CANONICAL_CALIBRATION_PROFILES.map((profile) => (
              <div
                key={profile.id}
                className="p-5 bg-surface-card border border-border-subtle rounded-xl space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-xs font-semibold rounded">
                      {profile.workloadClass}
                    </span>
                    <h4 className="text-sm font-bold text-content-strong mt-1">
                      {profile.metric}
                    </h4>
                  </div>
                  <span className="text-xs text-content-muted font-mono">
                    {profile.coefficientVersion}
                  </span>
                </div>

                <p className="text-xs text-content-body">
                  {profile.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-surface-subtle p-3 rounded-lg border border-border-subtle">
                  <div>
                    <span className="text-content-muted">Method:</span>{' '}
                    <strong className="text-content-strong">{profile.normalizationMethod}</strong>
                  </div>
                  <div>
                    <span className="text-content-muted">Sample Depth:</span>{' '}
                    <strong className="text-content-strong">{profile.sampleCount} runs</strong>
                  </div>
                  <div>
                    <span className="text-content-muted">Min Threshold:</span>{' '}
                    <strong className="text-content-strong">{profile.coefficients.minThreshold} {profile.unit}</strong>
                  </div>
                  <div>
                    <span className="text-content-muted">Rec Threshold:</span>{' '}
                    <strong className="text-content-strong">{profile.coefficients.recommendedThreshold} {profile.unit}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
