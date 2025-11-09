import './CartListItem.css';

const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));
const formatPrice = (v) => {
  const n = toNumber(v);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const isHexColor = (hex) => typeof hex === 'string' && /^#?[0-9A-Fa-f]{3,8}$/.test(hex);

export default function CartListItem({ item = {} }) {
  const {
    image_url,
    name,
    description,
    price,
    quantity,
    stock,
    size,
    color_hex,
  } = item;

  const colorValue = isHexColor(color_hex) ? (color_hex.startsWith('#') ? color_hex : `#${color_hex}`) : '';
  const inStock = Number(stock) > 0;

  return (
    <div className="cart-item" role="listitem" aria-label={String(name || 'Item')}> 
      <div className="cart-item__media">
        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
        <img
          src={typeof image_url === 'string' ? image_url.trim().replace(/^`|`$/g, '') : ''}
          alt={String(name || 'Product image')}
          className="cart-item__image"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="cart-item__content">
        <div className="cart-item__title" title={name || ''}>{name || ''}</div>
        <div className="cart-item__desc" title={description || ''}>{description || ''}</div>

        <div className="cart-item__variants">
          <span className="variant variant--size" aria-label="Selected size">Size: {size || '—'}</span>
          <span className="variant variant--color" aria-label="Selected color">
            Color:
            <span
              className="color-swatch"
              style={{ backgroundColor: colorValue || 'transparent', borderColor: colorValue ? 'transparent' : 'var(--color-border)' }}
              aria-hidden="true"
            />
            <span className="color-code">{colorValue || '—'}</span>
          </span>
        </div>
      </div>

      <div className="cart-item__aside">
        <div className="price">R{formatPrice(price)}</div>
        <div className={inStock ? 'stock stock--in' : 'stock stock--out'}>
          {inStock ? 'In stock' : 'Out of stock'}
        </div>
        <div className="qty">Qty: {Number(quantity || 0)}</div>
      </div>
    </div>
  );
}