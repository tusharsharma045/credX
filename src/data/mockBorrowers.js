export const MOCK_MACRO_TICKER = [
  { pair: 'KES/USD FX Volatility', val: '128.4 (+0.8%)', status: 'warning' },
  { pair: 'LatAm Inflation Index', val: '5.2% (Moderate)', status: 'normal' },
  { pair: 'SE Asia Commodity Volatility', val: '14.2 (Elevated)', status: 'warning' },
  { pair: 'Sub-Saharan Sovereign Spread', val: '410 bps', status: 'critical' },
  { pair: 'Naira (NGN) Devaluation Risk', val: 'High (-3.4%)', status: 'critical' },
  { pair: 'Global Fertilizer Index', val: '-1.8% (Stabilizing)', status: 'positive' }
];

export const MOCK_BORROWERS = [
  {
    id: 'bor-001',
    name: 'Mama Mboga Logistics',
    owner: 'Grace Wanjiku',
    location: 'Nairobi, Kenya',
    region: 'Sub-Saharan Africa',
    sector: 'Agri-Distributor & Micro-Transport',
    requestedAmount: 18000,
    tenorMonths: 12,
    purpose: 'Cold-chain vehicle fleet expansion & inventory prepay',
    traditionalScore: 590,
    credxScore: 785,
    defaultProbability: 6.2, // percentage
    riskTier: 'Low Risk',
    riskColor: 'emerald',
    
    // Traditional Metrics
    dtiRatio: 38.5, // %
    creditBureauHistoryYears: 1.5,
    collateralValueUSD: 4500, // Land title missing, only vehicle chattel
    existingDebtUSD: 3200,

    // Alternative & XAI Data Points
    mobileMoneyMonthlyInflowUSD: 4850,
    mpesaTillActiveMonths: 24,
    supplierPaymentOnTimePct: 98.4,
    posTransactionVelocityPerDay: 42,
    appCustomerRating: 4.8,

    // SHAP Feature Attribution Breakdown (Base score = 650)
    shapFeatures: [
      { name: 'Mobile Money Deposit Velocity', category: 'Alternative Data', shapValue: +18.4, impact: 'positive', description: 'Daily M-Pesa till receipts show consistent cash flow resilience' },
      { name: 'Supplier Settlement Track Record', category: 'Alternative Data', shapValue: +14.2, impact: 'positive', description: '98.4% on-time settlement across 6 major agricultural wholesalers' },
      { name: 'POS Micro-transaction Frequency', category: 'Alternative Data', shapValue: +11.8, impact: 'positive', description: 'Avg 42 transactions/day indicates strong local retail demand' },
      { name: 'Digital Footprint & App Rating', category: 'Alternative Data', shapValue: +6.5, impact: 'positive', description: '4.8-star verified customer feedback on logistics booking platform' },
      { name: 'Lack of Formal Land Collateral', category: 'Traditional Bureau', shapValue: -7.3, impact: 'negative', description: 'Borrower lacks registered title deed for fixed asset security' },
      { name: 'KES/USD Currency Volatility Risk', category: 'Macro Volatility', shapValue: -12.1, impact: 'negative', description: 'High sensitivity to fuel import cost inflation driven by exchange rate' }
    ],

    // XAI Narrative
    xaiNarrative: "Mama Mboga Logistics was flagged as 'Moderate-High Risk' by legacy bank credit models due to a short 1.5-year credit bureau record and lack of real estate collateral. However, CredX XAI algorithms identify strong non-traditional signals: M-Pesa till receipts demonstrate $4.85k reliable monthly inflow with 98.4% supplier payment punctuality over 2 years. The positive SHAP forces (+50.9 points net) significantly outweigh the macroeconomic currency shock headwinds (-12.1 points).",

    // Counterfactual Baseline Values
    counterfactuals: {
      monthlyMobileInflow: 4850,
      supplierPunctuality: 98.4,
      macroInflationShock: 12.1,
      cashReserveMonths: 2.5
    },

    // Macro Volatility Stress Test Projections under Shocks
    stressTest: {
      baseline: 6.2,
      fxDevaluation20pct: 9.8,
      fuelPriceSpike35pct: 12.4,
      combinedShock: 16.8
    },

    // Underwriting Recommendation
    recommendation: {
      action: 'APPROVE',
      maxCreditLimit: 20000,
      interestRatePct: 12.5,
      standardBankRatePct: 19.8,
      recommendedCollateral: 'M-Pesa till cash-sweep lien & fleet chattel tag',
      covenants: ['Maintain min $800 weekly M-Pesa throughput', 'Quarterly supplier invoice audit']
    }
  },

  {
    id: 'bor-002',
    name: 'Saigon Micro-Retail Merchants',
    owner: 'Nguyen Van Minh',
    location: 'Ho Chi Minh City, Vietnam',
    region: 'Southeast Asia',
    sector: 'FMCG Retail & Digital Kiosk',
    requestedAmount: 25000,
    tenorMonths: 18,
    purpose: 'Automated kiosk deployment & seasonal inventory stock',
    traditionalScore: 640,
    credxScore: 840,
    defaultProbability: 3.8,
    riskTier: 'Very Low Risk',
    riskColor: 'emerald',

    dtiRatio: 28.0,
    creditBureauHistoryYears: 3.0,
    collateralValueUSD: 12000,
    existingDebtUSD: 5000,

    mobileMoneyMonthlyInflowUSD: 8200,
    mpesaTillActiveMonths: 36,
    supplierPaymentOnTimePct: 99.1,
    posTransactionVelocityPerDay: 110,
    appCustomerRating: 4.9,

    shapFeatures: [
      { name: 'MoMo Digital POS Velocity', category: 'Alternative Data', shapValue: +22.1, impact: 'positive', description: 'Over 110 daily digital QR code payments across 3 kiosk locations' },
      { name: 'Inventory Turnover Rate', category: 'Financial Velocity', shapValue: +15.6, impact: 'positive', description: '12-day inventory turnover cycle, well above sector average of 24 days' },
      { name: 'Supplier Credit Line Stability', category: 'Alternative Data', shapValue: +11.2, impact: 'positive', description: 'Continuous credit line with Vinamilk and Unilever Vietnam' },
      { name: 'Community Merchant Trust Index', category: 'Alternative Data', shapValue: +9.4, impact: 'positive', description: 'Zero default history across peer-to-peer merchant liquidity pool' },
      { name: 'Regional Rice Price Volatility', category: 'Macro Volatility', shapValue: -8.2, impact: 'negative', description: 'Potential squeeze on staple goods margins due to regional agricultural spikes' },
      { name: 'Short Commercial Lease Term', category: 'Operational Risk', shapValue: -5.1, impact: 'negative', description: 'Storefront lease up for renewal in 9 months' }
    ],

    xaiNarrative: "Saigon Micro-Retail exhibits exemplary digital payment velocity with MoMo QR payments providing real-time cashflow verification. Traditional credit scoring undervalues their fast 12-day inventory turnover and strong distributor trade credit. CredX XAI models assign a low 3.8% default probability, driven by high POS volume (+22.1 SHAP points) and robust peer liquidity buffer.",

    counterfactuals: {
      monthlyMobileInflow: 8200,
      supplierPunctuality: 99.1,
      macroInflationShock: 8.2,
      cashReserveMonths: 4.0
    },

    stressTest: {
      baseline: 3.8,
      fxDevaluation20pct: 5.4,
      fuelPriceSpike35pct: 6.9,
      combinedShock: 9.1
    },

    recommendation: {
      action: 'APPROVE',
      maxCreditLimit: 30000,
      interestRatePct: 10.8,
      standardBankRatePct: 16.5,
      recommendedCollateral: 'POS MoMo Settlement Automated Deduct',
      covenants: ['Direct MoMo merchant account integration']
    }
  },

  {
    id: 'bor-003',
    name: 'SolarPay Renewable SME',
    owner: 'Olubankole Adebayo',
    location: 'Lagos, Nigeria',
    region: 'West Africa',
    sector: 'Pay-As-You-Go Solar Systems',
    requestedAmount: 45000,
    tenorMonths: 24,
    purpose: 'Import of 500 High-Capacity Commercial Solar Kits',
    traditionalScore: 540,
    credxScore: 710,
    defaultProbability: 11.4,
    riskTier: 'Moderate Risk',
    riskColor: 'amber',

    dtiRatio: 45.2,
    creditBureauHistoryYears: 2.0,
    collateralValueUSD: 8000,
    existingDebtUSD: 14000,

    mobileMoneyMonthlyInflowUSD: 12500,
    mpesaTillActiveMonths: 20,
    supplierPaymentOnTimePct: 92.5,
    posTransactionVelocityPerDay: 75,
    appCustomerRating: 4.6,

    shapFeatures: [
      { name: 'IoT Smart-Meter Remittance Flow', category: 'Alternative Data', shapValue: +24.5, impact: 'positive', description: 'Telemetry data shows automated daily micropayments from 420 active solar units' },
      { name: 'Recurrent Off-Grid Utility Demand', category: 'Market Trend', shapValue: +16.3, impact: 'positive', description: 'High customer willingness to pay due to frequent national grid blackouts' },
      { name: 'Customer Subscription Retention', category: 'Alternative Data', shapValue: +10.1, impact: 'positive', description: '94% subscription renewal rate past 12 months' },
      { name: 'Naira Currency Devaluation Risk', category: 'Macro Volatility', shapValue: -26.8, impact: 'negative', description: 'High FX vulnerability as equipment is imported in USD while revenue is in NGN' },
      { name: 'Diesel Generator Price Pressure', category: 'Operational Risk', shapValue: -8.5, impact: 'negative', description: 'Logistics costs tied to local diesel prices' }
    ],

    xaiNarrative: "Legacy credit models rejected SolarPay due to a high DTI ratio (45.2%) and severe Naira currency risk. CredX XAI models reveal that IoT smart-meter telemetry provides an automated collateral mechanism (remote lock on default). While macro FX volatility creates significant downward pressure (-26.8 SHAP points), real-time utility micropayments (+24.5 points) justify a Conditional Approval with FX hedging requirements.",

    counterfactuals: {
      monthlyMobileInflow: 12500,
      supplierPunctuality: 92.5,
      macroInflationShock: 26.8,
      cashReserveMonths: 1.8
    },

    stressTest: {
      baseline: 11.4,
      fxDevaluation20pct: 18.6,
      fuelPriceSpike35pct: 22.1,
      combinedShock: 29.5
    },

    recommendation: {
      action: 'CONDITIONAL APPROVAL',
      maxCreditLimit: 40000,
      interestRatePct: 14.8,
      standardBankRatePct: 24.0,
      recommendedCollateral: 'IoT Smart Meter Remote Switch Control & Debt Service Reserve Account',
      covenants: ['Mandatory USD/NGN FX Hedging Collar', 'Monthly IoT Uptime Audit']
    }
  },

  {
    id: 'bor-004',
    name: 'Andean Organic Coffee Co-op',
    owner: 'Carlos Mendoza',
    location: 'Bogotá, Colombia',
    region: 'Latin America',
    sector: 'Agricultural Export Co-operative',
    requestedAmount: 60000,
    tenorMonths: 12,
    purpose: 'Pre-harvest working capital advance for 140 smallholder farmers',
    traditionalScore: 710,
    credxScore: 890,
    defaultProbability: 2.4,
    riskTier: 'Very Low Risk',
    riskColor: 'emerald',

    dtiRatio: 22.4,
    creditBureauHistoryYears: 6.0,
    collateralValueUSD: 35000,
    existingDebtUSD: 11000,

    mobileMoneyMonthlyInflowUSD: 18500,
    mpesaTillActiveMonths: 60,
    supplierPaymentOnTimePct: 99.8,
    posTransactionVelocityPerDay: 28,
    appCustomerRating: 4.95,

    shapFeatures: [
      { name: 'FairTrade Export Forward Contracts', category: 'Financial Backing', shapValue: +28.2, impact: 'positive', description: 'Locked USD purchase contracts with European organic coffee roasters' },
      { name: 'Satellite Crop Yield NDVI Density', category: 'Alternative Data', shapValue: +19.1, impact: 'positive', description: 'High Normalized Difference Vegetation Index (NDVI) verifies healthy crop canopy' },
      { name: 'Cooperative Reserve Emergency Fund', category: 'Financial Velocity', shapValue: +12.0, impact: 'positive', description: '$35,000 cash reserve held in credit union escrow' },
      { name: 'Long Credit Bureau History', category: 'Traditional Bureau', shapValue: +8.4, impact: 'positive', description: '6-year flawless repayment record with Banco Agrario' },
      { name: 'El Niño Weather Volatility Risk', category: 'Macro Volatility', shapValue: -11.5, impact: 'negative', description: 'Micro-climate rainfall disruption risk during harvest month' }
    ],

    xaiNarrative: "Andean Organic Coffee represents an ideal emerging market borrower profile. Combined with a solid 710 bureau score, CredX XAI models integrate satellite crop canopy health (NDVI) and USD-denominated FairTrade export contracts (+28.2 SHAP points). Default risk is exceptionally low at 2.4%.",

    counterfactuals: {
      monthlyMobileInflow: 18500,
      supplierPunctuality: 99.8,
      macroInflationShock: 11.5,
      cashReserveMonths: 5.5
    },

    stressTest: {
      baseline: 2.4,
      fxDevaluation20pct: 2.9,
      fuelPriceSpike35pct: 3.8,
      combinedShock: 5.2
    },

    recommendation: {
      action: 'APPROVE',
      maxCreditLimit: 75000,
      interestRatePct: 9.2,
      standardBankRatePct: 14.5,
      recommendedCollateral: 'Assignment of FairTrade Export Contract Proceeds',
      covenants: ['Parametric crop insurance cover against rainfall index']
    }
  },

  {
    id: 'bor-005',
    name: 'Aapla Dukan Micro-Kirana',
    owner: 'Sunita Sharma',
    location: 'Mumbai, India',
    region: 'South Asia',
    sector: 'Neighborhood Grocery & Digital Kiosk',
    requestedAmount: 12000,
    tenorMonths: 12,
    purpose: 'Cold storage expansion & UPI supplier auto-settlement setup',
    traditionalScore: 520,
    credxScore: 790,
    defaultProbability: 5.8,
    riskTier: 'Low Risk',
    riskColor: 'emerald',

    dtiRatio: 32.1,
    creditBureauHistoryYears: 0.8,
    collateralValueUSD: 2000,
    existingDebtUSD: 1800,

    mobileMoneyMonthlyInflowUSD: 5400,
    mpesaTillActiveMonths: 18,
    supplierPaymentOnTimePct: 97.5,
    posTransactionVelocityPerDay: 165,
    appCustomerRating: 4.85,

    shapFeatures: [
      { name: 'Daily UPI QR Scan Frequency', category: 'Alternative Data', shapValue: +26.3, impact: 'positive', description: 'Over 165 daily micro-transactions logged on PhonePe/Paytm QR' },
      { name: 'ONDC B2B Wholesaler Settlement', category: 'Alternative Data', shapValue: +17.2, impact: 'positive', description: 'Verified digital supply chain purchase history via Metro Cash & Carry' },
      { name: 'Low Inventory Aging & Fast Turnover', category: 'Financial Velocity', shapValue: +8.1, impact: 'positive', description: 'Perishable inventory turns over every 6 days' },
      { name: 'Unbanked / Limited Bureau History', category: 'Traditional Bureau', shapValue: -14.2, impact: 'negative', description: 'No formal CIBIL commercial history and no audited tax filing' },
      { name: 'Local Monsoon Disruption Risk', category: 'Macro Volatility', shapValue: -6.4, impact: 'negative', description: 'Seasonal footfall disruption during heavy rainfall' }
    ],

    xaiNarrative: "Traditional credit rating agencies assign Aapla Dukan a poor score of 520 due to lack of tax filings and formal financial statements. CredX XAI turns this around by analyzing 165+ daily UPI QR transactions ($5.4k/month flow) and digital ONDC distributor invoices. The high volume of digital payments (+26.3 SHAP points) demonstrates resilient daily cash flow and justifies a Low Risk classification (5.8% default probability).",

    counterfactuals: {
      monthlyMobileInflow: 5400,
      supplierPunctuality: 97.5,
      macroInflationShock: 6.4,
      cashReserveMonths: 2.8
    },

    stressTest: {
      baseline: 5.8,
      fxDevaluation20pct: 6.8,
      fuelPriceSpike35pct: 8.5,
      combinedShock: 11.2
    },

    recommendation: {
      action: 'APPROVE',
      maxCreditLimit: 15000,
      interestRatePct: 11.5,
      standardBankRatePct: 21.0,
      recommendedCollateral: 'Daily UPI Settlement Auto-Deduction (2% sweep)',
      covenants: ['Maintain min 80 daily UPI payment scans']
    }
  }
];

export const PORTFOLIO_STATS = {
  totalAssessed: 1485,
  avgCredxScore: 782,
  avgTraditionalScore: 602,
  portfolioDefaultRatePct: 4.8,
  legacyDefaultRatePct: 14.2,
  totalLoanVolumeUSD: '$24.8M',
  xaiAccuracyAuc: 0.924,
  regionalBreakdown: [
    { name: 'Sub-Saharan Africa', borrowers: 420, avgScore: 765, defaultRate: 6.1 },
    { name: 'Southeast Asia', borrowers: 510, avgScore: 820, defaultRate: 3.4 },
    { name: 'Latin America', borrowers: 310, avgScore: 810, defaultRate: 3.9 },
    { name: 'South Asia', borrowers: 245, avgScore: 775, defaultRate: 5.2 }
  ]
};
