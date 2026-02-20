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
  vehicleMake,
  vehicleModel,
}: ResultsDashboardProps) {
  const vehicleLabel = [vehicleMake, vehicleModel].filter(Boolean).join(" ");
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

    // --- Vehicle Info ---
    if (vehicleLabel) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Vehicle: ${vehicleLabel}`, pageWidth / 2, y, { align: "center" });
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
        `${results.disciplineScore} / 100 (${results.disciplineCategory})`,
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
    // PAGE 2: Understanding Your Results
    // =============================================
    doc.addPage();
    y = 20;
    const textWidth = pageWidth - 40;

    // --- Page 2 Title ---
    doc.setFontSize(18);
    doc.setTextColor(15, 72, 127);
    doc.setFont("helvetica", "bold");
    doc.text("Understanding Your Results", pageWidth / 2, y, {
      align: "center",
    });
    y += 6;

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
    const scorePct = results.disciplineScore;
    const category = results.disciplineCategory;
    const carNW = results.carToNetWorthPercent.toFixed(1);
    const savRate = results.savingsRate.toFixed(1);
    const tac = formatCurrency(results.trueAnnualCost);
    const fvNo = formatCurrency(results.fvNoCar);
    const fvWith = formatCurrency(results.fvWithCar);
    const fvDiff = formatCurrency(results.fvNoCar - results.fvWithCar);
    const fiDelay = results.fiDelayYears.toFixed(1);

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

    if (scorePct >= 85) {
      p1 =
        `${displayName}, your Discipline Score of ${scorePct} out of 100 places you in the ${category} category, the highest tier in our framework. ` +
        `This exceptional result indicates that your performance vehicle purchase is very well aligned with your overall financial position. ` +
        `You have demonstrated a rare balance between pursuing your automotive passion and maintaining strong financial discipline. ` +
        `Very few enthusiasts achieve a score at this level, and it reflects both thoughtful planning and a solid foundation of wealth-building habits.`;

      p2 =
        `Your car-to-net-worth ratio of ${carNW}% is well within the 10% threshold commonly referenced in financial planning, meaning this vehicle represents a modest fraction of your total wealth. ` +
        `Your current savings rate of ${savRate}% demonstrates that you are consistently setting aside a meaningful portion of your income for long-term growth. ` +
        `The true annual cost of ownership is estimated at ${tac} when including depreciation, insurance, maintenance, and loan payments. This figure is comfortably absorbed by your financial profile without compromising your ability to invest and build wealth over time.`;

      p3 =
        `Every major purchase carries an opportunity cost, and your vehicle is no exception. If the total cost of this car were invested instead, your portfolio at retirement could be ${fvNo} rather than ${fvWith}, a difference of ${fvDiff}. ` +
        `However, your financial independence timeline is only delayed by approximately ${fiDelay} years, which is a modest trade-off for the enjoyment and utility this vehicle provides. ` +
        `This minimal delay confirms that the purchase fits comfortably within your broader wealth-building plan.`;

      p4 =
        `Continue doing exactly what you are doing, ${displayName}. Your financial habits are strong, and this purchase does not materially threaten your path to financial independence. ` +
        `Focus on maintaining your savings rate, staying disciplined with ongoing vehicle costs such as maintenance and insurance, and reviewing your overall financial plan annually. ` +
        `You have earned the right to enjoy this vehicle with confidence, knowing that your long-term financial future remains on a solid trajectory.`;
    } else if (scorePct >= 70) {
      p1 =
        `${displayName}, your Discipline Score of ${scorePct} out of 100 places you in the ${category} category. ` +
        `This is a solid result that indicates your performance vehicle purchase is generally well-proportioned relative to your financial profile. ` +
        `While the vehicle does represent a meaningful financial commitment, your overall savings habits and net worth provide a reasonable buffer. ` +
        `You are balancing your enthusiasm for performance vehicles with responsible financial planning, though there is room to strengthen that balance further.`;

      p2 =
        `Your car-to-net-worth ratio sits at ${carNW}%, which means the vehicle represents a noticeable but not outsized portion of your overall wealth. ` +
        `Your savings rate of ${savRate}% shows that you are directing income toward long-term growth, though increasing this figure would further strengthen your financial position. ` +
        `The true annual cost of ownership comes to ${tac} when you factor in depreciation, insurance, maintenance, and financing costs. ` +
        `This is a real expense that deserves ongoing attention in your annual budget to make sure it does not creep higher over time.`;

      p3 =
        `The opportunity cost of this vehicle is worth understanding clearly. If the funds tied up in this purchase and its annual costs were invested instead, your retirement portfolio could reach ${fvNo} compared to the projected ${fvWith} with the vehicle, a gap of ${fvDiff}. ` +
        `This translates to a financial independence delay of roughly ${fiDelay} years. While this is a manageable trade-off, it is significant enough to warrant monitoring your total vehicle costs each year and ensuring they remain within comfortable bounds as your financial situation evolves.`;

      p4 =
        `Based on these results, it may be worth maintaining your current trajectory while looking for opportunities to optimize, ${displayName}. ` +
        `Consider setting a strict annual vehicle cost budget that includes maintenance, insurance, and any track or modification expenses. ` +
        `If possible, look for ways to increase your savings rate by even a few percentage points. Small improvements compound significantly over time. ` +
        `You are in a good position overall, and a bit of extra financial discipline will help ensure this vehicle remains a source of enjoyment rather than financial stress.`;
    } else if (scorePct >= 50) {
      p1 =
        `${displayName}, your Discipline Score of ${scorePct} out of 100 places you in the ${category} category. ` +
        `This result signals that your performance vehicle purchase represents a significant financial commitment relative to your current means. ` +
        `While your enthusiasm for this vehicle is understandable, the numbers indicate that the purchase is stretching your financial resources in ways that could meaningfully impact your long-term wealth-building goals. ` +
        `This is not an uncommon situation among car enthusiasts, but it does require careful attention and potentially some adjustments to your plan.`;

      p2 =
        `Your car-to-net-worth ratio of ${carNW}% indicates that a substantial share of your wealth is concentrated in this single depreciating asset. ` +
        `Your savings rate of ${savRate}% is being compressed by the costs of ownership, and the true annual cost of ${tac} (which accounts for depreciation, insurance, maintenance, and loan payments) is consuming a meaningful portion of your annual income. ` +
        `These metrics suggest that the vehicle is competing directly with your ability to build long-term financial security through consistent investment contributions.`;

      p3 =
        `The opportunity cost paints a clear picture of the long-term trade-off. Without this vehicle, your projected retirement portfolio would be ${fvNo}, compared to ${fvWith} with it, a difference of ${fvDiff} in future wealth. ` +
        `Your financial independence is delayed by approximately ${fiDelay} years as a direct result. This is a significant gap that grows larger with time due to the compounding nature of investment returns. ` +
        `Every year of delay represents both lost portfolio growth and additional years of mandatory work before you can retire on your own terms.`;

      p4 =
        `It may be worth taking a hard look at the total cost picture, ${displayName}. Consider whether a less expensive vehicle, a shorter hold period, or a larger down payment could bring your Discipline Score into a healthier range. ` +
        `If this specific vehicle is important to you, focus on aggressively increasing your income or cutting other discretionary expenses to boost your savings rate. ` +
        `Even modest improvements, like saving an extra few hundred dollars per month, can meaningfully reduce the opportunity cost and bring your financial independence timeline closer to your original goal.`;
    } else {
      p1 =
        `${displayName}, your Discipline Score of ${scorePct} out of 100 places you in the ${category} category. ` +
        `This is the most cautionary tier in our scoring framework, and it indicates that your performance vehicle purchase may be significantly overextending your current financial position. ` +
        `We understand the emotional pull of a dream car, but the numbers suggest that this purchase, at this time, poses a real risk to your long-term financial health. ` +
        `It is important to review these findings carefully and consider whether adjustments are needed before committing to this vehicle.`;

      p2 =
        `The financial metrics raise several concerns. Your car-to-net-worth ratio of ${carNW}% is well above the 10% threshold commonly referenced in financial planning, meaning a disproportionate share of your wealth is tied up in a rapidly depreciating asset. ` +
        `Your savings rate has been reduced to ${savRate}%, which limits your ability to build the investment portfolio needed for financial independence. ` +
        `The true annual cost of ${tac} (including depreciation, insurance, maintenance, and loan payments) is consuming a large portion of your annual income and crowding out funds that could be directed toward savings and investments.`;

      p3 =
        `The long-term financial impact is substantial. Without this vehicle, your projected retirement portfolio would be ${fvNo}, but with the vehicle it drops to ${fvWith}, a reduction of ${fvDiff} in lifetime wealth. ` +
        `Your path to financial independence is delayed by approximately ${fiDelay} years. This means additional years of mandatory work, reduced financial flexibility, and a significantly smaller safety net for unexpected life events. ` +
        `The compounding effect of these lost investment years cannot easily be recovered once the time has passed.`;

      p4 =
        `The data suggests it may be prudent to reassess this purchase, ${displayName}. Consider more affordable alternatives that still deliver an engaging driving experience but at a fraction of the total cost. ` +
        `If you are already committed to this vehicle, explore ways to offset the financial impact by increasing your income, dramatically reducing other expenses, or shortening your ownership period to minimize depreciation losses. ` +
        `The goal is not to abandon your passion for performance vehicles, but to ensure that your pursuit of that passion does not come at the expense of your financial freedom and long-term security.`;
    }

    renderSection("Your Discipline Score", p1);
    renderSection("Your Financial Snapshot", p2);
    renderSection("The Long-Term Impact", p3);
    renderSection("Considerations", p4);

    // --- Page 2 Footer ---
    const footer2Y = 287;
    doc.setDrawColor(207, 207, 207);
    doc.setLineWidth(0.5);
    doc.line(20, footer2Y - 5, pageWidth - 20, footer2Y - 5);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Generated by Performance Affordability Calculator",
      pageWidth / 2,
      footer2Y,
      { align: "center" }
    );

    // =============================================
    // PAGE 3: Glossary of Terms
    // =============================================
    doc.addPage();
    y = 20;

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
        "The vehicle purchase price expressed as a percentage of your total net worth. A common financial planning benchmark is to keep this below 10%.",
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
      "Generated by Performance Affordability Calculator",
      pageWidth / 2,
      footer3Y,
      { align: "center" }
    );

    doc.save("performance-affordability-report.pdf");
  }, [results, firstName, lastName, email, vehicleLabel]);

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

      {/* Vehicle label */}
      {vehicleLabel && (
        <div className="glass-panel p-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#0f487f]" />
          <span className="text-lg font-semibold text-gray-900">{vehicleLabel}</span>
        </div>
      )}

      {/* Top metric cards */}
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
        <div className="glass-panel card-hover p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-3 text-gray-600">
            Discipline Score
          </h3>
          <ScoreGauge
            score={results.disciplineScore}
            category={results.disciplineCategory}
          />
        </div>

        <div className="glass-panel card-hover p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-600">
            Portfolio at Retirement
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
