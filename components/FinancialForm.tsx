"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ContactModal from "./ContactModal";

interface FormState {
  currentAge: string;
  targetRetirementAge: string;
  annualIncome: string;
  annualSavings: string;
  investableAssets: string;
  totalNetWorth: string;
  targetRetirementSpending: string;
  expectedReturn: string;
  vehicleMake: string;
  vehicleModel: string;
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
  currentAge: "40",
  targetRetirementAge: "67",
  annualIncome: "500000",
  annualSavings: "100000",
  investableAssets: "1000000",
  totalNetWorth: "2500000",
  targetRetirementSpending: "180000",
  expectedReturn: "7",
  vehicleMake: "Mazda",
  vehicleModel: "Miata",
  purchasePrice: "40000",
  downPayment: "8000",
  interestRate: "5.5",
  loanTermYears: "5",
  annualMaintenance: "1000",
  annualInsurance: "1500",
  annualTrackBudget: "5000",
  holdPeriodYears: "3",
  expectedResalePercent: "60",
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
      <label className="block text-sm text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
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
  const [showContactModal, setShowContactModal] = useState(false);

  const textFields: (keyof FormState)[] = ["vehicleMake", "vehicleModel"];

  function handleChange(name: string, value: string) {
    if (textFields.includes(name as keyof FormState)) {
      setForm((prev) => ({ ...prev, [name]: value }));
      return;
    }
    const num = parseFloat(value);
    if (value !== "" && num < 0) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): string[] {
    const errs: string[] = [];
    const entries = Object.entries(form) as [keyof FormState, string][];
    for (const [key, val] of entries) {
      if (textFields.includes(key)) {
        if (val.trim() === "") {
          errs.push(`${key === "vehicleMake" ? "Vehicle Make" : "Vehicle Model"} is required.`);
        }
        continue;
      }
      if (val === "" || isNaN(parseFloat(val))) {
        errs.push(`${key} is required and must be a number.`);
      }
    }
    const age = parseFloat(form.currentAge);
    const retAge = parseFloat(form.targetRetirementAge);
    if (!isNaN(age) && !isNaN(retAge) && retAge <= age) {
      errs.push("Target retirement age must be greater than current age.");
    }
    const pp = parseFloat(form.purchasePrice);
    const dp = parseFloat(form.downPayment);
    if (!isNaN(pp) && !isNaN(dp) && dp > pp) {
      errs.push("Down payment cannot exceed the purchase price.");
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
    setShowContactModal(true);
  }

  function handleContactSubmit(firstName: string, lastName: string, email: string) {
    setShowContactModal(false);
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(form)) {
      params.set(key, val);
    }
    params.set("firstName", firstName);
    params.set("lastName", lastName);
    params.set("email", email);
    router.push(`/results?${params.toString()}`);
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            {errors.map((err, i) => (
              <p key={i} className="text-red-600 text-sm">
                {err}
              </p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Inputs */}
          <div className="glass-panel card-hover p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900">
              <span className="w-2 h-2 rounded-full bg-[#0f487f]" />
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
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900">
              <span className="w-2 h-2 rounded-full bg-[#0f487f]" />
              Vehicle Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Make</label>
                <input
                  type="text"
                  name="vehicleMake"
                  value={form.vehicleMake}
                  placeholder="e.g. Porsche"
                  onChange={(e) => handleChange("vehicleMake", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Model</label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={form.vehicleModel}
                  placeholder="e.g. 911 GT3"
                  onChange={(e) => handleChange("vehicleModel", e.target.value)}
                  className="input-field"
                />
              </div>
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
                label="Annual Track + Modification Budget"
                name="annualTrackBudget"
                value={form.annualTrackBudget}
                onChange={handleChange}
                prefix="$"
              />
              <InputField
                label="Holding Period"
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

      {showContactModal && (
        <ContactModal
          onSubmit={handleContactSubmit}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </>
  );
}
