import React, { useMemo, useRef, useState } from 'react';
import './Stock.css';
import useFetchBrowseProducts from '../../../../../../hooks/useFetchBrowseProducts.js';
import AdminProdGrid from '../../../../../../components/admin_manage_products/admin_product_grid/AdminProdGrid.jsx';
import { motion } from 'framer-motion';
import PaginationBar from '../../../../../../components/pagination/PaginationBar.jsx';
import useManageProducts from '../../../ManageProductsContext.jsx';
import { HexColorPicker } from 'react-colorful';

export default function Stock() {
  const { query } = useManageProducts();
  const { page, setPage, pageItems, loading, loadingMore, meta, hasMore } = useFetchBrowseProducts({
    initialPage: 1,
    limit: 12,
    enabled: true,
    search: query,
  });
  const displayProducts = React.useMemo(() => {
    const arr = Array.isArray(pageItems) ? pageItems : [];
    return arr.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image_url,
      rating: typeof p.average_rating === 'number' ? p.average_rating : 0,
      reviewCount: typeof p.review_count === 'number' ? p.review_count : 0,
    }));
  }, [pageItems]);
  const [gridDocked, setGridDocked] = useState(false);
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [changeType, setChangeType] = useState('ADJUSTMENT');
  const [sizes, setSizes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantHex, setNewVariantHex] = useState('#5f9ae2');
  const DEFAULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
  const [source, setSource] = useState('manual');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const initialValuesRef = useRef(null);
  const colorScrollRef = useRef(null);
  const COLOR_SCROLL_STEP = 160;
  const scrollColors = (delta) => {
    const el = colorScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const parsedCurrent = useMemo(() => {
    const n = parseInt(currentStock, 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, [currentStock]);
  const parsedQty = useMemo(() => {
    const n = parseInt(quantity, 10);
    return Number.isFinite(n) ? n : 0;
  }, [quantity]);
  const previewNew = useMemo(() => Math.max(0, parsedCurrent + parsedQty), [parsedCurrent, parsedQty]);
  const onToggleSize = (s) => {
    const exists = sizes.includes(s);
    setSizes(exists ? sizes.filter((x) => x !== s) : [...sizes, s]);
  };
  const normalizeHex = (h) => {
    const v = (h || '').trim();
    if (!v) return '';
    return v.startsWith('#') ? v : `#${v}`;
  };
  const handleSave = () => {
    const pid = parseInt(productId, 10);
    const qty = parsedQty;
    if (!pid || !Number.isInteger(qty) || qty === 0) return;
    const base = {
      product_id: pid,
      quantity_changed: qty,
      change_type: changeType,
      source,
      reason: (reason || '').trim(),
      note: (note || '').trim(),
    };
    const variantHexes = (Array.isArray(variants) ? variants : []).map((v) => normalizeHex(v?.hex));
    const sizeList = Array.isArray(sizes) ? sizes : [];
    const payloads = [];
    if (!sizeList.length && !variantHexes.length) {
      payloads.push({ ...base, size: '', color_hex: '' });
    } else if (sizeList.length && !variantHexes.length) {
      sizeList.forEach((s) => payloads.push({ ...base, size: s, color_hex: '' }));
    } else if (!sizeList.length && variantHexes.length) {
      variantHexes.forEach((hex) => payloads.push({ ...base, size: '', color_hex: hex }));
    } else {
      sizeList.forEach((s) => {
        variantHexes.forEach((hex) => {
          payloads.push({ ...base, size: s, color_hex: hex });
        });
      });
    }
    try {
      // Placeholder to visualize payloads; integration intentionally not implemented yet
      console.log('Inventory Adjust Payloads', payloads);
    } catch (_) {}
  };
  const onAddVariantManual = () => {
    const name = (newVariantName || '').trim();
    const hexRaw = (newVariantHex || '').trim();
    const hex = hexRaw ? (hexRaw.startsWith('#') ? hexRaw : `#${hexRaw}`) : '#000000';
    if (!name && !hex) return;
    setVariants([{ name, hex }, ...variants]);
    setNewVariantName('');
    setNewVariantHex('#000000');
  };
  const onRemoveVariant = (idx) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const onSelectProduct = (id) => {
    if (!id) return;
    const foundRaw = (Array.isArray(pageItems) ? pageItems : []).find((p) => p.id === id);
    setProductId(String(id));
    setProductName(foundRaw?.name || '');
    setCurrentStock(foundRaw?.stock != null ? String(foundRaw.stock) : '');
    setGridDocked(true);
    const baseline = {
      currentStock: foundRaw?.stock != null ? String(foundRaw.stock) : '',
      quantity: '',
      changeType: 'ADJUSTMENT',
      sizes: [],
      variants: [],
      newVariantName: '',
      newVariantHex: '#5f9ae2',
      source: 'manual',
      reason: '',
      note: '',
    };
    initialValuesRef.current = baseline;
    setQuantity(baseline.quantity);
    setChangeType(baseline.changeType);
    setSizes(baseline.sizes);
    setVariants(baseline.variants);
    setNewVariantName(baseline.newVariantName);
    setNewVariantHex(baseline.newVariantHex);
    setSource(baseline.source);
    setReason(baseline.reason);
    setNote(baseline.note);
  };
  return (
    <div className="admin__edit__page">
      <div className="admin__edit__header">
        <h2 className="admin__edit__title">Adjust Stock</h2>
        <p className="admin__edit__subtitle">Record stock changes with variant, source and context. This does not submit data.</p>
      </div>
      <div className="admin__edit__body">
        <div className="admin__edit__body_form">
          <motion.div layout className={gridDocked ? 'admin__edit__left' : 'admin__edit__fullrow'}>
            <AdminProdGrid products={displayProducts} loading={loading || loadingMore} onEdit={onSelectProduct} />
            <PaginationBar
              page={page}
              totalPages={meta?.pages || 1}
              hasPrev={typeof meta?.hasPrev !== 'undefined' ? !!meta?.hasPrev : page > 1}
              hasNext={typeof meta?.hasNext !== 'undefined' ? !!meta?.hasNext : !!hasMore}
              onPageChange={(n) => {
                const target = Number(n);
                if (!Number.isFinite(target)) return;
                if (target < 1 || target === page) return;
                setPage(target);
              }}
            />
          </motion.div>
          {gridDocked && (
          <div className="admin__edit__right">
            <div className="adjust__product_title">Adjusting Stock - {productName || (productId ? `Product #${productId}` : '')}</div>
            <div className="adjust__topbar">
              <button
                type="button"
                className="preview-btn preview-btn--secondary"
                aria-label="Cancel adjustment"
                onClick={() => setGridDocked(false)}
              >
                Cancel
              </button>
            </div>
            <div className="form-row form-row--dual">
              <div className="form-group">
                <label className="admin__edit__sublabel">Current Stock</label>
                <input
                  type="number"
                  className="form-control"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  placeholder="e.g. 120"
                  aria-label="Current stock"
                />
              </div>
              <div className="form-group">
                <label className="admin__edit__sublabel">Quantity Change</label>
                <input
                  type="number"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. -5 or 20"
                  aria-label="Quantity change"
                />
              </div>
            </div>
            <div className="form-row form-row--dual">
              <div className="form-group">
                <label className="admin__edit__sublabel">Change Type</label>
                <select
                  className="form-select"
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                  aria-label="Change type"
                >
                  <option value="SALE">SALE</option>
                  <option value="RESTOCK">RESTOCK</option>
                  <option value="RETURN">RETURN</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                  <option value="CANCELLATION">CANCELLATION</option>
                  <option value="RESERVATION">RESERVATION</option>
                  <option value="UNRESERVATION">UNRESERVATION</option>
                </select>
              </div>
              <div className="form-group">
                <label className="admin__edit__sublabel">Source</label>
                <select
                  className="form-select"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  aria-label="Source"
                >
                  <option value="order">order</option>
                  <option value="return">return</option>
                  <option value="manual">manual</option>
                  <option value="adjustment">adjustment</option>
                  <option value="system">system</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Colors</label>
                <div className="color-picker-row">
                  <div className="color-picker">
                    <HexColorPicker color={newVariantHex} onChange={setNewVariantHex} />
                  </div>
                  <div className="color-fields">
                    <div className="selector-row">
                      <div className="color-preview" style={{ backgroundColor: newVariantHex }} />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="#rrggbb"
                        value={newVariantHex}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          const next = v.startsWith('#') ? v : `#${v}`;
                          setNewVariantHex(next);
                        }}
                      />
                    </div>
                    <div className="selector-row selector-row--color-name">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Color name"
                        value={newVariantName}
                        onChange={(e) => setNewVariantName(e.target.value)}
                      />
                      <button type="button" className="btn-add-color" onClick={onAddVariantManual}>Add Color</button>
                    </div>
                    <div className="admin__edit__sublabel">Selected colors are:</div>
                    <div className="color-chip-grid" ref={colorScrollRef}>
                      {Array.isArray(variants) && variants.length ? (
                        variants.map((v, idx) => (
                          <span
                            key={idx}
                            className="color-chip clickable-chip"
                            onClick={() => onRemoveVariant(idx)}
                            title="Click to remove"
                          >
                            <span className="color-chip-swatch" style={{ backgroundColor: v?.hex || '#000000' }} />
                            {v?.name || v?.hex || 'Unnamed'}
                          </span>
                        ))
                      ) : (
                        <span className="admin__edit__sublabel">none</span>
                      )}
                    </div>
                    <div className="color-controls">
                      <span className="color-controls__hint">Slide to view added colors.</span>
                      <div className="color-controls__buttons">
                        <button type="button" className="color-btn" onClick={() => scrollColors(-COLOR_SCROLL_STEP)}>Prev</button>
                        <button type="button" className="color-btn" onClick={() => scrollColors(COLOR_SCROLL_STEP)}>Next</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sizes</label>
                <div className="size-palette">
                  {DEFAULT_SIZE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={sizes.includes(s) ? 'size-tile is-selected' : 'size-tile'}
                      onClick={() => onToggleSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="admin__edit__sublabel">
                  Selected sizes to add are: {Array.isArray(sizes) && sizes.length ? sizes.join(', ') : 'none'}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="admin__edit__sublabel">Reason</label>
              <input
                type="text"
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Short explanation"
                aria-label="Reason"
              />
            </div>
            <div className="form-group">
              <label className="admin__edit__sublabel">Note</label>
              <textarea
                className="form-control"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional details"
                aria-label="Note"
              />
            </div>
            <div className="preview-card">
              <div className="preview-card__title">Preview</div>
              <div className="preview-grid">
                <div className="preview-item">
                  <div className="preview-label">Previous Stock</div>
                  <div className="preview-value">{parsedCurrent}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Quantity Change</div>
                  <div className="preview-value">{parsedQty}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">New Stock</div>
                  <div className="preview-value">{previewNew}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Change Type</div>
                  <div className="preview-value">{changeType}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Source</div>
                  <div className="preview-value">{source}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Sizes</div>
                  <div className="preview-value">{Array.isArray(sizes) && sizes.length ? sizes.join(', ') : 'none'}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Colors</div>
                  <div className="preview-value">
                    {Array.isArray(variants) && variants.length ? (
                      <div className="preview-color-chip-grid">
                        {variants.map((v, idx) => (
                          <span key={idx} className="color-chip">
                            <span className="color-chip-swatch" style={{ backgroundColor: v?.hex || '#000000' }} />
                            {v?.name || 'Unnamed'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      'none'
                    )}
                  </div>
                </div>
                <div className="preview-item preview-item--full">
                  <div className="preview-label">Reason</div>
                  <div className="preview-value">{reason || '—'}</div>
                </div>
                <div className="preview-item preview-item--full">
                  <div className="preview-label">Note</div>
                  <div className="preview-value">{note || '—'}</div>
                </div>
              </div>
              <div className="preview-actions">
                <button type="button" className="preview-btn" aria-label="Save adjustment" onClick={handleSave}>Save Adjustment</button>
                <button
                  type="button"
                  className="preview-btn preview-btn--secondary"
                  aria-label="Reset fields"
                  onClick={() => {
                    const baseline = initialValuesRef.current;
                    if (!baseline) return;
                    setCurrentStock(baseline.currentStock);
                    setQuantity(baseline.quantity);
                    setChangeType(baseline.changeType);
                    setSizes(baseline.sizes);
                    setVariants(baseline.variants);
                    setNewVariantName(baseline.newVariantName);
                    setNewVariantHex(baseline.newVariantHex);
                    setSource(baseline.source);
                    setReason(baseline.reason);
                    setNote(baseline.note);
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}
