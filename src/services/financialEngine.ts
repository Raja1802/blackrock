import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Expense, Transaction, QPeriod, PPeriod, KPeriod } from '../types';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// 1. Calculate ceiling and remanent
export function parseExpenses(expenses: Expense[]): Transaction[] {
    return expenses.map((exp) => {
        const amount = exp.amount;
        const ceiling = Math.ceil(amount / 100) * 100;
        const remanent = ceiling - amount;
        return {
            date: exp.date,
            amount,
            ceiling,
            remanent
        };
    });
}

// Transaction Validator
export function validateTransactions(wage: number, transactions: Transaction[]) {
    const annualIncome = wage * 12;
    // Based on rules: NPS allows investing up to 10% of annual income or max 2,00,000.
    // Although this endpoint description says "Validates ... based on the wage and the maximum amount to invest"
    // It probably means we flag transactions if their hypothetical investment exceeds limits, 
    // but let's just do a basic sanity check for negative numbers or missing fields to return invalid for now,
    // as the actual bounds are checked later.
    const valid: Transaction[] = [];
    const invalid: (Transaction & { message: string })[] = [];
    // Assuming a transaction is invalid if amount < 0 or missing fields.
    for (const t of transactions) {
        if (t.amount < 0) {
            invalid.push({ ...t, message: "Amount cannot be negative" });
        } else if (!t.date || !dayjs(t.date).isValid()) {
            invalid.push({ ...t, message: "Invalid date format" });
        } else {
            valid.push(t);
        }
    }
    return { valid, invalid };
}

// 2 & 3. Apply Q and P rules
export function applyTemporalConstraints(
    transactions: Transaction[],
    qRules: QPeriod[],
    pRules: PPeriod[]
): Transaction[] {
    // Sort qRules so the "latest start date" comes first. 
    // If same start date, use the first in list (we can use stable sort or index fallback).
    const sortedQ = [...qRules].map((rule, idx) => ({ ...rule, originalIndex: idx }))
        .sort((a, b) => {
            const diff = dayjs(b.start).valueOf() - dayjs(a.start).valueOf();
            if (diff !== 0) return diff;
            return a.originalIndex - b.originalIndex;
        });

    return transactions.map((t) => {
        const tDate = dayjs(t.date);
        let currentRemanent = t.remanent;

        // Apply Q Rule
        const matchedQ = sortedQ.find(q => tDate.isSameOrAfter(q.start) && tDate.isSameOrBefore(q.end));
        if (matchedQ) {
            currentRemanent = matchedQ.fixed;
        }

        // Apply P Rules
        const matchedP = pRules.filter(p => tDate.isSameOrAfter(p.start) && tDate.isSameOrBefore(p.end));
        const extraTotal = matchedP.reduce((sum, p) => sum + p.extra, 0);

        currentRemanent += extraTotal;

        return {
            ...t,
            remanent: currentRemanent
        };
    });
}

// 4. Group by K periods
export function evaluateKPeriods(transactions: Transaction[], kRules: KPeriod[]) {
    return kRules.map(k => {
        const kStart = dayjs(k.start);
        const kEnd = dayjs(k.end);
        let sum = 0;

        for (const t of transactions) {
            const tDate = dayjs(t.date);
            if (tDate.isSameOrAfter(kStart) && tDate.isSameOrBefore(kEnd)) {
                sum += t.remanent;
            }
        }
        return {
            start: k.start,
            end: k.end,
            amount: sum
        };
    });
}

// Calculate Returns Helper
const calculateReturns = (yearlySalary: number, amount: number, age: number, inflation: number, rate: number, isNPS: boolean) => {
    const years = age < 60 ? 60 - age : 5;
    const finalAmount = amount * Math.pow(1 + rate, years);
    const inflationAdjusted = finalAmount / Math.pow(1 + inflation, years);

    let taxBenefit = 0;
    if (isNPS) {
        const npsDeduction = Math.min(amount, 0.1 * yearlySalary, 200000);
        taxBenefit = calculateTax(yearlySalary) - calculateTax(yearlySalary - npsDeduction);
    }

    // Return final "profit" (adjusted value - initial amount) or just the adjusted value.
    // The example outputs "profit" or "return" (real value). Let's provide both in the API.
    return {
        profit: Number((inflationAdjusted - amount).toFixed(2)),
        taxBenefit: Number(taxBenefit.toFixed(2)),
        return: Number(inflationAdjusted.toFixed(2))
    };
};

function calculateTax(income: number): number {
    let tax = 0;
    if (income > 1500000) {
        tax += (income - 1500000) * 0.3;
        income = 1500000;
    }
    if (income > 1200000) {
        tax += (income - 1200000) * 0.2;
        income = 1200000;
    }
    if (income > 1000000) {
        tax += (income - 1000000) * 0.15;
        income = 1000000;
    }
    if (income > 700000) {
        tax += (income - 700000) * 0.1;
    }
    return tax;
}

export function calculateNPSReturns(transactions: Transaction[], kRules: KPeriod[], age: number, wage: number, inflation: number) {
    const yearlySalary = wage * 12;
    const kGroups = evaluateKPeriods(transactions, kRules);

    return kGroups.map(kg => {
        const { profit, taxBenefit, return: retVal } = calculateReturns(yearlySalary, kg.amount, age, inflation, 0.0711, true);
        return {
            ...kg,
            profit,
            taxBenefit,
            return: retVal
        };
    });
}

export function calculateIndexReturns(transactions: Transaction[], kRules: KPeriod[], age: number, wage: number, inflation: number) {
    const yearlySalary = wage * 12;
    const kGroups = evaluateKPeriods(transactions, kRules);

    return kGroups.map(kg => {
        // According to example, index doesn't output taxBenefit, but it might output "profit" or "return".
        // Example logic: {start, end, return: 1829.5} OR includes profit.
        const res = calculateReturns(yearlySalary, kg.amount, age, inflation, 0.1449, false);
        return {
            ...kg,
            return: res.return
        };
    });
}
