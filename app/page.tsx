"use client";

import FinancialForm from "@/components/FinancialForm";

export default function Home() {
  return (
    <div>
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Can You <span className="text-red-500">Really</span> Afford That Car?
        </h2>
        <p className="text-neutral-400 text-lg">
          Enter your financial details and vehicle costs to see the true impact
          on your path to financial independence.
        </p>
      </div>
      <FinancialForm />
    </div>
  );
}
