"use client";

import FinancialForm from "@/components/FinancialForm";

export default function Home() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight mb-4 text-[#0f487f]">
          The APEX Report&trade;
        </h1>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-gray-900">
          Can You <span className="text-[#0f487f]">Really</span> Afford That Car?
        </h2>
        <p className="text-gray-500 text-lg">
          Enter your financial details and vehicle costs to see the true impact
          on your path to financial independence.
        </p>
      </div>
      <FinancialForm />
    </div>
  );
}
