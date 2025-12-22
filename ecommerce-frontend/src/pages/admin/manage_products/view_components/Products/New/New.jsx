import React, { useMemo, useRef, useState } from 'react'
import './New.css'
import { useNavigate } from 'react-router-dom'
import { X, Image as ImageIcon, Loader } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import useFetchCategoryNames from '../../../../../../hooks/useFetchCategoryNames.js'
import useCreateProduct from '../../../../../../hooks/admin_dashboard/products/useCreateProduct.js'
import useUploadProductImages from '../../../../../../hooks/admin_dashboard/products/useUploadProductImages.js'
import UploadImages from './UploadImages.jsx'
import ErrorModal from '../../../../../../components/modals/ErrorModal.jsx'

export default function New() {
  const navigate = useNavigate()
  
  // State
  const [createdProductId, setCreatedProductId] = useState(null)
  const [showErrors, setShowErrors] = useState(false)
  const [errorModalMessage, setErrorModalMessage] = useState('')

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')

  const { categories: allCategories, loading: categoriesLoading, error: categoriesError } = useFetchCategoryNames({ page: 1, limit: 100 })

  // Details fields
  const [material, setMaterial] = useState('')
  const [features, setFeatures] = useState([])
  const [newFeature, setNewFeature] = useState('')

  const [dimWidth, setDimWidth] = useState('')
  const [dimHeight, setDimHeight] = useState('')
  const [dimLength, setDimLength] = useState('')

  const [sustainabilityText, setSustainabilityText] = useState('')
  const [careNotesList, setCareNotesList] = useState([])
  const [newCareNote, setNewCareNote] = useState('')

  const [variants, setVariants] = useState([])
  const [sizes, setSizes] = useState([])
  const [newSize, setNewSize] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [newVariantName, setNewVariantName] = useState('')
  const [newVariantHex, setNewVariantHex] = useState('#5f9ae2')
  const DEFAULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2XL']

  // Image handling: Single thumbnail only
  const [primaryImageUrl, setPrimaryImageUrl] = useState('')
  const [queuedFiles, setQueuedFiles] = useState([])
  const [pending, setPending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const uploadInputRef = useRef(null)
  const colorScrollRef = useRef(null)

  const { create, pending: createPending } = useCreateProduct()
  const { upload: uploadProductImages } = useUploadProductImages()

  // Parsed values
  const parsedDetails = useMemo(() => {
    const m = material.trim()
    const f = features.filter(x => x && x.trim())
    if (!m && !f.length) return null
    return {
      material: m,
      features: f.map(x => x.trim())
    }
  }, [material, features])

  const parsedDimensions = useMemo(() => {
    const w = dimWidth.trim()
    const h = dimHeight.trim()
    const l = dimLength.trim()
    if (!w && !h && !l) return null
    return { width: w, height: h, length: l }
  }, [dimWidth, dimHeight, dimLength])

  const parsedSustainability = useMemo(() => {
    if (!sustainabilityText.trim()) return null
    return { description: sustainabilityText.trim() }
  }, [sustainabilityText])

  const DEFAULT_SIZE_CHART_CM = {
    'XS': '26 cm',
    'S': '28 cm',
    'M': '30 cm',
    'L': '32 cm',
    'XL': '34 cm',
    '2XL': '36 cm',
  }

  // Handlers
  const onRemoveSize = (idx) => {
    setSizes(sizes.filter((_, i) => i !== idx))
  }

  const onAddSize = () => {
    const s = (newSize || '').trim()
    if (!s) return
    setSizes([...sizes, s])
    setNewSize('')
  }
  const onToggleSize = (s) => {
    const exists = sizes.includes(s)
    setSizes(exists ? sizes.filter((x) => x !== s) : [...sizes, s])
  }

  const onAddFeature = () => {
    const val = newFeature.trim()
    if (!val) return
    setFeatures([...features, val])
    setNewFeature('')
  }

  const onRemoveFeature = (idx) => {
    setFeatures(features.filter((_, i) => i !== idx))
  }

  const onAddCareNote = () => {
    const val = newCareNote.trim()
    if (!val) return
    setCareNotesList([...careNotesList, val])
    setNewCareNote('')
  }

  const onRemoveCareNote = (idx) => {
    setCareNotesList(careNotesList.filter((_, i) => i !== idx))
  }

  const onAddVariant = () => {
    setVariants([...variants, { name: '', hex: '#000000' }])
  }

  const onRemoveVariant = (idx) => {
    setVariants(variants.filter((_, i) => i !== idx))
  }

  const onChangeVariantName = (idx, value) => {
    const next = [...variants]
    next[idx] = { ...next[idx], name: value }
    setVariants(next)
  }

  const onChangeVariantHex = (idx, value) => {
    const next = [...variants]
    next[idx] = { ...next[idx], hex: value }
    setVariants(next)
  }

  const onAddVariantManual = () => {
    const name = (newVariantName || '').trim()
    const hex = (newVariantHex || '').trim()
    if (!name && !hex) return
    setVariants([{ name, hex: hex || '#000000' }, ...variants])
    setNewVariantName('')
    setNewVariantHex('#000000')
  }

  // Single Image Handler
  const onUploadImages = (files) => {
    if (!files?.length) return
    const file = files[0]
    
    // Revoke previous URL if exists
    if (primaryImageUrl) {
      try { URL.revokeObjectURL(primaryImageUrl) } catch {}
    }

    const url = URL.createObjectURL(file)
    setPrimaryImageUrl(url)
    setQueuedFiles([file]) // Always replace with single file
    
    if (uploadInputRef?.current) uploadInputRef.current.value = ''
  }

  const onDeleteImage = () => {
    if (primaryImageUrl) {
      try { URL.revokeObjectURL(primaryImageUrl) } catch {}
    }
    setPrimaryImageUrl('')
    setQueuedFiles([])
    if (uploadInputRef?.current) uploadInputRef.current.value = ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setShowErrors(true)

    // Validations
    if (!name.trim()) return
    if (name.length > 50) return
    if (shortDescription.length > 250) return
    if (!categoryId) return
    if (price === '') return
    if (stock === '') return
    
    // Image validation
    if (!queuedFiles.length) {
      setErrorModalMessage('Image file is required')
      return
    }

    setPending(true)
    try {
      // 1. Construct Payload
      const payload = {}
      if (name.trim()) payload.name = name.trim()
      if (shortDescription.trim()) payload.description = shortDescription.trim()
      if (price !== '') payload.price = parseFloat(price)
      if (stock !== '') payload.stock = parseInt(stock, 10)
      if (categoryId !== '') payload.category_id = parseInt(categoryId, 10)
      
      if (parsedDetails) payload.details = parsedDetails
      const dimsObj = parsedDimensions || {}
      if (sizes && sizes.length) {
        const chart = {}
        sizes.forEach((s) => {
          const key = String(s).toUpperCase()
          const val = DEFAULT_SIZE_CHART_CM[key] || null
          if (val) chart[s] = val
        })
        if (Object.keys(chart).length) dimsObj.size_chart = chart
      }
      if (Object.keys(dimsObj).length) payload.dimensions = dimsObj
      if (careNotesList && careNotesList.length) payload.care_notes = careNotesList.filter(Boolean)
      if (parsedSustainability) payload.sustainability_notes = parsedSustainability
      if (variants && variants.length) payload.color_variants = variants.filter((v) => v && (v.name || v.hex))

      // Attach image file for creation
      if (queuedFiles.length) {
        payload.image = queuedFiles[0]
      }

      console.log('[New] Creating product', { payload })

      // 2. Create Product
      const res = await create(payload)
      console.log('[New] Create response', res)
      
      const newId = res?.id || (res?.data && res.data.id) || res?.product?.id
      if (!newId) throw new Error('Product created but no ID returned')

      setCreatedProductId(newId)
    } catch (e) {
      console.error('[New] Create error', e)
      setErrorModalMessage('Failed to create product. Please try again.')
    } finally {
      setPending(false)
    }
  }

  if (createdProductId) {
    return <UploadImages productId={createdProductId} onComplete={() => navigate(-1)} />
  }

  const onCancel = () => {
    navigate(-1)
  }

  const preventDefaults = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const browse = (ref) => {
    if (ref?.current) ref.current.click()
  }

  const COLOR_SCROLL_STEP = 240
  const scrollColors = (px) => {
    if (!colorScrollRef?.current) return
    colorScrollRef.current.scrollBy({ left: px, behavior: 'smooth' })
  }

  return (
    <div className="admin__edit__page">
      <div className="admin__edit__header">
        <h1 className="admin__edit__title">New Product</h1>
        <p className="admin__edit__subtitle">
          Add a new product to your store. Fill all required fields.
        </p>
        <div className="admin__edit__header_actions">
          <button
            type="button"
            className="admin__edit__btn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin__edit__form"
            className="admin__edit__btn admin__edit__btn--update"
            disabled={pending || createPending}
          >
            {pending || createPending ? (
              <>
                <Loader size={16} className="btn-spinner" />
                Creating…
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
      <form id="admin__edit__form" className="admin__edit__form" onSubmit={onSubmit}>
          <div className="admin__edit__body">
          <div className="admin__edit__body_form">
            <div className="admin__edit__left">
              <div className="form-row form-row--dual">
                <div className="form-group">
                  <label className="form-label">Product Name{(showErrors && !name.trim()) && <span className="error-star">*</span>}</label>
                  <input
                    className={`form-control ${name.length > 50 ? 'is-invalid' : ''}`}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                  />
                  {name.length > 50 && <div className="admin__edit__error">Name too long</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Short Description</label>
                  <input
                    className={`form-control ${shortDescription.length > 250 ? 'is-invalid' : ''}`}
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Short description"
                  />
                  {shortDescription.length > 250 && <div className="admin__edit__error">Description too long</div>}
                </div>
                <div className="admin__edit__sublabel">Please keep these fields short</div>
              </div>

              <div className="form-group">
                <label className="form-label">Category{(showErrors && !categoryId) && <span className="error-star">*</span>}</label>
                <select
                  className={`form-select ${!categoryId ? 'is-invalid' : ''}`}
                  value={categoryId}
                  onChange={(e) => {
                    const val = e.target.value
                    setCategoryId(val)
                    const found = (Array.isArray(allCategories) ? allCategories : []).find((c) => String(c.id) === String(val))
                    setCategoryName(found?.name ?? '')
                  }}
                >
                  <option value="">Select category</option>
              {(() => {
                const list = Array.isArray(allCategories) ? allCategories : []
                return list.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.name || `Category #${c.id}`}
                  </option>
                ))
              })()}
                </select>
                {categoriesLoading ? <div className="category-hint">Loading categories…</div> : null}
                {categoriesError ? <div className="category-hint">Failed to load categories</div> : null}
                {!categoryId && <div className="admin__edit__error">Category is required. To assign a new category you will nee to add it first.</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Main Description</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={sustainabilityText}
                  onChange={(e) => setSustainabilityText(e.target.value)}
                  placeholder="Write a main description"
                />
                <div className="admin__edit__sublabel">Please do not exceed 250 characters</div>
              </div>
            </div>

            <div className="admin__edit__right">
              <div className="form-row">
                <label className="form-label">Product Thumbnail{(showErrors && !queuedFiles.length) && <span className="error-star">*</span>}</label>
                <div 
                  className="image-tile-single"
                  onClick={() => !primaryImageUrl && browse(uploadInputRef)}
                  onDragOver={preventDefaults}
                  onDrop={(e) => {
                    preventDefaults(e)
                    const fl = e.dataTransfer?.files
                    if (fl?.length) onUploadImages([fl[0]])
                  }}
                  style={{ 
                    width: '160px', 
                    height: '160px', 
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    display: 'grid',
                    placeItems: 'center',
                    position: 'relative',
                    cursor: primaryImageUrl ? 'default' : 'pointer'
                  }}
                >
                  {primaryImageUrl ? (
                    <>
                       <button
                          type="button"
                          className="image-remove"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteImage()
                          }}
                        >
                          <X size={14} />
                        </button>
                        <img src={primaryImageUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </>
                  ) : (
                    <div className="image-placeholder">
                      <ImageIcon size={20} />
                      <span>Click to upload thumbnail</span>
                    </div>
                  )}
                  
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const fl = e.target.files
                      if (fl?.length) onUploadImages([fl[0]])
                    }}
                  />
                </div>
                <div className="admin__edit__sublabel">
                  This image will be used as the main thumbnail for the product lists.
                </div>
              </div>

              <div className="form-row form-row--dual">
                <div className="form-group">
                  <label className="form-label">Price{(showErrors && price === '') && <span className="error-star">*</span>}</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                  />
                  <div className="admin__edit__sublabel">Use numeric value, e.g. 49.99</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Stock{(showErrors && stock === '') && <span className="error-star">*</span>}</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="Enter stock quantity"
                  />
                  <div className="admin__edit__sublabel">Units available in inventory</div>
                </div>
              </div>
            </div>
            <div className="form-row form-row--dual admin__edit__fullrow">
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
                  Selected sizes are: {Array.isArray(sizes) && sizes.length ? sizes.join(', ') : 'none'}
                </div>
              </div>
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
                          const v = e.target.value.trim()
                          const next = v.startsWith('#') ? v : `#${v}`
                          setNewVariantHex(next)
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
                      <span className="color-controls__hint">Use these controls to view more colors.</span>
                      <div className="color-controls__buttons">
                        <button type="button" className="color-btn" onClick={() => scrollColors(-COLOR_SCROLL_STEP)}>Prev</button>
                        <button type="button" className="color-btn" onClick={() => scrollColors(COLOR_SCROLL_STEP)}>Next</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row form-row--dual admin__edit__fullrow">
              <div className="form-group">
                <label className="form-label">Material</label>
                <div className="selector-row" style={{ marginBottom: '10px' }}>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. Cotton"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                  />
                </div>
                <label className="form-label features-label">Features</label>
                <div className="selector-row">
                  <input
                    type="text"
                    className="form-control features-input"
                    placeholder="Feature value (e.g. Waterproof)"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddFeature())}
                  />
                  <button type="button" className="btn-add-note" onClick={onAddFeature}>Add</button>
                </div>
                
                <div className="features-list-container">
                  <div className="admin__edit__sublabel">
                    <span className="features-list-prefix">Selected features: </span>
                    {features.length > 0 ? (
                      features.map((f, idx) => (
                        <span 
                          key={idx} 
                          className="feature-text-item"
                          onClick={() => onRemoveFeature(idx)}
                          title="Click to remove"
                        >
                          {f}{idx < features.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    ) : (
                      <span className="features-list-none">None</span>
                    )}
                  </div>
                  <div className="admin__edit__sublabel">Click an added feature to remove it.</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dimensions</label>
                <div className="dimensions-inputs">
                  <div className="selector-row">
                    <span style={{ fontSize: '0.85rem', width: '50px' }}>Width:</span>
                    <input
                      className="form-control"
                      style={{ flex: 1 }}
                      type="text"
                      placeholder="e.g. 5cm"
                      value={dimWidth}
                      onChange={(e) => setDimWidth(e.target.value)}
                    />
                  </div>
                  <div className="selector-row">
                    <span style={{ fontSize: '0.85rem', width: '50px' }}>Height:</span>
                    <input
                      className="form-control"
                      style={{ flex: 1 }}
                      type="text"
                      placeholder="e.g. 2cm"
                      value={dimHeight}
                      onChange={(e) => setDimHeight(e.target.value)}
                    />
                  </div>
                  <div className="selector-row">
                    <span style={{ fontSize: '0.85rem', width: '50px' }}>Length:</span>
                    <input
                      className="form-control"
                      style={{ flex: 1 }}
                      type="text"
                      placeholder="e.g. 10cm"
                      value={dimLength}
                      onChange={(e) => setDimLength(e.target.value)}
                    />
                  </div>
                </div>
                <div className="admin__edit__sublabel">Include size chart in Sizes above</div>
              </div>
            </div>
            <div className="form-group admin__edit__fullrow">
              <label className="form-label">Care Notes</label>
              <div className="selector-row">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Machine wash cold"
                  value={newCareNote}
                  onChange={(e) => setNewCareNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddCareNote())}
                />
                <button type="button" className="btn-add-note" onClick={onAddCareNote}>Add</button>
              </div>

              <div className="features-list-container">
                <div className="admin__edit__sublabel">
                  <span className="features-list-prefix">Selected notes: </span>
                  {careNotesList.length > 0 ? (
                    careNotesList.map((n, idx) => (
                      <span 
                        key={idx} 
                        className="feature-text-item"
                        onClick={() => onRemoveCareNote(idx)}
                        title="Click to remove"
                      >
                        {n}{idx < careNotesList.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  ) : (
                    <span className="features-list-none">None</span>
                  )}
                </div>
                <div className="admin__edit__sublabel">Click an added note to remove it.</div>
              </div>
            </div>
          </div>
        </div>
      </form>
      {errorModalMessage && (
        <ErrorModal
          message={errorModalMessage}
          onClose={() => setErrorModalMessage('')}
        />
      )}
    </div>
  )
}
