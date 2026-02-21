"use client";

import FinancialForm from "@/components/FinancialForm";

export default function Home() {
  return (
    <div>
      <div className="mb-12 text-center">
        <h2
          className="text-3xl md:text-4xl font-bold tracking-wide text-gray-900 mb-4"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Can You Really Afford That Car?
        </h2>
        <p
          className="text-base md:text-lg italic text-[#0f487f]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Enter your financial details and vehicle costs to see the true impact
          on your path to financial independence.
        </p>
      </div>
      <FinancialForm />
    </div>
  );
}
