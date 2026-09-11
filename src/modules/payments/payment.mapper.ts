function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === 'object' &&
    'toNumber' in value &&
    typeof value.toNumber === 'function'
  ) {
    return value.toNumber();
  }

  return Number(value);
}

export class PaymentMapper {
  static toResponse<T extends Record<string, unknown>>(payment: T) {
    const order = payment.order;

    return {
      ...payment,
      amount: toNumber(payment.amount),
      ...(order && typeof order === 'object'
        ? {
            order: {
              ...(order as Record<string, unknown>),
              total_amount: toNumber(
                (order as Record<string, unknown>).total_amount,
              ),
            },
          }
        : {}),
    };
  }

  static toResponses<T extends Record<string, unknown>>(payments: T[]) {
    return payments.map((payment) => this.toResponse(payment));
  }
}