(function () {
  "use strict";

  const won = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
  const percentage = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });

  function value(id) {
    const element = document.getElementById(id);
    if (!element) return 0;
    return Number(String(element.value).replace(/[^0-9.-]/g, "")) || 0;
  }

  function show(id, number) {
    const element = document.getElementById(id);
    if (element) element.textContent = won.format(Math.round(number)) + "원";
  }

  function showPlain(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function showWidth(id, ratio) {
    const element = document.getElementById(id);
    if (element) element.style.width = Math.max(0, Math.min(100, ratio * 100)) + "%";
  }

  function moneyInput(event) {
    const input = event.target;
    const number = Number(input.value.replace(/[^0-9]/g, ""));
    input.value = number ? won.format(number) : "";
  }

  function bindMoneyInputs() {
    document.querySelectorAll("[data-money]").forEach(function (input) {
      input.addEventListener("input", moneyInput);
      if (input.value) moneyInput({ target: input });
    });
  }

  function initLoan() {
    const form = document.getElementById("loan-form");
    if (!form) return;

    function calculate() {
      const principal = value("loan-amount");
      const annualRate = value("loan-rate") / 100;
      const months = Math.max(1, Math.round(value("loan-months")));
      const grace = Math.min(Math.max(0, Math.round(value("loan-grace"))), months - 1);
      const repaymentMonths = months - grace;
      const monthlyRate = annualRate / 12;
      const method = form.elements.repayment.value;
      const gracePayment = principal * monthlyRate;
      let initialPayment = 0;
      let totalInterest = 0;

      if (method === "equal-payment") {
        initialPayment = monthlyRate === 0
          ? principal / repaymentMonths
          : principal * monthlyRate * Math.pow(1 + monthlyRate, repaymentMonths) /
            (Math.pow(1 + monthlyRate, repaymentMonths) - 1);
        totalInterest = initialPayment * repaymentMonths + gracePayment * grace - principal;
      } else if (method === "equal-principal") {
        const monthlyPrincipal = principal / repaymentMonths;
        initialPayment = monthlyPrincipal + principal * monthlyRate;
        totalInterest = monthlyRate * principal * (repaymentMonths + 1) / 2 + gracePayment * grace;
      } else {
        initialPayment = principal * monthlyRate;
        totalInterest = initialPayment * months;
      }

      const totalPayment = principal + totalInterest;
      const firstInterest = method === "bullet" ? initialPayment : principal * monthlyRate;
      const firstPrincipal = Math.max(0, initialPayment - firstInterest);
      const principalRatio = initialPayment ? firstPrincipal / initialPayment : 0;
      const interestRatio = initialPayment ? firstInterest / initialPayment : 0;
      show("loan-monthly", initialPayment);
      show("loan-interest", totalInterest);
      show("loan-total", totalPayment);
      show("loan-grace-payment", grace ? gracePayment : 0);
      showPlain("loan-result-label", method === "equal-principal" ? "상환 시작 첫 달 납입액" :
        method === "bullet" ? "매월 이자 납입액" : "상환기간 월 납입액");
      showPlain("loan-principal-month", "원금 " + won.format(Math.round(firstPrincipal)) + "원");
      showPlain("loan-interest-month", "이자 " + won.format(Math.round(firstInterest)) + "원");
      showPlain("loan-ratio", "원금 " + percentage.format(principalRatio * 100) + "% · 이자 " + percentage.format(interestRatio * 100) + "%");
      showWidth("loan-principal-bar", principalRatio);
      showWidth("loan-interest-bar", interestRatio);
    }

    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    calculate();
  }

  function initVat() {
    const form = document.getElementById("vat-form");
    if (!form) return;

    function calculate() {
      const entered = value("vat-amount");
      const rate = value("vat-rate") / 100;
      const inclusive = form.elements.vatMode.value === "inclusive";
      const supply = inclusive ? entered / (1 + rate) : entered;
      const tax = inclusive ? entered - supply : supply * rate;
      const total = inclusive ? entered : supply + tax;
      showPlain("vat-amount-label", inclusive ? "합계금액 (부가세 포함)" : "공급가액 (부가세 별도)");
      showPlain("vat-amount-hint", inclusive
        ? "입력한 합계금액 안에서 공급가액과 부가세를 나누어 계산합니다."
        : "입력 금액에 부가세를 더해 합계금액을 계산합니다.");
      showPlain("vat-result-caption", inclusive ? "입력한 부가세 포함 합계금액" : "부가세를 더한 합계금액");
      showPlain("vat-mode-description", inclusive
        ? "입력한 합계금액에서 부가세를 분리한 결과입니다. 일반과세자의 기본 부가가치세율 10%를 기준으로 역산하며, 실제 신고 세액은 달라질 수 있습니다."
        : "입력한 공급가액에 선택한 부가세율을 더한 결과입니다. 일반과세자의 기본 부가가치세율 10%를 기준으로 계산하며, 실제 신고 세액은 달라질 수 있습니다.");
      show("vat-supply", supply);
      show("vat-tax", tax);
      show("vat-total", total);
    }

    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    calculate();
  }

  function initSalary() {
    const form = document.getElementById("salary-form");
    if (!form) return;

    function calculate() {
      const annual = value("salary-annual");
      const monthlyGross = annual / 12;
      const nonTax = Math.min(value("salary-nontax"), monthlyGross);
      const taxableMonthly = Math.max(0, monthlyGross - nonTax);
      const monthlyTax = value("salary-tax");
      const pension = taxableMonthly * 0.0475;
      const health = taxableMonthly * 0.03595;
      const care = health * 0.1314;
      const employment = taxableMonthly * 0.009;
      const insurance = pension + health + care + employment;
      const monthlyNet = monthlyGross - insurance - monthlyTax;
      const annualNet = monthlyNet * 12;
      const deductions = insurance + monthlyTax;
      const netRatio = monthlyGross ? Math.max(0, monthlyNet) / monthlyGross : 0;
      const deductionRatio = monthlyGross ? Math.max(0, deductions) / monthlyGross : 0;

      show("salary-monthly", monthlyNet);
      show("salary-annual-net", annualNet);
      show("salary-insurance", insurance);
      show("salary-pension", pension);
      show("salary-health", health);
      show("salary-care", care);
      show("salary-employment", employment);
      show("salary-tax-result", monthlyTax);
      showPlain("salary-gross-summary", "연 " + won.format(Math.round(annual)) + "원 · 월 " + won.format(Math.round(monthlyGross)) + "원");
      showPlain("salary-deduction-summary", "월 " + won.format(Math.round(deductions)) + "원 (보험료 " + won.format(Math.round(insurance)) + "원 + 세금 " + won.format(Math.round(monthlyTax)) + "원)");
      showPlain("salary-net-summary", "월 " + won.format(Math.round(monthlyNet)) + "원 · 연 " + won.format(Math.round(annualNet)) + "원");
      showPlain("salary-ratio", "공제 " + percentage.format(deductionRatio * 100) + "%");
      showPlain("salary-net-legend", "실수령액 " + won.format(Math.round(monthlyNet)) + "원");
      showPlain("salary-deduction-legend", "공제 " + won.format(Math.round(deductions)) + "원");
      showWidth("salary-net-bar", netRatio);
      showWidth("salary-deduction-bar", deductionRatio);
    }

    form.addEventListener("input", calculate);
    calculate();
  }

  function initSeverance() {
    const form = document.getElementById("severance-form");
    if (!form) return;

    function calculate() {
      const start = new Date(document.getElementById("work-start").value);
      const end = new Date(document.getElementById("work-end").value);
      const pay = value("three-month-pay");
      const periodDays = Math.max(1, value("average-days"));
      const dayMs = 1000 * 60 * 60 * 24;
      const serviceDays = Math.max(0, Math.round((end - start) / dayMs));
      const dailyAverage = pay / periodDays;
      const gross = dailyAverage * 30 * (serviceDays / 365);
      const eligible = serviceDays >= 365;

      show("severance-gross", eligible ? gross : 0);
      show("severance-daily", dailyAverage);
      showPlain("severance-days", won.format(serviceDays) + "일");
      const status = document.getElementById("severance-status");
      if (status) {
        status.textContent = eligible ? "1년 이상 근속 기준 충족" : "1년 미만: 일반적으로 법정 퇴직금 대상 아님";
        status.classList.toggle("ineligible", !eligible);
      }
    }

    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    calculate();
  }

  bindMoneyInputs();
  initLoan();
  initVat();
  initSalary();
  initSeverance();

  const updated = document.querySelector("[data-today]");
  if (updated) updated.textContent = "기준 업데이트: 2026년 5월 26일";
}());
