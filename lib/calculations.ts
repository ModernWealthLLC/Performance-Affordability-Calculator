export interface PersonalInputs {
  currentAge: number;
  targetRetirementAge: number;
  annualIncome: number;
  annualSavings: number;
  investableAssets: number;
  totalNetWorth: number;
  targetRetirementSpending: number;
  expectedReturn: number;
}

export interface VehicleInputs {
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
  annualMaintenance: number;
  annualInsurance: number;
  annualTrackBudget: number;
  holdPeriodYears: number;
  expectedResalePercent: number;
}

export interface CalculationResults {
  fiNumber: number;
  loanAmount: number;
  monthlyPayment: number;
  annualLoanPayment: number;
  resaleValue: number;
  annualDepreciation: number;
  trueAnnualCost: number;
  yearsToRetirement: number;
  fvPurchase: number;
  fvAnnualCost: number;
  opportunityCost: number;
  fvNoCar: number;
  fvWithCar: number;
  fiDelayYears: number;
  disciplineScore: number;
  disciplineCategory: string;
  carToNetWorthPercent: number;
  savingsRate: number;
  carToInvestablePercent: number;
  yearsToFiNoCar: number;
  yearsToFiWithCar: number;
}

function futureValue(pv: number, rate: number, years: number): number {
  return pv * Math.pow(1 + rate, years);
}

function computeMonthlyPayment(
  loanAmount: number,
  annualRate: number,
  loanTermYears: number
): number {
  if (loanAmount <= 0) return 0;
  const r = annualRate / 12;
  const n = loanTermYears * 12;
  if (r === 0) return loanAmount / n;
  return (r * loanAmount) / (1 - Math.pow(1 + r, -n));
}

function yearsToReachFI(
  investable: number,
  annualContribution: number,
  rate: number,
  fiTarget: number
): number {
  let portfolio = investable;
  let year = 0;
  const maxYears = 200;
  while (portfolio < fiTarget && year < maxYears) {
    portfolio = portfolio * (1 + rate) + annualContribution;
    year++;
  }
  return year;
}

function scoreBand(
  value: number,
  bands: [number, number][]
): number {
  for (const [threshold, score] of bands) {
    if (value <= threshold) return score;
  }
  return bands[bands.length - 1][1];
}

export function calculate(
  personal: PersonalInputs,
  vehicle: VehicleInputs
): CalculationResults {
  const fiNumber = personal.targetRetirementSpending / 0.04;

  const loanAmount = vehicle.purchasePrice - vehicle.downPayment;

  const monthlyPayment = computeMonthlyPayment(
    loanAmount,
    vehicle.interestRate / 100,
    vehicle.loanTermYears
  );
  const annualLoanPayment = monthlyPayment * 12;

  const resaleValue = vehicle.purchasePrice * (vehicle.expectedResalePercent / 100);
  const annualDepreciation =
    vehicle.holdPeriodYears > 0
      ? (vehicle.purchasePrice - resaleValue) / vehicle.holdPeriodYears
      : 0;

  const trueAnnualCost =
    annualLoanPayment +
    vehicle.annualMaintenance +
    vehicle.annualInsurance +
    vehicle.annualTrackBudget +
    annualDepreciation;

  const years = personal.targetRetirementAge - personal.currentAge;
  const rate = personal.expectedReturn / 100;

  const fvPurchase = futureValue(vehicle.purchasePrice, rate, years);

  const fvAnnualCost =
    rate > 0
      ? trueAnnualCost * ((Math.pow(1 + rate, years) - 1) / rate)
      : trueAnnualCost * years;

  const opportunityCost = fvPurchase + fvAnnualCost;

  const fvNoCar =
    personal.investableAssets * Math.pow(1 + rate, years) +
    personal.annualSavings *
      (rate > 0
        ? (Math.pow(1 + rate, years) - 1) / rate
        : years);

  const adjustedSavings = personal.annualSavings - trueAnnualCost;

  const fvWithCar =
    personal.investableAssets * Math.pow(1 + rate, years) +
    adjustedSavings *
      (rate > 0
        ? (Math.pow(1 + rate, years) - 1) / rate
        : years);

  const yearsToFiNoCar = yearsToReachFI(
    personal.investableAssets,
    personal.annualSavings,
    rate,
    fiNumber
  );
  const yearsToFiWithCar = yearsToReachFI(
    personal.investableAssets,
    adjustedSavings,
    rate,
    fiNumber
  );
  const fiDelayYears = yearsToFiWithCar - yearsToFiNoCar;

  // Discipline Score
  const carToNetWorthPercent =
    personal.totalNetWorth > 0
      ? (vehicle.purchasePrice / personal.totalNetWorth) * 100
      : 100;
  const savingsRate =
    personal.annualIncome > 0
      ? (personal.annualSavings / personal.annualIncome) * 100
      : 0;
  const carToInvestablePercent =
    personal.investableAssets > 0
      ? (vehicle.purchasePrice / personal.investableAssets) * 100
      : 100;

  const scoreNetWorth = scoreBand(carToNetWorthPercent, [
    [5, 30],
    [10, 25],
    [20, 15],
    [Infinity, 5],
  ]);

  const scoreSavings = scoreBand(savingsRate, [
    // >=25% → top band. We invert: if savingsRate >= 25 → 25 pts
    // We handle this with a custom approach since bands go <=
    [Infinity, 5],
  ]);
  // Custom savings scoring since it's "greater than or equal"
  let savingsScore: number;
  if (savingsRate >= 25) savingsScore = 25;
  else if (savingsRate >= 20) savingsScore = 20;
  else if (savingsRate >= 15) savingsScore = 15;
  else savingsScore = 5;

  const scoreFiDelay = scoreBand(fiDelayYears, [
    [0.5, 25],
    [1, 20],
    [2, 10],
    [Infinity, 5],
  ]);

  const scoreInvestable = scoreBand(carToInvestablePercent, [
    [10, 20],
    [20, 15],
    [30, 10],
    [Infinity, 5],
  ]);

  const disciplineScore =
    scoreNetWorth + savingsScore + scoreFiDelay + scoreInvestable;

  let disciplineCategory: string;
  if (disciplineScore >= 85) disciplineCategory = "Elite Discipline";
  else if (disciplineScore >= 70) disciplineCategory = "Controlled Enthusiast";
  else if (disciplineScore >= 50) disciplineCategory = "Aggressive";
  else disciplineCategory = "Lifestyle Risk";

  return {
    fiNumber,
    loanAmount,
    monthlyPayment,
    annualLoanPayment,
    resaleValue,
    annualDepreciation,
    trueAnnualCost,
    yearsToRetirement: years,
    fvPurchase,
    fvAnnualCost,
    opportunityCost,
    fvNoCar,
    fvWithCar,
    fiDelayYears,
    disciplineScore,
    disciplineCategory,
    carToNetWorthPercent,
    savingsRate,
    carToInvestablePercent,
    yearsToFiNoCar,
    yearsToFiWithCar,
  };
}
