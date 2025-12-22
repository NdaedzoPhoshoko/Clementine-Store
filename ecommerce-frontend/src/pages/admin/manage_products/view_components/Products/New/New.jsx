import React, { useMemo, useRef, useState } from 'react'
import './New.css'
import { useNavigate } from 'react-router-dom'
import { X, Image as ImageIcon, Loader } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import useFetchCategoryNames from '../../../../../../hooks/useFetchCategoryNames.js'
import useCreateProduct from '../../../../../../hooks/admin_dashboard/products/useCreateProduct.js'
import useUploadProductImages from '../../../../../../hooks/admin_dashboard/products/useUploadProductImages.js'

export default function New() {
  const navigate = useNavigate()
  
  // State
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
  const [newVariantHex, setNewVariantHex] = useState('#293b0c')
  const DEFAULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2XL']

  const [primaryImageUrl, setPrimaryImageUrl] = useState('')
  const [pending, setPending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const uploadInputRef = useRef(null)
  const [uploadedPreviews, setUploadedPreviews] = useState([])
  const [uploadedFilesMeta, setUploadedFilesMeta] = useState([])
  const [blobMetaByUrl, setBlobMetaByUrl] = useState({})
  const [queuedFiles, setQueuedFiles] = useState([])
  const [placeholderIndex, setPlaceholderIndex] = useState(null)
  const [replaceIndex, setReplaceIndex] = useState(null)
  const [localImages, setLocalImages] = useState([])
  const imagesScrollRef = useRef(null)
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
    XS: '26 cm',
    S: '28 cm',
    M: '30 cm',
    L: '32 cm',
    XL: '34 cm',
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

  // Image handling for New Product
  const onUploadImages = async (files, existingPreviews = null) => {
    if (!files?.length) return
    try {
      const all = Array.from(files)
      const newFiles = []
      const newPreviews = []

      all.forEach((f, i) => {
         const isDuplicate = uploadedFilesMeta.some((m) => m.name === f.name && m.size === f.size)
         if (!isDuplicate) {
           newFiles.push(f)
           if (existingPreviews && existingPreviews[i]) {
             newPreviews.push(existingPreviews[i])
           }
         }
      })

      if (!newFiles.length) return

      const urls = (existingPreviews && existingPreviews.length === all.length) 
        ? newPreviews 
        : newFiles.map((f) => URL.createObjectURL(f))

      setUploadedPreviews((prev) => [...prev, ...urls])
      
      setBlobMetaByUrl((prev) => {
        const next = { ...prev }
        urls.forEach((u, idx) => {
          const f = newFiles[idx]
          next[u] = { name: f.name, size: f.size }
        })
        return next
      })
      setQueuedFiles((prev) => [...prev, ...newFiles])
    } catch {}
    
    setUploadedFilesMeta((prev) => [
      ...prev,
      ...Array.from(files).map((f) => ({ name: f.name, size: f.size })),
    ])
    if (uploadInputRef?.current) uploadInputRef.current.value = ''
  }

  const onDeleteAllImages = async () => {
    // Just clear local state since no server images yet
    setLocalImages([])
    setQueuedFiles([])
    setUploadedFilesMeta([])
    setBlobMetaByUrl({})
    setPlaceholderIndex(null)
    setReplaceIndex(null)
    setPrimaryImageUrl('')
  }

  const isBlobUrl = (u) => typeof u === 'string' && u.startsWith('blob:')
  const revokeBlobUrls = (urls) => {
    try {
      urls.forEach((u) => {
        if (isBlobUrl(u)) {
          try { URL.revokeObjectURL(u) } catch {}
        }
      })
    } catch {}
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    // Validations
    if (!name.trim()) return
    if (name.length > 50) return
    if (shortDescription.length > 250) return
    if (!categoryId) return

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

      console.log('[New] Creating product', { payload })

      // 2. Create Product
      const res = await create(payload)
      console.log('[New] Create response', res)
      
      const newId = res?.id || (res?.data && res.data.id)
      if (!newId) throw new Error('Product created but no ID returned')

      // 3. Upload Images if any
      let finalPrimaryUrl = ''
      if (queuedFiles.length) {
        setUploading(true)
        try {
          const uploadResp = await uploadProductImages(newId, queuedFiles)
          const uploadedUrls = Array.isArray(uploadResp?.images)
            ? uploadResp.images.map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean)
            : []
            
          if (uploadedUrls.length > 0) {
             finalPrimaryUrl = uploadedUrls[0]
          }
        } finally {
          setUploading(false)
        }
      }

      navigate(-1)
    } catch (e) {
      console.error('[New] Create error', e)
    } finally {
      setPending(false)
    }
  }

  const onCancel = () => {
    navigate(-1)
  }

  const preventDefaults = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDropFiles = (e, insertIdx = null) => {
    preventDefaults(e)
    const fl = e.dataTransfer?.files
    if (!fl || !fl.length) return
    const files = Array.from(fl)
    
    // Create previews
    const previews = files.map(f => URL.createObjectURL(f))

    // Update UI
    setLocalImages((prev) => {
      const next = [...prev]
      const idx = insertIdx !== null ? Math.min(insertIdx, next.length) : next.length
      // Insert all previews at the index
      next.splice(idx, 0, ...previews)
      return next
    })
    
    onUploadImages(files, previews)
  }

  const browse = (ref) => {
    if (ref?.current) ref.current.click()
  }

  const tiles = useMemo(() => {
    const arr = [...localImages]
    const idx = placeholderIndex != null ? Math.min(placeholderIndex, arr.length) : arr.length
    arr.splice(idx, 0, '__placeholder__')
    return arr
  }, [localImages, placeholderIndex])

  const TILE_SIZE = 160
  const TILE_GAP = 12
  const scrollByTiles = (n) => {
    if (!imagesScrollRef?.current) return
    imagesScrollRef.current.scrollBy({ left: n * (TILE_SIZE + TILE_GAP), behavior: 'smooth' })
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
              'Create'
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
                  <label className="form-label">Product Name</label>
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
                <label className="form-label">Category</label>
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
                {!categoryId && <div className="admin__edit__error">Category is required</div>}
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
                <label className="form-label">Product Images</label>
                <div
                  className="images-scroll"
                  ref={imagesScrollRef}
                  onDragOver={preventDefaults}
                  onDrop={(e) => {
                    setReplaceIndex(null)
                    setPlaceholderIndex(localImages.length)
                    onDropFiles(e)
                  }}
                >
                  {(() => {
                    const firstImageIdx = tiles.findIndex((x) => x !== '__placeholder__')
                    return tiles.map((t, i) =>
                    t === '__placeholder__' ? (
                      <div
                        key={`ph-${i}`}
                        className="image-tile placeholder"
                        onClick={() => {
                          setReplaceIndex(null)
                          setPlaceholderIndex(i + 1)
                          browse(uploadInputRef)
                        }}
                        onDragOver={preventDefaults}
                        onDrop={(e) => {
                          setReplaceIndex(null)
                          setPlaceholderIndex(i + 1)
                          onDropFiles(e, i + 1)
                        }}
                      >
                        <div className="image-placeholder">
                          <ImageIcon size={20} />
                          <span>
                            Drop your images here, or select{' '}
                            <button
                              type="button"
                              className="image-browse-link"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPlaceholderIndex(i + 1)
                                browse(uploadInputRef)
                              }}
                            >
                              click to browse
                            </button>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={t + i}
                        className="image-tile has-image"
                        onClick={() => {
                          setReplaceIndex(i)
                          browse(uploadInputRef)
                        }}
                      >
                        {i === firstImageIdx && (
                          <button type="button" className="image-label" aria-label="Thumbnail">thumbnail</button>
                        )}
                        <button
                          type="button"
                          className="image-remove"
                          onClick={(e) => {
                            e.stopPropagation()
                            const imgUrl = t;
                            const nextImages = localImages.filter((_, idx) => idx !== i)
                            setLocalImages(nextImages)
                            revokeBlobUrls([imgUrl])

                            if (isBlobUrl(imgUrl)) {
                              const meta = blobMetaByUrl[imgUrl]
                              if (meta) {
                                setUploadedFilesMeta((prev) => prev.filter((m) => !(m.name === meta.name && m.size === meta.size)))
                                setBlobMetaByUrl((prev) => {
                                  const next = { ...prev }
                                  delete next[imgUrl]
                                  return next
                                })
                                setQueuedFiles(prev => prev.filter(f => !(f.name === meta.name && f.size === meta.size)))
                              }
                            }
                          }}
                        >
                          <X size={14} />
                        </button>
                        <img src={t} alt={`Image ${i + 1}`} />
                        <div className="image-overlay">
                          <span>Tap to replace</span>
                        </div>
                      </div>
                    )
                  )})()}
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const fl = e.target.files
                      if (!fl || !fl.length) return
                      const files = Array.from(fl)
                      let previews = []
                      try {
                        previews = files.map((f) => URL.createObjectURL(f))

                        setBlobMetaByUrl((prev) => {
                          const next = { ...prev }
                          previews.forEach((p, idx) => {
                            const f = files[idx]
                            next[p] = { name: f.name, size: f.size }
                          })
                          return next
                        })
                        setLocalImages((prev) => {
                          const next = [...prev]
                          if (replaceIndex != null && previews.length) {
                            next[replaceIndex] = previews[0]
                          } else {
                            let insertIdx = placeholderIndex != null ? Math.min(placeholderIndex, next.length) : next.length
                            previews.forEach((p) => {
                              next.splice(insertIdx, 0, p)
                              insertIdx += 1
                            })
                            setPlaceholderIndex(insertIdx)
                          }
                          return next
                        })
                        setQueuedFiles(prev => [...prev, ...files])
                      } catch {}
                    }}
                  />
                </div>
                <div className="images-controls">
                  <span className="images-controls__hint">Use these controls to view more images and attach more.</span>
                  <div className="images-controls__buttons">
                    <button type="button" className="images-btn" onClick={() => scrollByTiles(-3)}>Prev</button>
                    <button type="button" className="images-btn" onClick={() => scrollByTiles(3)}>Next</button>
                    <button
                      type="button"
                      className="images-btn"
                      onClick={onDeleteAllImages}
                    >
                      Delete All
                    </button>
                  </div>
                </div>
                <div className="admin__edit__sublabel">
                  You need to add at least 4 images. Pay attention to the quality of the pictures you add, comply with the background color standards. Pictures must be in certain dimensions. Notice that the product shows all the details. The image labeled "thumbnail" will be shown in product lists/grids.
                </div>
              </div>

            </div>
            <div className="form-row form-row--dual admin__edit__fullrow">
              <div className="form-group">
                <label className="form-label">Price</label>
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
                <label className="form-label">Stock</label>
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
    </div>
  )
}
