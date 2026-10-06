/**
 * Shopify Storefront API (Headless channel). The public token is meant for browsers,
 * so it is fine in client code. Products, prices and stock live in the Shopify admin.
 */
export const SHOP_DOMAIN = 'ht1m1e-ie.myshopify.com';
const TOKEN = 'b76d14fbb2f4967c98e3193ee3667d21';
const API = `https://${SHOP_DOMAIN}/api/2026-07/graphql.json`;

export async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '));
  return json.data as T;
}

export type Money = { amount: string; currencyCode: string };
export type Variant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: { name: string; value: string }[];
};
export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  availableForSale: boolean;
  featuredImage: { url: string; altText: string | null; width: number; height: number } | null;
  options: { name: string; optionValues: { name: string }[] }[];
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  variants: { nodes: Variant[] };
};

const PRODUCT_FIELDS = `
  id handle title description availableForSale
  featuredImage { url altText width height }
  options { name optionValues { name } }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  variants(first: 50) { nodes { id title availableForSale price { amount currencyCode } selectedOptions { name value } } }
`;

export async function getProducts(): Promise<Product[]> {
  const data = await storefront<{ products: { nodes: Product[] } }>(
    `{ products(first: 50, sortKey: CREATED_AT) { nodes { ${PRODUCT_FIELDS} } } }`,
  );
  return data.products.nodes;
}

export const euro = (m: Money | string) => {
  const n = typeof m === 'string' ? Number(m) : Number(m.amount);
  return `€${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')}`;
};
