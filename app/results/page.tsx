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
    currentAge: num("currentAge", 40),
    targetRetirementAge: num("targetRetirementAge", 67),
    annualIncome: num("annualIncome", 500000),
    annualSavings: num("annualSavings", 100000),
    investableAssets: num("investableAssets", 1000000),
    totalNetWorth: num("totalNetWorth", 2500000),
    targetRetirementSpending: num("targetRetirementSpending", 180000),
    expectedReturn: num("expectedReturn", 7),
  };

  const vehicle: VehicleInputs = {
    purchasePrice: num("purchasePrice", 40000),
    downPayment: num("downPayment", 8000),
    interestRate: num("interestRate", 5.5),
    loanTermYears: num("loanTermYears", 5),
    annualMaintenance: num("annualMaintenance", 1000),
    annualInsurance: num("annualInsurance", 1500),
    annualTrackBudget: num("annualTrackBudget", 5000),
    holdPeriodYears: num("holdPeriodYears", 3),
    expectedResalePercent: num("expectedResalePercent", 60),
  };

  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const email = searchParams.get("email") || "";
  const vehicleMake = searchParams.get("vehicleMake") || "";
  const vehicleModel = searchParams.get("vehicleModel") || "";

  const results = calculate(personal, vehicle);

  const vehicleLabel = [vehicleMake, vehicleModel].filter(Boolean).join(" ");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-4 text-[#0f487f]">
            The APEX Report&trade;
          </h1>
          <h2 className="text-3xl font-bold tracking-tight mb-1 text-gray-900">
            {firstName ? (
              <>{firstName}, here are your <span className="text-[#0f487f]">Results</span></>
            ) : (
              <>Your <span className="text-[#0f487f]">Results</span></>
            )}
          </h2>
          <p className="text-gray-500">
            {vehicleLabel
              ? `Here\u2019s the true cost of your ${vehicleLabel}.`
              : "Here\u2019s the true cost of your performance vehicle."}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-[#0f487f] border border-[#cfcfcf] hover:border-[#0f487f] px-4 py-2 rounded-lg transition-colors"
        >
          Edit Inputs
        </button>
      </div>
      <ResultsDashboard
        results={results}
        firstName={firstName}
        lastName={lastName}
        email={email}
        vehicleMake={vehicleMake}
        vehicleModel={vehicleModel}
      />
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
