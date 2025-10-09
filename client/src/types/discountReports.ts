export interface DiscountSummaryReport {
  totalDiscountAmount: number;
  totalDiscountApplications: number;
  uniqueOrdersWithDiscount: number;
  averageDiscountPerOrder: number;
  discountsByType: DiscountTypeReport[];
  topDiscounts: TopDiscountReport[];
  dailyDiscounts: DailyDiscountReport[];
}

export interface DiscountTypeReport {
  type: number;
  typeName: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
}

export interface TopDiscountReport {
  discountId: number;
  discountName: string;
  usageCount: number;
  totalAmount: number;
  averageAmount: number;
}

export interface DailyDiscountReport {
  date: string;
  count: number;
  totalAmount: number;
  uniqueOrders: number;
}