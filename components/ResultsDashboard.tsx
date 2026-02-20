"use client";

import { useCallback } from "react";
import type { CalculationResults } from "@/lib/calculations";
import ScoreGauge from "./ScoreGauge";
import ComparisonChart from "./ComparisonChart";
import { jsPDF } from "jspdf";

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
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-2xl font-bold ${accent ? "text-[#0f487f]" : "text-gray-900"}`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch("/logo.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function ResultsDashboard({ results }: ResultsDashboardProps) {
  const handleDownloadPDF = useCallback(async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Try to load and add the logo
    const logoData = await loadLogoAsBase64();
    if (logoData) {
      const logoWidth = 60;
      const logoHeight = 19; // Aspect ratio ~3.18:1 based on 5951x1871
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoData, "PNG", logoX, y, logoWidth, logoHeight);
      y += logoHeight + 8;
    }

    // Title
    doc.setFontSize(20);
    doc.setTextColor(15, 72, 127); // #0f487f
    doc.text("Performance Affordability Report", pageWidth / 2, y, { align: "center" });
    y += 12;

    // Divider line
    doc.setDrawColor(207, 207, 207); // #cfcfcf
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // Key Metrics section
    doc.setFontSize(14);
    doc.setTextColor(15, 72, 127);
    doc.text("Key Metrics", 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    const metrics = [
      ["Car-to-Net-Worth", `${results.carToNetWorthPercent.toFixed(1)}%`],
      ["True Annual Cost", formatCurrency(results.trueAnnualCost)],
      ["FI Delay", `${results.fiDelayYears.toFixed(1)} years`],
      ["Savings Rate", `${results.savingsRate.toFixed(1)}%`],
      ["Discipline Score", `${results.disciplineScore} / 100 — ${results.disciplineCategory}`],
    ];

    for (const [label, value] of metrics) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(label, 25, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(value, pageWidth - 25, y, { align: "right" });
      y += 7;
    }

    y += 6;

    // Portfolio Comparison
    doc.setFontSize(14);
    doc.setTextColor(15, 72, 127);
    doc.text("Portfolio at Retirement", 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Without Car", 25, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94); // green
    doc.text(formatCurrency(results.fvNoCar), pageWidth - 25, y, { align: "right" });
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("With Car", 25, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68); // red
    doc.text(formatCurrency(results.fvWithCar), pageWidth - 25, y, { align: "right" });
    y += 12;

    // Detailed Breakdown section
    doc.setFontSize(14);
    doc.setTextColor(15, 72, 127);
    doc.text("Detailed Breakdown", 20, y);
    y += 8;

    doc.setFontSize(10);

    const details = [
      ["FI Number (4% Rule)", formatCurrency(results.fiNumber)],
      ["Loan Amount", formatCurrency(results.loanAmount)],
      ["Monthly Payment", formatCurrency(results.monthlyPayment)],
      ["Annual Loan Payments", formatCurrency(results.annualLoanPayment)],
      ["Annual Depreciation", formatCurrency(results.annualDepreciation)],
      ["Resale Value", formatCurrency(results.resaleValue)],
      ["Opportunity Cost of Purchase", formatCurrency(results.fvPurchase)],
      ["Opportunity Cost of Annual Expenses", formatCurrency(results.fvAnnualCost)],
      ["Total Opportunity Cost", formatCurrency(results.opportunityCost)],
      ["Portfolio Without Car", formatCurrency(results.fvNoCar)],
      ["Portfolio With Car", formatCurrency(results.fvWithCar)],
      ["Car-to-Investable Assets", `${results.carToInvestablePercent.toFixed(1)}%`],
    ];

    for (const [label, value] of details) {
      const isHighlight = label === "Total Opportunity Cost";
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(label, 25, y);
      doc.setFont("helvetica", "bold");
      if (isHighlight) {
        doc.setTextColor(15, 72, 127);
      } else {
        doc.setTextColor(30, 30, 30);
      }
      doc.text(value, pageWidth - 25, y, { align: "right" });
      y += 7;
    }

    y += 8;

    // Footer divider
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("Generated by Performance Affordability Calculator", pageWidth / 2, y, { align: "center" });

    doc.save("performance-affordability-report.pdf");
  }, [results]);

  return (
    <div className="space-y-8">
      {/* Download PDF button */}
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 text-sm font-medium text-[#0f487f] border border-[#0f487f] hover:bg-[#0f487f] hover:text-white px-5 py-2.5 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

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
          <h3 className="text-lg font-semibold mb-4 text-gray-600">
            Discipline Score
          </h3>
          <ScoreGauge
            score={results.disciplineScore}
            category={results.disciplineCategory}
          />
        </div>

        <div className="glass-panel card-hover p-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-600">
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
        <h3 className="text-lg font-semibold mb-6 text-gray-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0f487f]" />
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
      <span className="text-xs text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-lg font-semibold ${highlight ? "text-[#0f487f]" : "text-gray-900"}`}
      >
        {value}
      </span>
    </div>
  );
}
