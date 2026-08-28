/**
 * FD Lanka — Fixed Deposit Calculator
 * Powered by FintechLK
 */

const TAX_RATE = 0.10; // 10% Advance Income Tax (AIT / WHT) in Sri Lanka

// Default Rate Table Data
const defaultRates = {
  standard: [
    { tenure: '1 Month', months: 1, rate: 8.00, payout: 'maturity', minDeposit: 25000 },
    { tenure: '2 Months', months: 2, rate: 8.25, payout: 'maturity', minDeposit: 25000 },
    { tenure: '3 Months', months: 3, rate: 9.00, payout: 'maturity', minDeposit: 10000 },
    { tenure: '4 Months', months: 4, rate: 9.00, payout: 'maturity', minDeposit: 500000 },
    { tenure: '6 Months', months: 6, rate: 9.75, payout: 'maturity', minDeposit: 10000 },
    { tenure: '12 Months', months: 12, rate: 10.00, payout: 'maturity', minDeposit: 10000 },
    { tenure: '24 Months', months: 24, rate: 11.00, payout: 'maturity', minDeposit: 100000 },
    { tenure: '36 Months', months: 36, rate: 11.50, payout: 'maturity', minDeposit: 100000 },
    { tenure: '48 Months', months: 48, rate: 12.00, payout: 'maturity', minDeposit: 100000 },
    { tenure: '60 Months', months: 60, rate: 12.50, payout: 'maturity', minDeposit: 100000 }
  ],
  efd: [
    { tenure: '1 Month', months: 1, rate: 8.00, payout: 'maturity', minDeposit: 25000 },
    { tenure: '2 Months', months: 2, rate: 8.25, payout: 'maturity', minDeposit: 25000 },
    { tenure: '3 Months', months: 3, rate: 9.25, payout: 'maturity', minDeposit: 10000 },
    { tenure: '6 Months', months: 6, rate: 10.00, payout: 'maturity', minDeposit: 10000 },
    { tenure: '12 Months', months: 12, rate: 10.25, payout: 'maturity', minDeposit: 10000 },
    { tenure: '24 Months', months: 24, rate: 11.25, payout: 'maturity', minDeposit: 100000 },
    { tenure: '36 Months', months: 36, rate: 11.75, payout: 'maturity', minDeposit: 100000 },
    { tenure: '48 Months', months: 48, rate: 12.25, payout: 'maturity', minDeposit: 100000 },
    { tenure: '60 Months', months: 60, rate: 12.75, payout: 'maturity', minDeposit: 100000 }
  ]
};

// Application State
const state = {
  activeTab: 'standard', // 'standard' or 'efd'
  depositAmount: 100000,
  selectedTenureMonths: 12,
  annualRate: 10.00,
  isCustomTenure: false,
  customTenureVal: 12,
  customTenureUnit: 'months', // 'days', 'months', 'years'
  selectedPayout: 'maturity', // 'maturity', 'monthly', 'annually'
  taxExempt: false
};

// DOM Elements
const elements = {
  tabBtns: document.querySelectorAll('.tab-btn'),
  depositInput: document.getElementById('deposit-amount'),
  minDepositWarning: document.getElementById('min-deposit-warning'),
  tenureChipsContainer: document.getElementById('tenure-chips'),
  
  toggleCustomTenure: document.getElementById('toggle-custom-tenure'),
  customTenureWrapper: document.getElementById('custom-tenure-wrapper'),
  customTenureInput: document.getElementById('custom-tenure-val'),
  customTenureUnitSelect: document.getElementById('custom-tenure-unit'),
  
  annualRateInput: document.getElementById('annual-rate-input'),
  payoutRadios: document.getElementsByName('payout-frequency'),
  payoutOptionsContainer: document.getElementById('payout-options-container'),
  taxExemptCheckbox: document.getElementById('tax-exempt-check'),
  
  calcBtn: document.getElementById('calc-btn'),

  // Results UI
  resultsCard: document.getElementById('results-card'),
  waxSealValue: document.getElementById('wax-seal-value'),
  waxSealLabel: document.getElementById('wax-seal-label'),
  
  // Table Fields
  resPrincipal: document.getElementById('res-principal'),
  resPlanTenure: document.getElementById('res-plan-tenure'),
  resGrossInterest: document.getElementById('res-gross-interest'),
  resTaxAmount: document.getElementById('res-tax-amount'),
  resTaxLabel: document.getElementById('res-tax-label'),
  resNetInterest: document.getElementById('res-net-interest'),
  resMaturityValue: document.getElementById('res-maturity-value')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  formatDepositInput(elements.depositInput);
  renderTenureChips();
  calculateAndRender();
});

