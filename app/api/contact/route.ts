import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.WEALTHBOX_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Wealthbox API token not configured" },
      { status: 500 }
    );
  }

  const {
    firstName,
    lastName,
    email,
    annualIncome,
    investableAssets,
    totalNetWorth,
    vehicleMake,
    vehicleModel,
    purchasePrice,
    downPayment,
    interestRate,
    loanTermYears,
    annualMaintenance,
    annualInsurance,
    annualTrackBudget,
    holdPeriodYears,
    expectedResalePercent,
  } = await req.json();

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: "firstName, lastName, and email are required" },
      { status: 400 }
    );
  }

  const vehicleInfo = [
    `Vehicle: ${vehicleMake || ""} ${vehicleModel || ""}`.trim(),
    `Purchase Price: $${Number(purchasePrice || 0).toLocaleString()}`,
    `Down Payment: $${Number(downPayment || 0).toLocaleString()}`,
    `Interest Rate: ${interestRate || 0}%`,
    `Loan Term: ${loanTermYears || 0} years`,
    `Annual Maintenance: $${Number(annualMaintenance || 0).toLocaleString()}`,
    `Annual Insurance: $${Number(annualInsurance || 0).toLocaleString()}`,
    `Annual Track + Modification Budget: $${Number(annualTrackBudget || 0).toLocaleString()}`,
    `Holding Period: ${holdPeriodYears || 0} years`,
    `Expected Resale: ${expectedResalePercent || 0}%`,
  ].join("\n");

  const res = await fetch("https://api.crmworkspace.com/v1/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ACCESS_TOKEN": token,
    },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email_addresses: [{ address: email, kind: "Work" }],
      type: "Person",
      contact_source: "APEX Calculator",
      tags: ["APEX Report"],
      gross_annual_income: annualIncome ? Number(annualIncome) : undefined,
      assets: investableAssets ? Number(investableAssets) : undefined,
      estimated_net_worth: totalNetWorth ? Number(totalNetWorth) : undefined,
      important_information: vehicleInfo,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: "Wealthbox API error", details: body },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json({ success: true, contactId: data.id });
}
