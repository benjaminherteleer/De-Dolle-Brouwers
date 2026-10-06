/**
 * Browser-side cart on the Shopify Storefront API. The cart id is kept in localStorage;
 * every change fires a `cart:change` event so the drawer and nav button can redraw.
 */
import { storefront, type Money } from './shopify';

export type CartLine = {
  id: string;
  quantity: number;
  attributes: { key: string; value: string }[];
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    image: { url: string; altText: string | null } | null;
    product: { title: string; handle: string };
  };
};
export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: { nodes: CartLine[] };
};

const KEY = 'ddb-cart';
const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 50) { nodes {
    id quantity attributes { key value }
    cost { totalAmount { amount currencyCode } }
    merchandise { ... on ProductVariant { id title image { url altText } product { title handle } } }
  } }
`;

let current: Cart | null = null;

const storedId = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const store = (cart: Cart | null) => {
  current = cart;
  try {
    if (cart) localStorage.setItem(KEY, cart.id);
    else localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent('cart:change', { detail: cart }));
  return cart;
};

export async function loadCart(): Promise<Cart | null> {
  const id = storedId();
  if (!id) return store(null);
  try {
    const data = await storefront<{ cart: Cart | null }>(`query ($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id });
    // A cart that went through checkout comes back empty or not at all
    return store(data.cart && data.cart.totalQuantity > 0 ? data.cart : null);
  } catch {
    return store(null);
  }
}

type Errors = { userErrors: { message: string }[] };
const check = <T extends Errors>(r: T) => {
  if (r.userErrors.length) throw new Error(r.userErrors.map((e) => e.message).join('; '));
  return r;
};

export async function addToCart(variantId: string, quantity = 1, attributes: { key: string; value: string }[] = []) {
  const line = { merchandiseId: variantId, quantity, attributes };
  if (current?.id || storedId()) {
    const cartId = current?.id || storedId();
    try {
      const data = await storefront<{ cartLinesAdd: Errors & { cart: Cart } }>(
        `mutation ($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`,
        { cartId, lines: [line] },
      );
      return store(check(data.cartLinesAdd).cart);
    } catch {
      // The stored cart may have expired; start a new one below.
    }
  }
  const data = await storefront<{ cartCreate: Errors & { cart: Cart } }>(
    `mutation ($input: CartInput!) { cartCreate(input: $input) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    { input: { lines: [line] } },
  );
  return store(check(data.cartCreate).cart);
}

export async function setQuantity(lineId: string, quantity: number) {
  if (!current) return null;
  const data =
    quantity > 0
      ? (
          await storefront<{ cartLinesUpdate: Errors & { cart: Cart } }>(
            `mutation ($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`,
            { cartId: current.id, lines: [{ id: lineId, quantity }] },
          )
        ).cartLinesUpdate
      : (
          await storefront<{ cartLinesRemove: Errors & { cart: Cart } }>(
            `mutation ($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { message } } }`,
            { cartId: current.id, lineIds: [lineId] },
          )
        ).cartLinesRemove;
  const cart = check(data).cart;
  return store(cart.totalQuantity > 0 ? cart : null);
}

export const getCart = () => current;
export const openCart = () => window.dispatchEvent(new CustomEvent('cart:open'));
