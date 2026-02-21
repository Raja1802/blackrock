import { applyTemporalConstraints, parseExpenses, evaluateKPeriods, calculateNPSReturns, calculateIndexReturns } from '../src/services/financialEngine';

// Test Type: Unit Test
// Validation to be executed: Core financial logic (remanent, Q/P rules, K periods, inflation, tax)
// Command to execute: npm test

describe('Financial Engine', () => {

    it('should correctly parse expenses to calculate remanent', () => {
        const expenses = [
            { date: "2023-10-12 20:15", amount: 250 },
            { date: "2023-02-28 15:49", amount: 375 },
            { date: "2023-07-01 21:59", amount: 620 },
            { date: "2023-12-17 08:09", amount: 480 }
        ];

        const parsed = parseExpenses(expenses);
        expect(parsed[0].remanent).toBe(50);
        expect(parsed[1].remanent).toBe(25);
        expect(parsed[2].remanent).toBe(80);
        expect(parsed[3].remanent).toBe(20);
    });

    it('should correctly apply Q and P rules', () => {
        const parsed = [
            { date: "2023-10-12 20:15", amount: 250, ceiling: 300, remanent: 50 },
            { date: "2023-02-28 15:49", amount: 375, ceiling: 400, remanent: 25 },
            { date: "2023-07-01 21:59", amount: 620, ceiling: 700, remanent: 80 },
            { date: "2023-12-17 08:09", amount: 480, ceiling: 500, remanent: 20 }
        ];

        const qRules = [{ fixed: 0, start: "2023-07-01 00:00", end: "2023-07-31 23:59" }];
        const pRules = [{ extra: 25, start: "2023-10-01 08:00", end: "2023-12-31 19:59" }];

        const afterRules = applyTemporalConstraints(parsed, qRules, pRules);

        expect(afterRules[0].remanent).toBe(75); // 50 + 25
        expect(afterRules[1].remanent).toBe(25); // no change
        expect(afterRules[2].remanent).toBe(0); // Q rule applied
        expect(afterRules[3].remanent).toBe(45); // 20 + 25
    });

    it('should calculate NPS and Index returns correctly for full year', () => {
        // The test based on challenge example
        const afterRules = [
            { date: "2023-10-12 20:15", amount: 250, ceiling: 300, remanent: 75 },
            { date: "2023-02-28 15:49", amount: 375, ceiling: 400, remanent: 25 },
            { date: "2023-07-01 21:59", amount: 620, ceiling: 700, remanent: 0 },
            { date: "2023-12-17 08:09", amount: 480, ceiling: 500, remanent: 45 }
        ]; // Total remanent = 145

        const kRules = [
            { start: "2023-01-01 00:00", end: "2023-12-31 23:59" }
        ];

        // age 29, wage 50000, inflation 5.5% (0.055)
        const npsResults = calculateNPSReturns(afterRules, kRules, 29, 50000, 0.055);
        expect(npsResults[0].amount).toBe(145);
        // Checking against approximate value in prompt string: 231.9
        expect(Math.abs(npsResults[0].return! - 231.9)).toBeLessThan(1); // floating point tolerance
        expect(npsResults[0].taxBenefit).toBe(0);

        const indexResults = calculateIndexReturns(afterRules, kRules, 29, 50000, 0.055);
        expect(indexResults[0].amount).toBe(145);
        expect(Math.abs(indexResults[0].return! - 1829.5)).toBeLessThan(1);
    });
});
