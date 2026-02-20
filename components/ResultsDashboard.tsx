"use client";

import type { CalculationResults } from "@/lib/calculations";
import ScoreGauge from "./ScoreGauge";
import ComparisonChart from "./ComparisonChart";

interface ResultsDashboardProps {
  results: CalculationResults;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="glass-panel card-hover p-6 flex flex-col gap-1">
      <span className="text-sm text-neutral-400">{label}</span>
      <span
        className={`text-2xl font-bold ${accent ? "text-red-500" : "text-white"}`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-neutral-500">{sub}</span>}
    </div>
  );
}

export default function ResultsDashboard({ results }: ResultsDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Car-to-Net-Worth"
          value={`${results.carToNetWorthPercent.toFixed(1)}%`}
          sub={
            results.carToNetWorthPercent <= 10
              ? "Within recommended range"
              : "Above recommended range"
          }
        />
        <StatCard
          label="True Annual Cost"
          value={formatCurrency(results.trueAnnualCost)}
          sub="Including depreciation & opportunity"
          accent
        />
        <StatCard
          label="FI Delay"
          value={`${results.fiDelayYears.toFixed(1)} years`}
          sub={`${results.yearsToFiNoCar}yr → ${results.yearsToFiWithCar}yr to FI`}
        />
        <StatCard
          label="Savings Rate"
          value={`${results.savingsRate.toFixed(1)}%`}
          sub={
            results.savingsRate >= 25
              ? "Excellent savings rate"
              : "Consider increasing savings"
          }
        />
      </div>

      {/* Score + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel card-hover p-8 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-4 text-neutral-300">
            Discipline Score
          </h3>
          <ScoreGauge
            score={results.disciplineScore}
            category={results.disciplineCategory}
          />
        </div>

        <div className="glass-panel card-hover p-8">
          <h3 className="text-lg font-semibold mb-4 text-neutral-300">
            Portfolio at Retirement
          </h3>
          <ComparisonChart
            fvNoCar={results.fvNoCar}
            fvWithCar={results.fvWithCar}
          />
        </div>
      </div>

      {/* Detail breakdown */}
      <div className="glass-panel card-hover p-8">
        <h3 className="text-lg font-semibold mb-6 text-neutral-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Detailed Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-8">
          <Detail label="FI Number (4% Rule)" value={formatCurrency(results.fiNumber)} />
          <Detail label="Loan Amount" value={formatCurrency(results.loanAmount)} />
          <Detail label="Monthly Payment" value={formatCurrency(results.monthlyPayment)} />
          <Detail label="Annual Loan Payments" value={formatCurrency(results.annualLoanPayment)} />
          <Detail label="Annual Depreciation" value={formatCurrency(results.annualDepreciation)} />
          <Detail label="Resale Value" value={formatCurrency(results.resaleValue)} />
          <Detail label="Opportunity Cost of Purchase" value={formatCurrency(results.fvPurchase)} />
          <Detail label="Opportunity Cost of Annual Expenses" value={formatCurrency(results.fvAnnualCost)} />
          <Detail label="Total Opportunity Cost" value={formatCurrency(results.opportunityCost)} highlight />
          <Detail label="Portfolio Without Car" value={formatCurrency(results.fvNoCar)} />
          <Detail label="Portfolio With Car" value={formatCurrency(results.fvWithCar)} />
          <Detail label="Car-to-Investable Assets" value={`${results.carToInvestablePercent.toFixed(1)}%`} />
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-neutral-500 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-lg font-semibold ${highlight ? "text-red-400" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
