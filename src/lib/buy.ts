/**
 * Buy controls for any element with data-product (shop cards and product pages):
 * picks the variant from the option selects, marks sold-out values and adds to the cart.
 */
import { addToCart, openCart } from './cart';
import { storefront, euro, type Variant } from './shopify';

const cards = [...document.querySelectorAll<HTMLElement>('[data-product]')];

const update = (card: HTMLElement) => {
  const variants: Variant[] = JSON.parse(card.dataset.variants!);
  const chosen = Object.fromEntries(
    [...card.querySelectorAll<HTMLSelectElement>('select[data-option]')].map((s) => [s.dataset.option, s.value]),
  );
  const variant = variants.find((v) => v.selectedOptions.every((o) => o.name === 'Title' || chosen[o.name] === o.value));
  const button = card.querySelector<HTMLButtonElement>('[data-add]')!;
  button.disabled = !variant?.availableForSale;
  button.textContent = variant?.availableForSale ? 'In mandje' : 'Uitverkocht';
  if (variant && card.querySelector('select')) card.querySelector('[data-price]')!.textContent = euro(variant.price);
  // Mark sold-out values in single-option lists (sizes, designs)
  card.querySelectorAll<HTMLSelectElement>('select[data-option]').forEach((sel) => {
    [...sel.options].forEach((opt) => {
      const match = variants.filter((v) =>
        v.selectedOptions.every((o) => (o.name === sel.dataset.option ? o.value === opt.value : o.name === 'Title' || chosen[o.name] === o.value)),
      );
      const out = match.length > 0 && match.every((v) => !v.availableForSale);
      opt.textContent = out ? `${opt.value} (uitverkocht)` : opt.value;
    });
  });
  return variant;
};

cards.forEach((card) => {
  // Start on the first size that is still in stock
  const variants: Variant[] = JSON.parse(card.dataset.variants!);
  const first = variants.find((v) => v.availableForSale);
  first?.selectedOptions.forEach((o) => {
    const sel = card.querySelector<HTMLSelectElement>(`select[data-option="${o.name}"]`);
    if (sel) sel.value = o.value;
  });
  update(card);
  card.addEventListener('change', () => update(card));
  card.querySelector('[data-add]')!.addEventListener('click', async (e) => {
    const button = e.currentTarget as HTMLButtonElement;
    const variant = update(card);
    if (!variant?.availableForSale) return;
    button.disabled = true;
    button.textContent = 'Even…';
    try {
      await addToCart(variant.id);
      openCart();
    } catch {
      alert('Dat lukte niet. Probeer het straks nog eens.');
    }
    update(card);
  });
});

// Stock can change after the site was built: refresh availability live.
if (cards.length) {
  const handles = cards.map((c) => `handle:${c.dataset.product}`).join(' OR ');
  storefront<{ products: { nodes: { handle: string; variants: { nodes: Variant[] } }[] } }>(
    `query ($q: String!) { products(first: 50, query: $q) { nodes { handle variants(first: 50) { nodes { id title availableForSale price { amount currencyCode } selectedOptions { name value } } } } } }`,
    { q: handles },
  )
    .then((data) => {
      data.products.nodes.forEach((p) => {
        const card = cards.find((c) => c.dataset.product === p.handle);
        if (!card) return;
        card.dataset.variants = JSON.stringify(p.variants.nodes);
        update(card);
      });
    })
    .catch(() => {});
}
