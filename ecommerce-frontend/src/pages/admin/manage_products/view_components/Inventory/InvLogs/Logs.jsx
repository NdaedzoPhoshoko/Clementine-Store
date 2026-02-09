import React, { useState } from 'react';
import './Logs.css'; // Styles for the logs table
import useFetchInventoryLogs from '../../../../../../hooks/admin_dashboard/inventory/useFetchInventoryLogs.js';
import useManageProducts from '../../../ManageProductsContext.jsx';

export default function Logs() {
  const { 
    query, 
    logChangeType, 
    logSource, 
    logStartDate, 
    logEndDate 
  } = useManageProducts();

  const [expandedId, setExpandedId] = useState(null);

  const { logs, loading, error, meta, setPage: setHookPage, page } = useFetchInventoryLogs({
    initialPage: 1,
    limit: 20,
    productId: query ? query : undefined,
    changeType: logChangeType || undefined,
    source: logSource || undefined,
    startDate: logStartDate || undefined,
    endDate: logEndDate || undefined,
  });

  const handlePageChange = (newPage) => {
    setHookPage(newPage);
    setExpandedId(null); // Close expanded row on page change
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  return (
    <div className="admin__edit__page">
      <div className="admin__edit__header">
        <h2 className="admin__edit__title">Inventory Logs</h2>
        <p className="admin__edit__subtitle">Review stock changes across products.</p>
      </div>
      
      {/* Filters are now in InnerSidebar */}

      <div className="admin__edit__body">
        <div className="logs__table">
          <div className="logs__row logs__row--header">
            <div className="logs__cell">Product</div>
            <div className="logs__cell">Change</div>
            <div className="logs__cell">Qty</div>
            <div className="logs__cell">Stock</div>
            <div className="logs__cell">Source</div>
            <div className="logs__cell">User</div>
            <div className="logs__cell">Date</div>
            <div className="logs__cell logs__cell--action"></div>
          </div>
          
          {loading ? (
            <div className="logs__empty">Loading logs...</div>
          ) : error ? (
            <div className="logs__empty">Error loading logs</div>
          ) : logs.length === 0 ? (
            <div className="logs__empty">No logs match your filters</div>
          ) : (
            logs.map((it) => (
              <React.Fragment key={it.id}>
                <div 
                  className={`logs__row ${expandedId === it.id ? 'logs__row--expanded' : ''}`}
                  onClick={() => toggleExpand(it.id)}
                >
                  <div className="logs__cell">
                    <div className="logs__prod_name">{it.product_name || `Product #${it.product_id}`}</div>
                    <div className="logs__prod_meta">ID: {it.product_id}</div>
                  </div>
                  <div className="logs__cell">
                    <span className={`logs__badge logs__badge--${String(it.change_type || 'adjustment').toLowerCase()}`}>
                      {it.change_type}
                    </span>
                  </div>
                  <div className="logs__cell">
                    <span className={`logs__qty ${it.quantity_changed < 0 ? 'is-negative' : 'is-positive'}`}>
                      {it.quantity_changed > 0 ? '+' : ''}{it.quantity_changed}
                    </span>
                  </div>
                  <div className="logs__cell">
                    <div className="logs__stock_flow">
                      <span className="logs__stock_prev">{it.previous_stock}</span>
                      <span className="logs__stock_arrow">→</span>
                      <span className="logs__stock_new">{it.new_stock}</span>
                    </div>
                  </div>
                  <div className="logs__cell">
                    <span className="logs__source">{it.source}</span>
                  </div>
                  <div className="logs__cell">
                    <span className="logs__user">{it.actor_name || (it.actor_user_id ? `#${it.actor_user_id}` : '—')}</span>
                  </div>
                  <div className="logs__cell">{formatDate(it.created_at)}</div>
                  <div className="logs__cell logs__cell--action">
                     <span className="logs__chevron">{expandedId === it.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandedId === it.id && (
                  <div className="logs__details">
                    <div className="logs__details_grid">
                      <div className="logs__detail_item">
                        <span className="logs__detail_label">Reason</span>
                        <span className="logs__detail_value">{it.reason || '—'}</span>
                      </div>
                      <div className="logs__detail_item">
                        <span className="logs__detail_label">Note</span>
                        <span className="logs__detail_value">{it.note || '—'}</span>
                      </div>
                      <div className="logs__detail_item">
                        <span className="logs__detail_label">Variant</span>
                        <span className="logs__detail_value">
                          {it.size && <span>Size: {it.size} </span>}
                          {it.color_hex && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              Color: <span style={{ width: '12px', height: '12px', background: it.color_hex, borderRadius: '50%', border: '1px solid #ddd' }}></span>
                            </span>
                          )}
                          {!it.size && !it.color_hex && 'Base Product'}
                        </span>
                      </div>
                      <div className="logs__detail_item">
                        <span className="logs__detail_label">Reference</span>
                        <span className="logs__detail_value">
                           {it.order_id ? `Order #${it.order_id}` : (it.cart_item_id ? `Cart Item #${it.cart_item_id}` : '—')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>
        
        {meta && (
          <div className="logs__pagination">
             <div className="logs__pagination_info">
                Page {meta.page} of {meta.pages || 1}
             </div>
             <div className="logs__pagination_controls">
                <button 
                  className="logs__pagination_btn"
                  disabled={!meta.hasPrev}
                  onClick={() => handlePageChange(meta.page - 1)}
                >
                  Prev
                </button>
                <button 
                  className="logs__pagination_btn"
                  disabled={!meta.hasNext}
                  onClick={() => handlePageChange(meta.page + 1)}
                >
                  Next
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
