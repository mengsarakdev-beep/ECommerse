import { UserMapper, type UserMapperInput } from '../users/user.mapper.js';

type DecimalLike = {
  toNumber(): number;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (isDecimalLike(value)) {
    return value.toNumber();
  }
  return Number(value);
}

function isDecimalLike(value: unknown): value is DecimalLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof value.toNumber === 'function'
  );
}

export class OrderMapper {
  static toResponse<T extends Record<string, unknown>>(order: T) {
    const items = Array.isArray(order.items)
      ? (order.items as unknown[])
      : null;
    const mappedItems = items
      ? items.map((item) => {
          if (!item || typeof item !== 'object') {
            return item;
          }

          const orderItem = item as Record<string, unknown>;
          const product = orderItem.product;

          return {
            ...orderItem,
            price: toNumber(orderItem.price),
            subtotal: toNumber(orderItem.subtotal),
            ...(product && typeof product === 'object'
              ? {
                  product: {
                    ...(product as Record<string, unknown>),
                    original_price: toNumber(
                      (product as Record<string, unknown>).original_price,
                    ),
                    discount_percent: toNumber(
                      (product as Record<string, unknown>).discount_percent,
                    ),
                    price: toNumber((product as Record<string, unknown>).price),
                  },
                }
              : {}),
          };
        })
      : order.items;

    const user = order.user;

    return {
      ...order,
      total_amount: toNumber(order.total_amount),
      items: mappedItems,
      ...(user && typeof user === 'object'
        ? { user: UserMapper.toResponse(user as UserMapperInput) }
        : { user: null }),
    };
  }

  static toResponses<T extends Record<string, unknown>>(orders: T[]) {
    return orders.map((order) => this.toResponse(order));
  }
}