function setupEventListeners() {
  // Tab buttons
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeTab = btn.dataset.tab;
      
      // Default tenure selection
      state.selectedTenureMonths = 12;
      const list = defaultRates[state.activeTab];
      const match = list.find(i => i.months === 12) || list[0];
      state.annualRate = match.rate;
      elements.annualRateInput.value = match.rate.toFixed(2);

      renderTenureChips();
      calculateAndRender();
    });
  });

  // Deposit Input
  elements.depositInput.addEventListener('input', (e) => {
    formatDepositInput(e.target);
    state.depositAmount = parseCurrency(e.target.value);
  });

  // Annual Rate Input
  elements.annualRateInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      state.annualRate = val;
    }
  });

  // Custom Tenure Toggle
  elements.toggleCustomTenure.addEventListener('change', (e) => {
    state.isCustomTenure = e.target.checked;
    elements.customTenureWrapper.style.display = state.isCustomTenure ? 'flex' : 'none';
    if (state.isCustomTenure) {
      document.querySelectorAll('.tenure-chip').forEach(c => c.classList.remove('selected'));
    } else {
      renderTenureChips();
    }
  });

  elements.customTenureInput.addEventListener('input', (e) => {
    state.customTenureVal = Math.max(1, parseInt(e.target.value, 10) || 1);
  });

  elements.customTenureUnitSelect.addEventListener('change', (e) => {
    state.customTenureUnit = e.target.value;
  });

  // Payout Radio Listeners
  elements.payoutRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        state.selectedPayout = e.target.value;
      }
    });
  });

  // Tax Exemption Checkbox
  elements.taxExemptCheckbox.addEventListener('change', (e) => {
    state.taxExempt = e.target.checked;
  });

  // CALCULATE BUTTON CLICK ACTION
  elements.calcBtn.addEventListener('click', () => {
    calculateAndRender();
    if (window.innerWidth <= 900) {
      elements.resultsCard.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// Render Tenure Chips
function renderTenureChips() {
  const container = elements.tenureChipsContainer;
  container.innerHTML = '';

  const list = defaultRates[state.activeTab];

  list.forEach(item => {
    const chip = document.createElement('div');
    chip.className = `tenure-chip ${item.months === state.selectedTenureMonths && !state.isCustomTenure ? 'selected' : ''}`;
    
    const name = document.createElement('span');
    name.className = 'tenure-name';
    name.textContent = item.tenure;

    const rateBadge = document.createElement('span');
    rateBadge.className = 'rate-badge';
    rateBadge.textContent = `${item.rate.toFixed(2)}% p.a.`;

    chip.appendChild(name);
    chip.appendChild(rateBadge);

    chip.addEventListener('click', () => {
      if (state.isCustomTenure) {
        state.isCustomTenure = false;
        elements.toggleCustomTenure.checked = false;
        elements.customTenureWrapper.style.display = 'none';
      }

      state.selectedTenureMonths = item.months;
      state.annualRate = item.rate;
      elements.annualRateInput.value = item.rate.toFixed(2);

      document.querySelectorAll('.tenure-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');

      updatePayoutVisibility(item.months);
    });

    container.appendChild(chip);
  });

  updatePayoutVisibility(state.selectedTenureMonths);
}

// Update Payout Frequency Options
function updatePayoutVisibility(months) {
  const isSub12 = months < 12;
  const is24Plus = months >= 24;

  const monthlyRadio = document.querySelector('input[name="payout-frequency"][value="monthly"]');
  const annuallyRadio = document.querySelector('input[name="payout-frequency"][value="annually"]');
  const maturityRadio = document.querySelector('input[name="payout-frequency"][value="maturity"]');

  if (isSub12) {
    monthlyRadio.disabled = true;
    annuallyRadio.disabled = true;
    maturityRadio.checked = true;
    state.selectedPayout = 'maturity';
  } else {
    monthlyRadio.disabled = false;
    annuallyRadio.disabled = !is24Plus;
    if (state.selectedPayout === 'annually' && !is24Plus) {
      maturityRadio.checked = true;
      state.selectedPayout = 'maturity';
    }
  }
}

// Perform Main Calculations
function calculateAndRender() {
  let durationInYears = 1;
  let durationText = '';
  let minDepositThreshold = 10000;

  if (state.isCustomTenure) {
    if (state.customTenureUnit === 'days') {
      durationInYears = state.customTenureVal / 365;
      durationText = `${state.customTenureVal} Days`;
    } else if (state.customTenureUnit === 'months') {
      durationInYears = state.customTenureVal / 12;
      durationText = `${state.customTenureVal} Months`;
    } else {
      durationInYears = state.customTenureVal; // Years
      durationText = `${state.customTenureVal} Years`;
    }
    minDepositThreshold = 25000;
  } else {
    durationInYears = state.selectedTenureMonths / 12;
    durationText = `${state.selectedTenureMonths} Months`;
    
    if (state.selectedTenureMonths === 1 || state.selectedTenureMonths === 2) minDepositThreshold = 25000;
    else if (state.selectedTenureMonths === 4) minDepositThreshold = 500000;
    else if (state.selectedTenureMonths >= 24) minDepositThreshold = 100000;
  }

  // Minimum Deposit Validation
  const isDepositValid = state.depositAmount >= minDepositThreshold;
  if (!isDepositValid) {
    elements.minDepositWarning.style.display = 'block';
    elements.minDepositWarning.textContent = `Minimum deposit for this tenure is Rs. ${formatCurrency(minDepositThreshold)}. Please enter at least that amount.`;
    elements.resultsCard.classList.add('invalid-results');
  } else {
    elements.minDepositWarning.style.display = 'none';
    elements.resultsCard.classList.remove('invalid-results');
  }

  // Interest Calculations
  let grossInterest = 0;

  if (state.selectedPayout === 'monthly') {
    const monthlyInterest = (state.depositAmount * (state.annualRate / 100)) / 12;
    const totalMonths = Math.max(1, Math.round(durationInYears * 12));
    grossInterest = monthlyInterest * totalMonths;
  } else if (state.selectedPayout === 'annually') {
    const annualInterest = state.depositAmount * (state.annualRate / 100);
    grossInterest = annualInterest * durationInYears;
  } else {
    // At Maturity
    grossInterest = state.depositAmount * (state.annualRate / 100) * durationInYears;
  }

  // AIT 10% Tax Math
  const applicableTaxRate = state.taxExempt ? 0.0 : TAX_RATE;
  const taxAmount = grossInterest * applicableTaxRate;
  const netInterest = grossInterest - taxAmount;
  const maturityValue = state.depositAmount + netInterest;

  // Render Wax Seal Badge
  elements.waxSealValue.textContent = `Rs. ${formatCurrency(maturityValue)}`;
  elements.waxSealLabel.textContent = state.taxExempt ? 'Maturity Value (Tax Exempt)' : 'Maturity Value (Net 10% AIT)';

  // Render Table Breakdown
  elements.resPrincipal.textContent = `Rs. ${formatCurrency(state.depositAmount)}`;
  
  const planTitle = state.activeTab === 'efd' ? 'eFD (Digital FD)' : 'Standard Fixed Deposit';
  let payoutLabel = 'Paid at Maturity';
  if (state.selectedPayout === 'monthly') payoutLabel = 'Paid Monthly';
  if (state.selectedPayout === 'annually') payoutLabel = 'Paid Annually';

  elements.resPlanTenure.textContent = `${planTitle} — ${durationText} (${payoutLabel})`;
  elements.resGrossInterest.textContent = `Rs. ${formatCurrency(grossInterest)}`;

  if (state.taxExempt) {
    elements.resTaxLabel.textContent = 'AIT Tax (10%) — Exempt';
    elements.resTaxAmount.textContent = 'Rs. 0.00';
  } else {
    elements.resTaxLabel.textContent = 'AIT Tax (10%)';
    elements.resTaxAmount.textContent = `- Rs. ${formatCurrency(taxAmount)}`;
  }

  elements.resNetInterest.textContent = `Rs. ${formatCurrency(netInterest)}`;
  elements.resMaturityValue.textContent = `Rs. ${formatCurrency(maturityValue)}`;
}

// Utilities
function formatDepositInput(inputEl) {
  let rawValue = inputEl.value.replace(/[^0-9]/g, '');
  if (!rawValue) {
    inputEl.value = '0';
    return;
  }
  inputEl.value = parseInt(rawValue, 10).toLocaleString('en-US');
}

function parseCurrency(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '')) || 0;
}

function formatCurrency(num) {
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
