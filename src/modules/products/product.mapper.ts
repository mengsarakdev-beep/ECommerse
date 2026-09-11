type DecimalLike = unknown;

function toNumber(value: DecimalLike): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof value.toNumber === 'function'
  ) {
    return value.toNumber();
  }

  return Number(value);
}

export class ProductMapper {
  static toResponse<T extends Record<string, unknown>>(product: T) {
    return {
      ...product,
      original_price: toNumber(product.original_price),
      discount_percent: toNumber(product.discount_percent),
      price: toNumber(product.price),
    };
  }

  static toResponses<T extends Record<string, unknown>>(products: T[]) {
    return products.map((product) => this.toResponse(product));
  }
}
