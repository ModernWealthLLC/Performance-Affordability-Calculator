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
  vehicleMake: string;
  vehicleModel: string;
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
  if (score >= 80) return [34, 197, 94];
  if (score >= 65) return [59, 130, 246];
  if (score >= 50) return [245, 158, 11];
  return [239, 68, 68];
}

export default function ResultsDashboard({
  results,
  firstName,
  lastName,
  email,
  vehicleMake,
  vehicleModel,
}: ResultsDashboardProps) {
  const vehicleLabel = [vehicleMake, vehicleModel].filter(Boolean).join(" ");
  const handleDownloadPDF = useCallback(async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    // --- Logo (top-left, small) ---
    const logoData = await loadLogoAsBase64();
    const logoWidth = 30;
    const logoHeight = 9.5;
    const logoX = 10;
    const logoY = 5;
    if (logoData) {
      doc.addImage(logoData, "PNG", logoX, logoY, logoWidth, logoHeight);
      doc.link(logoX, logoY, logoWidth, logoHeight, { url: "https://www.modernwealthllc.com" });
    }
    y = logoY + logoHeight + 4;

    // --- Title ---
    doc.setFontSize(20);
    doc.setTextColor(15, 72, 127);
    doc.text("The APEX Report\u2122", pageWidth / 2, y, {
      align: "center",
    });
    y += 6;

    // --- Subtitle ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Are You Hitting the Financial Apex?", pageWidth / 2, y, {
      align: "center",
    });
    y += 3.5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Affordability \u2022 Positioning \u2022 Efficiency \u2022 eXecution", pageWidth / 2, y, {
      align: "center",
    });
    y += 6;

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
      y += 5;
    }

    // --- Vehicle Info ---
    if (vehicleLabel) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Vehicle: ${vehicleLabel}`, pageWidth / 2, y, { align: "center" });
      y += 5;
    }

    // --- Divider ---
    y += 1;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 6;

    // Helper: render a pillar section header
    const renderPillarHeader = (title: string) => {
      doc.setFontSize(10);
      doc.setTextColor(15, 72, 127);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, y);
      y += 5;
    };

    // Helper: render a metric row
    const renderMetricRow = (label: string, value: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(label, 25, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(value, pageWidth - 25, y, { align: "right" });
      y += 4.5;
    };

    // Derive Wealth Stage Indicator
    const carNWPct = results.carToNetWorthPercent;
    const carInvPct = results.carToInvestablePercent;
    let wealthStage: string;
    if (carNWPct <= 5 && carInvPct <= 10) wealthStage = "Established";
    else if (carNWPct <= 15 && carInvPct <= 25) wealthStage = "Building";
    else if (carNWPct <= 30 && carInvPct <= 50) wealthStage = "Early Stage";
    else wealthStage = "Pre-Foundation";

    // Derive Liquidity Stress Indicator
    const savRateVal = results.savingsRate;
    let liquidityStress: string;
    if (savRateVal >= 25) liquidityStress = "Low";
    else if (savRateVal >= 15) liquidityStress = "Moderate";
    else if (savRateVal >= 5) liquidityStress = "Elevated";
    else liquidityStress = "High";

    // === A — Affordability ===
    renderPillarHeader("A \u2014 Affordability");
    renderMetricRow("Car-to-Net-Worth", `${results.carToNetWorthPercent.toFixed(1)}%`);
    renderMetricRow("True Annual Cost", formatCurrency(results.trueAnnualCost));
    renderMetricRow("Savings Rate", `${results.savingsRate.toFixed(1)}%`);
    renderMetricRow("FI Delay", `${Math.round(results.fiDelayYears)} ${Math.round(results.fiDelayYears) === 1 ? "year" : "years"}`);
    y += 1;

    // === P — Positioning ===
    renderPillarHeader("P \u2014 Positioning");
    renderMetricRow("Car-to-Investable Assets", `${results.carToInvestablePercent.toFixed(1)}%`);
    renderMetricRow("Wealth Stage Indicator", wealthStage);
    renderMetricRow("Liquidity Stress Indicator", liquidityStress);
    y += 1;

    // === E — Efficiency ===
    renderPillarHeader("E \u2014 Efficiency");
    renderMetricRow("Annual Depreciation", formatCurrency(results.annualDepreciation));
    renderMetricRow("Opportunity Cost of Purchase", formatCurrency(results.fvPurchase));
    renderMetricRow("Opportunity Cost of Annual Expenses", formatCurrency(results.fvAnnualCost));
    renderMetricRow("Total Opportunity Cost", formatCurrency(results.opportunityCost));
    y += 1;

    // === X — Execution ===
    renderPillarHeader("X \u2014 Execution");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 55, 55);

    const apexScore = results.apexScore;
    let executionRecs: string[];
    if (apexScore < 50) {
      executionRecs = [
        "\u2022 Ownership restructuring may reduce financial load factor",
        "\u2022 A shorter hold period could limit compounding drag",
        "\u2022 Financing optimization may lower annual cost of carry",
        "\u2022 Alternative vehicle scenarios worth evaluating to improve trajectory alignment",
      ];
    } else if (apexScore <= 75) {
      executionRecs = [
        "\u2022 Continue monitoring current cost-to-income positioning",
        "\u2022 Targeted savings offsets may counterbalance vehicle expenses",
        "\u2022 Depreciation mitigation strategy worth considering (shorter hold, higher resale retention)",
      ];
    } else {
      executionRecs = [
        "\u2022 Purchase is well-aligned with current financial trajectory",
        "\u2022 Optional: explore prepayment acceleration to reduce total interest load",
        "\u2022 Optional: redirect depreciation savings toward tax-advantaged accounts",
      ];
    }

    for (const rec of executionRecs) {
      const recLines = doc.splitTextToSize(rec, pageWidth - 50);
      doc.text(recLines, 25, y);
      y += recLines.length * 3.5 + 1;
    }
    y += 1;

    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.3);
    doc.line(20, y, pageWidth - 20, y);
    y += 6;

    // === TWO-COLUMN: APEX Score Gauge (left) + Corner Exit Projection (right) ===
    const colStartY = y;
    const leftColX = 20;
    const rightColX = pageWidth / 2 + 5;

    // --- LEFT: APEX Score Gauge ---
    doc.setFontSize(11);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("APEX Score\u2122", leftColX, y);

    const gaugeCx = leftColX + 38;
    const gaugeCy = y + 20;
    const gaugeRadius = 16;
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
    const scoreColor = getScoreColor(results.apexScore);
    const scoreRatio = Math.min(results.apexScore / 100, 1);
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
    doc.text(String(results.apexScore), gaugeCx, gaugeCy + 2, {
      align: "center",
    });

    // "Apex Status: [Tier Name]" below gauge
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(
      `Apex Status: ${results.apexCategory}`,
      gaugeCx,
      gaugeCy + gaugeRadius + 10,
      { align: "center" }
    );

    // --- RIGHT: Corner Exit Projection ---
    doc.setFontSize(11);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Corner Exit Projection\u2122", rightColX, colStartY);

    const chartY = colStartY + 8;
    const barMaxWidth = 55;
    const barHeight = 8;
    const maxPortfolio = Math.max(results.fvNoCar, results.fvWithCar);

    // "Clean Exit Velocity" bar
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Clean Exit Velocity", rightColX, chartY);
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

    // "Reduced Exit Velocity" bar
    const bar2Y = chartY + barHeight + 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Reduced Exit Velocity", rightColX, bar2Y);
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
    const diffY = bar2Y + barHeight + 6;
    const diff = results.fvNoCar - results.fvWithCar;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 72, 127);
    doc.text(`Difference: ${formatCurrency(diff)}`, rightColX, diffY);

    // Move y past the two-column section
    y = Math.max(gaugeCy + gaugeRadius + 12, diffY + 4);
    y += 2;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.3);
    doc.line(20, y, pageWidth - 20, y);
    y += 6;

    // === DETAILED BREAKDOWN ===
    doc.setFontSize(12);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Breakdown", 20, y);
    y += 6;

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
      ["Clean Exit Velocity (No Car)", formatCurrency(results.fvNoCar)],
      ["Reduced Exit Velocity (With Car)", formatCurrency(results.fvWithCar)],
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
      y += 5.5;
    }

    // --- Footer ---
    y += 2;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 4;

    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Modern Wealth | APEX Financial Performance Engine\u2122",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    // =============================================
    // PAGE 2: Understanding Your Results
    // =============================================
    doc.addPage();
    if (logoData) {
      doc.addImage(logoData, "PNG", logoX, logoY, logoWidth, logoHeight);
      doc.link(logoX, logoY, logoWidth, logoHeight, { url: "https://www.modernwealthllc.com" });
    }
    y = logoY + logoHeight + 4;
    const textWidth = pageWidth - 40;

    // --- Page 2 Title ---
    doc.setFontSize(18);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Understanding Your Results", pageWidth / 2, y, {
      align: "center",
    });
    y += 6;

    // Schedule an Exploration Call button
    const callBtnText = "Schedule an Exploration Call";
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const callBtnWidth = doc.getTextWidth(callBtnText) + 16;
    const callBtnHeight = 9;
    const callBtnX = pageWidth / 2 - callBtnWidth / 2;
    doc.setFillColor(15, 72, 127);
    doc.roundedRect(callBtnX, y - 1, callBtnWidth, callBtnHeight, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(callBtnText, pageWidth / 2, y + 5, { align: "center" });
    doc.link(callBtnX, y - 1, callBtnWidth, callBtnHeight, {
      url: "https://calendly.com/modernwealthllc/intro-call",
    });
    doc.setTextColor(15, 72, 127);
    y += callBtnHeight + 4;

    // Accent line under title
    doc.setDrawColor(15, 72, 127);
    doc.setLineWidth(0.6);
    const accentW = 50;
    doc.line(
      pageWidth / 2 - accentW / 2,
      y,
      pageWidth / 2 + accentW / 2,
      y
    );
    y += 12;

    // --- Personalized score-based paragraphs ---
    const displayName = firstName || "there";
    const scorePct = results.apexScore;
    const category = results.apexCategory;
    const carNW = results.carToNetWorthPercent.toFixed(1);
    const savRate = results.savingsRate.toFixed(1);
    const tac = formatCurrency(results.trueAnnualCost);
    const fvNo = formatCurrency(results.fvNoCar);
    const fvWith = formatCurrency(results.fvWithCar);
    const fvDiff = formatCurrency(results.fvNoCar - results.fvWithCar);
    const fiDelayRounded = Math.round(results.fiDelayYears);
    const fiDelay = `${fiDelayRounded} ${fiDelayRounded === 1 ? "year" : "years"}`;

    const renderSection = (title: string, body: string) => {
      doc.setFontSize(12);
      doc.setTextColor(15, 72, 127);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, y);
      y += 7;

      doc.setFontSize(10.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 55, 55);
      const lines = doc.splitTextToSize(body, textWidth);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 8;
    };

    let p1: string, p2: string, p3: string, p4: string;

    if (scorePct >= 80) {
      p1 =
        `${displayName}, your APEX Score of ${scorePct} out of 100 places you in the ${category} tier. ` +
        `This is the highest classification in the APEX framework and signals that your vehicle purchase is running a clean line through your financial trajectory. ` +
        `You have found the ideal balance between driving performance and financial performance. ` +
        `Very few enthusiasts achieve this alignment, and it reflects precise planning and a well-built financial foundation.`;

      p2 =
        `Your car-to-net-worth ratio of ${carNW}% is well within the 10% benchmark, meaning this vehicle represents a proportional allocation of your total wealth. ` +
        `Your current savings rate of ${savRate}% confirms that your financial momentum remains strong. ` +
        `The true annual cost of ownership is estimated at ${tac} when including depreciation, insurance, maintenance, and loan payments. This figure is well within the carrying capacity of your financial profile and does not introduce meaningful drag on your wealth trajectory.`;

      p3 =
        `Every vehicle carries an opportunity cost. If the total cost of this car were deployed into investments instead, your corner exit projection would be ${fvNo} rather than ${fvWith}, a delta of ${fvDiff}. ` +
        `However, your financial independence timeline shifts by only approximately ${fiDelay}, a minimal adjustment that confirms this purchase is well within your performance envelope. ` +
        `The exit velocity remains strong, and the trajectory holds its line.`;

      p4 =
        `Continue holding your current line, ${displayName}. Your financial positioning is strong, and this purchase does not alter your long-term trajectory in any material way. ` +
        `Focus on maintaining your savings rate, managing ongoing vehicle costs such as maintenance and insurance, and reviewing your financial plan annually to keep everything dialed in. ` +
        `You have earned the right to enjoy this vehicle knowing your financial exit velocity remains on target.`;
    } else if (scorePct >= 65) {
      p1 =
        `${displayName}, your APEX Score of ${scorePct} out of 100 places you in the ${category} tier. ` +
        `This is a solid result, indicating that your performance vehicle purchase is generally well-proportioned relative to your financial profile. ` +
        `The vehicle represents a meaningful financial commitment, but your savings habits and net worth provide a reasonable buffer. ` +
        `You are carrying speed through the corner, though minor line adjustments would improve your overall exit velocity.`;

      p2 =
        `Your car-to-net-worth ratio sits at ${carNW}%, which means the vehicle occupies a noticeable but manageable portion of your overall wealth. ` +
        `Your savings rate of ${savRate}% shows forward momentum toward long-term growth, though increasing this figure would strengthen your financial positioning further. ` +
        `The true annual cost of ownership comes to ${tac} when factoring in depreciation, insurance, maintenance, and financing. ` +
        `This introduces moderate financial load factor that warrants ongoing attention in your annual budget to ensure it does not increase over time.`;

      p3 =
        `The opportunity cost is worth understanding clearly. If the funds tied up in this purchase and its annual costs were invested instead, your corner exit projection would reach ${fvNo} compared to the projected ${fvWith} with the vehicle, a gap of ${fvDiff}. ` +
        `This translates to a financial independence delay of roughly ${fiDelay}. While this is a manageable delta, it is significant enough to warrant monitoring your total vehicle costs annually and ensuring they remain within comfortable parameters as your financial positioning evolves.`;

      p4 =
        `Based on these results, maintaining your current trajectory while looking for optimization opportunities makes sense, ${displayName}. ` +
        `Consider setting a strict annual vehicle cost budget that includes maintenance, insurance, and any track or modification expenses. ` +
        `If possible, look for ways to increase your savings rate by even a few percentage points. Small improvements compound significantly over time. ` +
        `Your positioning is solid overall, and targeted adjustments will help ensure this vehicle remains a source of performance rather than compounding drag.`;
    } else if (scorePct >= 50) {
      p1 =
        `${displayName}, your APEX Score of ${scorePct} out of 100 places you in the ${category} tier. ` +
        `This result indicates that you are entering the corner aggressively relative to your current financial position. ` +
        `The vehicle represents a significant commitment that increases your financial load factor and could alter your long-term positioning if left unmanaged. ` +
        `This is a common situation among performance enthusiasts, and the key is to understand the forces at play and adjust your line accordingly.`;

      p2 =
        `Your car-to-net-worth ratio of ${carNW}% indicates that a substantial share of your wealth is allocated to this single depreciating asset. ` +
        `Your savings rate of ${savRate}% is being compressed by the costs of ownership, and the true annual cost of ${tac} (including depreciation, insurance, maintenance, and loan payments) raises your financial center of gravity by consuming a meaningful portion of your annual income. ` +
        `These metrics indicate the vehicle is competing directly with your ability to build long-term investment momentum.`;

      p3 =
        `The opportunity cost reveals the long-term trade-off. Without this vehicle, your corner exit projection would be ${fvNo}, compared to ${fvWith} with it, a difference of ${fvDiff} in future wealth. ` +
        `Your financial independence is delayed by approximately ${fiDelay} as a direct result. This introduces compounding drag that grows larger with time. ` +
        `Each year of delay reduces exit velocity and extends the mandatory work period before you can transition on your own terms.`;

      p4 =
        `It is worth evaluating the full cost picture, ${displayName}. Consider whether a different vehicle, a shorter hold period, or a larger down payment could improve your APEX Score and strengthen your financial positioning. ` +
        `If this specific vehicle is important to you, focus on increasing your income or reducing other discretionary expenses to boost your savings rate. ` +
        `Even modest adjustments, like redirecting a few hundred dollars per month, can meaningfully reduce the opportunity cost and bring your financial independence timeline closer to the original target.`;
    } else {
      p1 =
        `${displayName}, your APEX Score of ${scorePct} out of 100 places you in the ${category} tier. ` +
        `This indicates that you are carrying significantly more speed into this financial corner than your current positioning supports. ` +
        `The enthusiasm behind this purchase is understood, but the data shows that it introduces substantial load on your financial trajectory and alters your long-term positioning in ways that deserve careful review. ` +
        `This is an important moment to evaluate the numbers and consider adjustments before committing fully.`;

      p2 =
        `The financial metrics paint a clear picture. Your car-to-net-worth ratio of ${carNW}% is well above the 10% benchmark, meaning a significant portion of your wealth is concentrated in a depreciating asset. ` +
        `Your savings rate has been reduced to ${savRate}%, which limits your ability to build the investment portfolio needed for financial independence. ` +
        `The true annual cost of ${tac} (including depreciation, insurance, maintenance, and loan payments) raises your financial center of gravity considerably and introduces compounding drag on funds that could otherwise be directed toward wealth-building.`;

      p3 =
        `The long-term trajectory shift is significant. Without this vehicle, your corner exit projection would be ${fvNo}, but with the vehicle it drops to ${fvWith}, a reduction of ${fvDiff} in lifetime wealth. ` +
        `Your path to financial independence is delayed by approximately ${fiDelay}. This extends your mandatory work timeline, reduces exit velocity, and narrows the margin available for unexpected life events. ` +
        `The compounding effect of these deferred investment years is difficult to recover once the window has passed.`;

      p4 =
        `The data suggests it may be worth reconsidering the approach, ${displayName}. Evaluate alternative vehicles that still deliver an engaging driving experience but at a lower total cost of ownership. ` +
        `If you are already committed to this vehicle, explore ways to offset the financial load by increasing your income, reducing other expenses significantly, or shortening the ownership period to limit depreciation exposure. ` +
        `The goal is not to park your passion for performance, but to ensure the line you are running does not carry you off the financial track entirely. Strategic repositioning now protects your long-term exit velocity.`;
    }

    renderSection("Your APEX Score\u2122", p1);
    renderSection("Your Financial Snapshot", p2);
    renderSection("The Long-Term Impact", p3);
    renderSection("Considerations", p4);

    renderSection(
      "Disclaimer",
      "Modern Wealth does not offer tax, legal, or accounting advice. The information provided here is purely for your understanding and should not be used as a basis for these topics. " +
        "This APEX Report does not constitute any financial, tax, or legal advice. The APEX Report is for information purposes only. " +
        "Consult with your tax, legal, and accounting advisors before acting on any advice or initiating any transaction."
    );

    // --- Page 2 Footer ---
    const footer2Y = 287;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, footer2Y - 5, pageWidth - 20, footer2Y - 5);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Modern Wealth | APEX Financial Performance Engine\u2122",
      pageWidth / 2,
      footer2Y,
      { align: "center" }
    );

    // =============================================
    // PAGE 3: Glossary of Terms
    // =============================================
    doc.addPage();
    if (logoData) {
      doc.addImage(logoData, "PNG", logoX, logoY, logoWidth, logoHeight);
      doc.link(logoX, logoY, logoWidth, logoHeight, { url: "https://www.modernwealthllc.com" });
    }
    y = logoY + logoHeight + 4;

    // --- Page 3 Title ---
    doc.setFontSize(16);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Glossary of Terms", pageWidth / 2, y, { align: "center" });
    y += 6;

    // Accent line under title
    doc.setDrawColor(15, 72, 127);
    doc.setLineWidth(0.6);
    doc.line(
      pageWidth / 2 - accentW / 2,
      y,
      pageWidth / 2 + accentW / 2,
      y
    );
    y += 4;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text(
      "Key terms and definitions used throughout this report.",
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 10;

    const glossary: [string, string][] = [
      [
        "APEX Score\u2122",
        "A composite performance metric evaluating how effectively a vehicle purchase aligns with your financial trajectory across Affordability, Positioning, Efficiency, and Execution.",
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
        "The combined opportunity cost of both the initial purchase and ongoing annual expenses, representing the total wealth delta from owning this vehicle.",
      ],
      [
        "Clean Exit Velocity",
        "Your projected investment portfolio at retirement if you did not purchase this vehicle and invested all savings at your expected return.",
      ],
      [
        "Reduced Exit Velocity",
        "Your projected investment portfolio at retirement after accounting for all vehicle-related costs reducing your annual savings.",
      ],
      [
        "Car-to-Net-Worth",
        "The vehicle purchase price expressed as a percentage of your total net worth. A common benchmark is to keep this below 10%.",
      ],
      [
        "Car-to-Investable Assets",
        "The vehicle purchase price as a percentage of your liquid investable assets, indicating how much of your investment capital the car represents.",
      ],
      [
        "Savings Rate",
        "Your annual savings as a percentage of your gross annual income. A rate of 25% or higher is generally considered strong for long-term wealth building.",
      ],
      [
        "FI Delay",
        "The additional number of years it will take to reach financial independence as a result of owning this vehicle, compared to not owning it.",
      ],
      [
        "Wealth Stage Indicator",
        "A classification derived from your Car-to-Net-Worth and Car-to-Investable Assets ratios. Stages range from Established (lowest ratios, strongest positioning) to Pre-Foundation (highest ratios, weakest positioning).",
      ],
      [
        "Liquidity Stress Indicator",
        "A measure of how vehicle ownership impacts your savings capacity, derived from your Savings Rate. Ranges from Low (25%+ savings rate) to High (below 5%), reflecting the pressure the purchase places on your cash flow.",
      ],
      [
        "Corner Exit Projection\u2122",
        "A side-by-side comparison of your projected investment portfolio at retirement with and without this vehicle purchase, illustrating the long-term wealth impact of the decision.",
      ],
      [
        "Apex Status",
        "The performance tier assigned based on your APEX Score. Tiers indicate how well the vehicle purchase aligns with your overall financial trajectory.",
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
      y += defLines.length * 3.5 + 3;
    }

    // --- Page 3 Footer ---
    const footer3Y = 287;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, footer3Y - 5, pageWidth - 20, footer3Y - 5);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Modern Wealth | APEX Financial Performance Engine\u2122",
      pageWidth / 2,
      footer3Y,
      { align: "center" }
    );

    doc.save("apex-report.pdf");
  }, [results, firstName, lastName, email, vehicleLabel]);

  // Derive Wealth Stage and Liquidity Stress for UI display
  const carNWPct = results.carToNetWorthPercent;
  const carInvPct = results.carToInvestablePercent;
  let wealthStage: string;
  if (carNWPct <= 5 && carInvPct <= 10) wealthStage = "Established";
  else if (carNWPct <= 15 && carInvPct <= 25) wealthStage = "Building";
  else if (carNWPct <= 30 && carInvPct <= 50) wealthStage = "Early Stage";
  else wealthStage = "Pre-Foundation";

  const savRateVal = results.savingsRate;
  let liquidityStress: string;
  if (savRateVal >= 25) liquidityStress = "Low";
  else if (savRateVal >= 15) liquidityStress = "Moderate";
  else if (savRateVal >= 5) liquidityStress = "Elevated";
  else liquidityStress = "High";

  const apexScore = results.apexScore;
  let executionRecs: string[];
  if (apexScore < 50) {
    executionRecs = [
      "Ownership restructuring may reduce financial load factor",
      "A shorter hold period could limit compounding drag",
      "Financing optimization may lower annual cost of carry",
      "Alternative vehicle scenarios worth evaluating to improve trajectory alignment",
    ];
  } else if (apexScore <= 75) {
    executionRecs = [
      "Continue monitoring current cost-to-income positioning",
      "Targeted savings offsets may counterbalance vehicle expenses",
      "Depreciation mitigation strategy worth considering (shorter hold, higher resale retention)",
    ];
  } else {
    executionRecs = [
      "Purchase is well-aligned with current financial trajectory",
      "Optional: explore prepayment acceleration to reduce total interest load",
      "Optional: redirect depreciation savings toward tax-advantaged accounts",
    ];
  }

  return (
    <div className="space-y-8">
      {/* Download PDF + Schedule Call buttons */}
      <div className="flex justify-end gap-3">
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
          Download APEX Report
        </button>
        <a
          href="https://calendly.com/modernwealthllc/intro-call"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-white bg-[#0f487f] hover:bg-[#0a3560] px-5 py-2.5 rounded-lg transition-colors"
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Schedule an Exploration Call
        </a>
      </div>

      {/* Vehicle label */}
      {vehicleLabel && (
        <div className="glass-panel p-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#0f487f]" />
          <span className="text-lg font-semibold text-gray-900">{vehicleLabel}</span>
        </div>
      )}

      {/* A — Affordability */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f487f] mb-3">
          A &mdash; Affordability
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Car-to-Net-Worth"
            value={`${results.carToNetWorthPercent.toFixed(1)}%`}
            sub={
              results.carToNetWorthPercent <= 10
                ? "Within target range"
                : "Above target range"
            }
          />
          <StatCard
            label="True Annual Cost"
            value={formatCurrency(results.trueAnnualCost)}
            sub="Including depreciation & financing"
            accent
          />
          <StatCard
            label="Savings Rate"
            value={`${results.savingsRate.toFixed(1)}%`}
            sub={
              results.savingsRate >= 25
                ? "Strong savings rate"
                : "Consider increasing savings"
            }
          />
          <StatCard
            label="FI Delay"
            value={`${Math.round(results.fiDelayYears)} ${Math.round(results.fiDelayYears) === 1 ? "year" : "years"}`}
            sub={`${results.yearsToFiNoCar}yr \u2192 ${results.yearsToFiWithCar}yr to FI`}
          />
        </div>
      </div>

      {/* P — Positioning */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f487f] mb-3">
          P &mdash; Positioning
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Car-to-Investable Assets"
            value={`${results.carToInvestablePercent.toFixed(1)}%`}
            sub="Purchase vs. liquid investments"
          />
          <StatCard
            label="Wealth Stage Indicator"
            value={wealthStage}
            sub="Derived from asset ratios"
          />
          <StatCard
            label="Liquidity Stress Indicator"
            value={liquidityStress}
            sub="Impact on savings capacity"
          />
        </div>
      </div>

      {/* E — Efficiency */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f487f] mb-3">
          E &mdash; Efficiency
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Annual Depreciation"
            value={formatCurrency(results.annualDepreciation)}
            sub="Yearly value reduction"
          />
          <StatCard
            label="Opp. Cost of Purchase"
            value={formatCurrency(results.fvPurchase)}
            sub="If invested instead"
            accent
          />
          <StatCard
            label="Opp. Cost of Annual Expenses"
            value={formatCurrency(results.fvAnnualCost)}
            sub="Annual costs compounded"
            accent
          />
          <StatCard
            label="Total Opportunity Cost"
            value={formatCurrency(results.opportunityCost)}
            sub="Combined wealth delta"
            accent
          />
        </div>
      </div>

      {/* X — Execution */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f487f] mb-3">
          X &mdash; Execution
        </h3>
        <div className="glass-panel card-hover p-6">
          <ul className="space-y-2">
            {executionRecs.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0f487f] mt-1.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Score + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel card-hover p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2 text-gray-600">
            APEX Score&trade;
          </h3>
          <ScoreGauge
            score={results.apexScore}
            category={results.apexCategory}
          />
          <div className="mt-2 text-sm font-medium text-gray-500">
            Apex Status: <span className="font-bold text-gray-700">{results.apexCategory}</span>
          </div>
        </div>

        <div className="glass-panel card-hover p-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-600">
            Corner Exit Projection&trade;
          </h3>
          <ComparisonChart
            fvNoCar={results.fvNoCar}
            fvWithCar={results.fvWithCar}
          />
        </div>
      </div>

      {/* Detail breakdown */}
      <div className="glass-panel card-hover p-6">
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
            label="Clean Exit Velocity"
            value={formatCurrency(results.fvNoCar)}
          />
          <Detail
            label="Reduced Exit Velocity"
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
