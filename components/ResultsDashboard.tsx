"use client";

import { useCallback } from "react";
import type { CalculationResults } from "@/lib/calculations";
import ScoreGauge from "./ScoreGauge";
import ComparisonChart from "./ComparisonChart";
import { jsPDF } from "jspdf";

interface ResultsDashboardProps {
  results: CalculationResults;
  firstName: string;
  lastName: string;
  email: string;
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

function drawGaugeArc(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: [number, number, number],
  lineWidth: number
) {
  const steps = 60;
  const totalAngle = endAngle - startAngle;
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(lineWidth);
  for (let i = 0; i < steps; i++) {
    const a1 = startAngle + (i / steps) * totalAngle;
    const a2 = startAngle + ((i + 1) / steps) * totalAngle;
    doc.line(
      cx + radius * Math.cos(a1),
      cy + radius * Math.sin(a1),
      cx + radius * Math.cos(a2),
      cy + radius * Math.sin(a2)
    );
  }
}

function getScoreColor(score: number): [number, number, number] {
  if (score >= 85) return [34, 197, 94];
  if (score >= 70) return [59, 130, 246];
  if (score >= 50) return [245, 158, 11];
  return [239, 68, 68];
}

export default function ResultsDashboard({
  results,
  firstName,
  lastName,
  email,
}: ResultsDashboardProps) {
  const handleDownloadPDF = useCallback(async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // --- Logo ---
    const logoData = await loadLogoAsBase64();
    if (logoData) {
      const logoWidth = 60;
      const logoHeight = 19;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoData, "PNG", logoX, y, logoWidth, logoHeight);
      y += logoHeight + 8;
    }

    // --- Title ---
    doc.setFontSize(20);
    doc.setTextColor(15, 72, 127);
    doc.text("Performance Affordability Report", pageWidth / 2, y, {
      align: "center",
    });
    y += 10;

    // --- User Info (single line: name + email) ---
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName || email) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const userLine =
        fullName && email
          ? `Prepared for: ${fullName}  |  ${email}`
          : fullName
            ? `Prepared for: ${fullName}`
            : email;
      doc.text(userLine, pageWidth / 2, y, { align: "center" });
      y += 6;
    }

    // --- Divider ---
    y += 2;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    // === KEY METRICS ===
    doc.setFontSize(13);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Key Metrics", 20, y);
    y += 8;

    const metrics = [
      ["Car-to-Net-Worth", `${results.carToNetWorthPercent.toFixed(1)}%`],
      ["True Annual Cost", formatCurrency(results.trueAnnualCost)],
      ["FI Delay", `${results.fiDelayYears.toFixed(1)} years`],
      ["Savings Rate", `${results.savingsRate.toFixed(1)}%`],
      [
        "Discipline Score",
        `${results.disciplineScore} / 100 — ${results.disciplineCategory}`,
      ],
    ];

    for (const [label, value] of metrics) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(label, 25, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(value, pageWidth - 25, y, { align: "right" });
      y += 6.5;
    }

    y += 4;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.3);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    // === TWO-COLUMN: Discipline Score Gauge (left) + Portfolio Chart (right) ===
    const colStartY = y;
    const leftColX = 20;
    const rightColX = pageWidth / 2 + 5;

    // --- LEFT: Discipline Score Gauge ---
    doc.setFontSize(12);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Discipline Score", leftColX, y);

    const gaugeCx = leftColX + 38;
    const gaugeCy = y + 24;
    const gaugeRadius = 18;
    const gaugeStartAngle = (3 * Math.PI) / 4;
    const gaugeTotalAngle = (3 * Math.PI) / 2;

    // Background arc (light gray)
    drawGaugeArc(
      doc,
      gaugeCx,
      gaugeCy,
      gaugeRadius,
      gaugeStartAngle,
      gaugeStartAngle + gaugeTotalAngle,
      [220, 220, 220],
      3.5
    );

    // Score arc (colored)
    const scoreColor = getScoreColor(results.disciplineScore);
    const scoreRatio = Math.min(results.disciplineScore / 100, 1);
    if (scoreRatio > 0) {
      drawGaugeArc(
        doc,
        gaugeCx,
        gaugeCy,
        gaugeRadius,
        gaugeStartAngle,
        gaugeStartAngle + scoreRatio * gaugeTotalAngle,
        scoreColor,
        3.5
      );
    }

    // Score number in center
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(String(results.disciplineScore), gaugeCx, gaugeCy + 2, {
      align: "center",
    });

    // "/ 100" below score
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text("/ 100", gaugeCx, gaugeCy + 8, { align: "center" });

    // Category label below gauge
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(
      results.disciplineCategory,
      gaugeCx,
      gaugeCy + gaugeRadius + 10,
      { align: "center" }
    );

    // --- RIGHT: Portfolio at Retirement Bar Chart ---
    doc.setFontSize(12);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Portfolio at Retirement", rightColX, colStartY);

    const chartY = colStartY + 10;
    const barMaxWidth = 55;
    const barHeight = 10;
    const maxPortfolio = Math.max(results.fvNoCar, results.fvWithCar);

    // "Without Car" bar
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Without Car", rightColX, chartY);
    const noCarWidth = Math.max(
      2,
      (results.fvNoCar / maxPortfolio) * barMaxWidth
    );
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(rightColX, chartY + 2, noCarWidth, barHeight, 1, 1, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94);
    doc.text(
      formatCurrency(results.fvNoCar),
      rightColX + noCarWidth + 3,
      chartY + 9
    );

    // "With Car" bar
    const bar2Y = chartY + barHeight + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("With Car", rightColX, bar2Y);
    const withCarWidth = Math.max(
      2,
      (results.fvWithCar / maxPortfolio) * barMaxWidth
    );
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(rightColX, bar2Y + 2, withCarWidth, barHeight, 1, 1, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text(
      formatCurrency(results.fvWithCar),
      rightColX + withCarWidth + 3,
      bar2Y + 9
    );

    // Difference label
    const diffY = bar2Y + barHeight + 8;
    const diff = results.fvNoCar - results.fvWithCar;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 72, 127);
    doc.text(`Difference: ${formatCurrency(diff)}`, rightColX, diffY);

    // Move y past the two-column section
    y = Math.max(gaugeCy + gaugeRadius + 14, diffY + 6);
    y += 4;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.3);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    // === DETAILED BREAKDOWN ===
    doc.setFontSize(13);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Breakdown", 20, y);
    y += 8;

    const details = [
      ["FI Number (4% Rule)", formatCurrency(results.fiNumber)],
      ["Loan Amount", formatCurrency(results.loanAmount)],
      ["Monthly Payment", formatCurrency(results.monthlyPayment)],
      ["Annual Loan Payments", formatCurrency(results.annualLoanPayment)],
      ["Annual Depreciation", formatCurrency(results.annualDepreciation)],
      ["Resale Value", formatCurrency(results.resaleValue)],
      [
        "Opportunity Cost of Purchase",
        formatCurrency(results.fvPurchase),
      ],
      [
        "Opportunity Cost of Annual Expenses",
        formatCurrency(results.fvAnnualCost),
      ],
      ["Total Opportunity Cost", formatCurrency(results.opportunityCost)],
      ["Portfolio Without Car", formatCurrency(results.fvNoCar)],
      ["Portfolio With Car", formatCurrency(results.fvWithCar)],
      [
        "Car-to-Investable Assets",
        `${results.carToInvestablePercent.toFixed(1)}%`,
      ],
    ];

    for (const [label, value] of details) {
      const isHighlight = label === "Total Opportunity Cost";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(label, 25, y);
      doc.setFont("helvetica", "bold");
      if (isHighlight) {
        doc.setTextColor(15, 72, 127);
      } else {
        doc.setTextColor(30, 30, 30);
      }
      doc.text(value, pageWidth - 25, y, { align: "right" });
      y += 6.5;
    }

    // --- Footer ---
    y += 4;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 5;

    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Generated by Performance Affordability Calculator",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    // =============================================
    // PAGE 2: Explanation & Glossary
    // =============================================
    doc.addPage();
    y = 20;
    const textWidth = pageWidth - 40;

    // --- Page 2 Title ---
    doc.setFontSize(16);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Understanding Your Results", pageWidth / 2, y, {
      align: "center",
    });
    y += 10;

    // --- Score-based explanation paragraph ---
    let explanation: string;
    if (results.disciplineScore >= 85) {
      explanation =
        `Your Discipline Score of ${results.disciplineScore}/100 places you in the Elite Discipline category. ` +
        `This is an outstanding result, indicating that your performance vehicle purchase is well within your financial means. ` +
        `Your car-to-net-worth ratio, savings rate, and projected financial independence timeline all suggest that you can ` +
        `comfortably enjoy this vehicle without materially impacting your long-term wealth goals. Continue maintaining this ` +
        `level of financial discipline as you pursue your automotive passion.`;
    } else if (results.disciplineScore >= 70) {
      explanation =
        `Your Discipline Score of ${results.disciplineScore}/100 places you in the Controlled Enthusiast category. ` +
        `This is a solid result, indicating that your performance vehicle purchase is generally reasonable relative to your ` +
        `financial profile. While the car does have a measurable impact on your path to financial independence, your overall ` +
        `savings habits and net worth provide a healthy buffer. Consider monitoring your total vehicle costs annually to ` +
        `ensure they remain in line with your wealth-building objectives.`;
    } else if (results.disciplineScore >= 50) {
      explanation =
        `Your Discipline Score of ${results.disciplineScore}/100 places you in the Aggressive category. ` +
        `This result indicates that your performance vehicle purchase represents a significant allocation of your financial ` +
        `resources. The opportunity cost of ownership is meaningfully impacting your projected retirement portfolio and ` +
        `delaying your financial independence timeline. You may want to evaluate whether a less expensive vehicle, shorter ` +
        `hold period, or increased savings rate could help bring your financial plan back into better balance.`;
    } else {
      explanation =
        `Your Discipline Score of ${results.disciplineScore}/100 places you in the Lifestyle Risk category. ` +
        `This is a warning signal that your performance vehicle purchase may be stretching your finances beyond a ` +
        `sustainable level. The car represents a large percentage of your net worth and investable assets, and the true ` +
        `annual cost is significantly eroding your ability to build long-term wealth. We strongly recommend revisiting your ` +
        `vehicle budget, exploring more affordable alternatives, or substantially increasing your income and savings before ` +
        `committing to this purchase.`;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const explanationLines = doc.splitTextToSize(explanation, textWidth);
    doc.text(explanationLines, 20, y);
    y += explanationLines.length * 4.5 + 6;

    // --- Divider ---
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    // --- Glossary Header ---
    doc.setFontSize(14);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Glossary of Terms", 20, y);
    y += 8;

    const glossary: [string, string][] = [
      [
        "Discipline Score",
        "A composite rating from 0 to 100 that evaluates how well a vehicle purchase aligns with your overall financial health, based on net worth ratios, savings rate, FI delay, and investable asset ratios.",
      ],
      [
        "FI Number (4% Rule)",
        "The total investment portfolio needed to fund your retirement spending indefinitely, calculated as your target annual retirement spending divided by 4%.",
      ],
      [
        "Loan Amount",
        "The total amount financed for the vehicle purchase, equal to the purchase price minus your down payment.",
      ],
      [
        "Monthly Payment",
        "The estimated monthly loan payment based on the loan amount, interest rate, and loan term.",
      ],
      [
        "Annual Loan Payments",
        "The total yearly cost of your vehicle loan payments, equal to your monthly payment multiplied by 12.",
      ],
      [
        "Annual Depreciation",
        "The estimated yearly loss in vehicle value, calculated as the difference between the purchase price and projected resale value, divided by the hold period.",
      ],
      [
        "Resale Value",
        "The projected value of the vehicle at the end of your planned hold period, based on the expected resale percentage you provided.",
      ],
      [
        "True Annual Cost",
        "The comprehensive yearly cost of vehicle ownership, including loan payments, maintenance, insurance, track budget, and depreciation.",
      ],
      [
        "Opportunity Cost of Purchase",
        "The future value of the purchase price if it had been invested instead, grown at your expected rate of return until retirement.",
      ],
      [
        "Opportunity Cost of Annual Expenses",
        "The future value of all annual vehicle costs if those funds had been invested each year until retirement.",
      ],
      [
        "Total Opportunity Cost",
        "The combined opportunity cost of both the initial purchase and ongoing annual expenses, representing the total wealth you forgo by owning this vehicle.",
      ],
      [
        "Portfolio Without Car",
        "Your projected investment portfolio at retirement if you did not purchase this vehicle and invested all savings at your expected return.",
      ],
      [
        "Portfolio With Car",
        "Your projected investment portfolio at retirement after accounting for all vehicle-related costs reducing your annual savings.",
      ],
      [
        "Car-to-Net-Worth",
        "The vehicle purchase price expressed as a percentage of your total net worth. Financial advisors generally recommend keeping this below 10%.",
      ],
      [
        "Car-to-Investable Assets",
        "The vehicle purchase price as a percentage of your liquid investable assets, showing how much of your investment capital the car represents.",
      ],
      [
        "Savings Rate",
        "Your annual savings as a percentage of your gross annual income. A rate of 25% or higher is generally considered excellent for long-term wealth building.",
      ],
      [
        "FI Delay",
        "The additional number of years it will take to reach financial independence as a result of owning this vehicle, compared to not owning it.",
      ],
    ];

    for (const [term, definition] of glossary) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(term, 20, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      const defLines = doc.splitTextToSize(definition, textWidth - 5);
      doc.text(defLines, 22, y);
      y += defLines.length * 3.5 + 3.5;
    }

    // --- Page 2 Footer ---
    const footerY = 287;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Generated by Performance Affordability Calculator",
      pageWidth / 2,
      footerY,
      { align: "center" }
    );

    doc.save("performance-affordability-report.pdf");
  }, [results, firstName, lastName, email]);

  return (
    <div className="space-y-8">
      {/* Download PDF button */}
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 text-sm font-medium text-[#0f487f] border border-[#0f487f] hover:bg-[#0f487f] hover:text-white px-5 py-2.5 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
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
          <Detail
            label="FI Number (4% Rule)"
            value={formatCurrency(results.fiNumber)}
          />
          <Detail
            label="Loan Amount"
            value={formatCurrency(results.loanAmount)}
          />
          <Detail
            label="Monthly Payment"
            value={formatCurrency(results.monthlyPayment)}
          />
          <Detail
            label="Annual Loan Payments"
            value={formatCurrency(results.annualLoanPayment)}
          />
          <Detail
            label="Annual Depreciation"
            value={formatCurrency(results.annualDepreciation)}
          />
          <Detail
            label="Resale Value"
            value={formatCurrency(results.resaleValue)}
          />
          <Detail
            label="Opportunity Cost of Purchase"
            value={formatCurrency(results.fvPurchase)}
          />
          <Detail
            label="Opportunity Cost of Annual Expenses"
            value={formatCurrency(results.fvAnnualCost)}
          />
          <Detail
            label="Total Opportunity Cost"
            value={formatCurrency(results.opportunityCost)}
            highlight
          />
          <Detail
            label="Portfolio Without Car"
            value={formatCurrency(results.fvNoCar)}
          />
          <Detail
            label="Portfolio With Car"
            value={formatCurrency(results.fvWithCar)}
          />
          <Detail
            label="Car-to-Investable Assets"
            value={`${results.carToInvestablePercent.toFixed(1)}%`}
          />
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
