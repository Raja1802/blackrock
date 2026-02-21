export interface Expense {
    date: string;
    amount: number;
}

export interface Transaction {
    date: string;
    amount: number;
    ceiling: number;
    remanent: number;
}

export interface InvalidTransaction extends Transaction {
    message: string;
}

export interface QPeriod {
    fixed: number;
    start: string;
    end: string;
}

export interface PPeriod {
    extra: number;
    start: string;
    end: string;
}

export interface KPeriod {
    start: string;
    end: string;
}

export interface SavingsByDate {
    start: string;
    end: string;
    amount: number;
    profit?: number;
    taxBenefit?: number;
}

export interface ReturnResponse {
    transactionsTotalAmount: number;
    transactionsTotalCeiling: number;
    savingsByDates: SavingsByDate[];
}
