"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  currentAge: string;
  targetRetirementAge: string;
  annualIncome: string;
  annualSavings: string;
  investableAssets: string;
  totalNetWorth: string;
  targetRetirementSpending: string;
  expectedReturn: string;
  purchasePrice: string;
  downPayment: string;
  interestRate: string;
  loanTermYears: string;
  annualMaintenance: string;
  annualInsurance: string;
  annualTrackBudget: string;
  holdPeriodYears: string;
  expectedResalePercent: string;
}

const defaultState: FormState = {
  currentAge: "30",
  targetRetirementAge: "55",
  annualIncome: "150000",
  annualSavings: "40000",
  investableAssets: "200000",
  totalNetWorth: "350000",
  targetRetirementSpending: "80000",
  expectedReturn: "7",
  purchasePrice: "85000",
  downPayment: "20000",
  interestRate: "6.5",
  loanTermYears: "5",
  annualMaintenance: "2000",
  annualInsurance: "2400",
  annualTrackBudget: "3000",
  holdPeriodYears: "5",
  expectedResalePercent: "55",
};

function InputField({
  label,
  name,
  value,
  onChange,
  prefix,
  suffix,
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-neutral-400 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {prefix}
          </span>
        )}
        <input
          type="number"
          name={name}
          value={value}
          min="0"
          step={step || "1"}
          onChange={(e) => onChange(name, e.target.value)}
          className={`input-field ${prefix ? "pl-8" : ""} ${suffix ? "pr-10" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function FinancialForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultState);
  const [errors, setErrors] = useState<string[]>([]);

  function handleChange(name: string, value: string) {
    const num = parseFloat(value);
    if (value !== "" && num < 0) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): string[] {
    const errs: string[] = [];
    const entries = Object.entries(form) as [keyof FormState, string][];
    for (const [key, val] of entries) {
      if (val === "" || isNaN(parseFloat(val))) {
        errs.push(`${key} is required and must be a number.`);
      }
    }
    const age = parseFloat(form.currentAge);
    const retAge = parseFloat(form.targetRetirementAge);
    if (!isNaN(age) && !isNaN(retAge) && retAge <= age) {
      errs.push("Target retirement age must be greater than current age.");
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(form)) {
      params.set(key, val);
    }
    router.push(`/results?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          {errors.map((err, i) => (
            <p key={i} className="text-red-400 text-sm">
              {err}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Inputs */}
        <div className="glass-panel card-hover p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Personal Financial Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Current Age"
              name="currentAge"
              value={form.currentAge}
              onChange={handleChange}
            />
            <InputField
              label="Target Retirement Age"
              name="targetRetirementAge"
              value={form.targetRetirementAge}
              onChange={handleChange}
            />
            <InputField
              label="Annual Income"
              name="annualIncome"
              value={form.annualIncome}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Annual Savings"
              name="annualSavings"
              value={form.annualSavings}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Investable Assets"
              name="investableAssets"
              value={form.investableAssets}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Total Net Worth"
              name="totalNetWorth"
              value={form.totalNetWorth}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Target Retirement Spending"
              name="targetRetirementSpending"
              value={form.targetRetirementSpending}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Expected Return"
              name="expectedReturn"
              value={form.expectedReturn}
              onChange={handleChange}
              suffix="%"
              step="0.1"
            />
          </div>
        </div>

        {/* Vehicle Inputs */}
        <div className="glass-panel card-hover p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Vehicle Cost Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Purchase Price"
              name="purchasePrice"
              value={form.purchasePrice}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Down Payment"
              name="downPayment"
              value={form.downPayment}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Interest Rate"
              name="interestRate"
              value={form.interestRate}
              onChange={handleChange}
              suffix="%"
              step="0.1"
            />
            <InputField
              label="Loan Term"
              name="loanTermYears"
              value={form.loanTermYears}
              onChange={handleChange}
              suffix="yrs"
            />
            <InputField
              label="Annual Maintenance"
              name="annualMaintenance"
              value={form.annualMaintenance}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Annual Insurance"
              name="annualInsurance"
              value={form.annualInsurance}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Annual Track Budget"
              name="annualTrackBudget"
              value={form.annualTrackBudget}
              onChange={handleChange}
              prefix="$"
            />
            <InputField
              label="Hold Period"
              name="holdPeriodYears"
              value={form.holdPeriodYears}
              onChange={handleChange}
              suffix="yrs"
            />
            <InputField
              label="Expected Resale"
              name="expectedResalePercent"
              value={form.expectedResalePercent}
              onChange={handleChange}
              suffix="%"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button type="submit" className="btn-primary text-lg px-12">
          Calculate Impact
        </button>
      </div>
    </form>
  );
}
