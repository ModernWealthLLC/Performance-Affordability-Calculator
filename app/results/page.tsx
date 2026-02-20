"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { calculate } from "@/lib/calculations";
import type { PersonalInputs, VehicleInputs } from "@/lib/calculations";
import ResultsDashboard from "@/components/ResultsDashboard";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  function num(key: string, fallback: number = 0): number {
    const v = searchParams.get(key);
    if (v === null) return fallback;
    const n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  }

  const personal: PersonalInputs = {
    currentAge: num("currentAge", 30),
    targetRetirementAge: num("targetRetirementAge", 55),
    annualIncome: num("annualIncome", 150000),
    annualSavings: num("annualSavings", 40000),
    investableAssets: num("investableAssets", 200000),
    totalNetWorth: num("totalNetWorth", 350000),
    targetRetirementSpending: num("targetRetirementSpending", 80000),
    expectedReturn: num("expectedReturn", 7),
  };

  const vehicle: VehicleInputs = {
    purchasePrice: num("purchasePrice", 85000),
    downPayment: num("downPayment", 20000),
    interestRate: num("interestRate", 6.5),
    loanTermYears: num("loanTermYears", 5),
    annualMaintenance: num("annualMaintenance", 2000),
    annualInsurance: num("annualInsurance", 2400),
    annualTrackBudget: num("annualTrackBudget", 3000),
    holdPeriodYears: num("holdPeriodYears", 5),
    expectedResalePercent: num("expectedResalePercent", 55),
  };

  const results = calculate(personal, vehicle);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1 text-gray-900">
            Your <span className="text-[#0f487f]">Results</span>
          </h2>
          <p className="text-gray-500">
            Here&apos;s the true cost of your performance vehicle.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-[#0f487f] border border-[#cfcfcf] hover:border-[#0f487f] px-4 py-2 rounded-lg transition-colors"
        >
          Edit Inputs
        </button>
      </div>
      <ResultsDashboard results={results} />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#0f487f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
