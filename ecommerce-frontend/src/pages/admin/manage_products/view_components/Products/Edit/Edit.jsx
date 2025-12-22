import React, { useEffect, useMemo, useRef, useState } from 'react'
import './Edit.css'
import { useParams, useNavigate } from 'react-router-dom'
import useFetchProductDetails from '../../../../../../hooks/useFetchProductDetails'
import { Save, X, Upload, Image as ImageIcon, CheckCircle, Loader, Palette } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'

export default function Edit({ productId: propProductId }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const productId = propProductId ?? id
  const { product, category, images, details, dimensions, sizeChart, careNotes, sustainabilityNotes, colorVariants, loading, error } =
    useFetchProductDetails({ productId, enabled: true })

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [categoryId, setCategoryId] = useState('')

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
  const [placeholderIndex, setPlaceholderIndex] = useState(null)
  const [replaceIndex, setReplaceIndex] = useState(null)
  const [localImages, setLocalImages] = useState([])
  const imagesScrollRef = useRef(null)
  const colorScrollRef = useRef(null)

  useEffect(() => {
    if (!product) return
    setName(product.name || '')
    setShortDescription(product.description || '')
    setPrice(product.price != null ? String(product.price) : '')
    setStock(product.stock != null ? String(product.stock) : '')
    setCategoryId(product.category_id != null ? String(product.category_id) : '')
    setPrimaryImageUrl(product.image_url || '')
    
    // Parse details
    if (product.details) {
      setMaterial(product.details.material || '')
      if (Array.isArray(product.details.features)) {
        // Handle if features is array of strings (legacy) or objects
        setFeatures(product.details.features.map(f => {
          if (typeof f === 'string') return f
          return f.value || ''
        }))
      } else if (typeof product.details.features === 'object' && product.details.features !== null) {
        // Handle if features is an object (key-value)
        setFeatures(Object.entries(product.details.features).map(([k, v]) => String(v)))
      } else {
        setFeatures([])
      }
    } else {
      setMaterial('')
      setFeatures([])
    }

    if (product.dimensions) {
      setDimWidth(product.dimensions.width || '')
      setDimHeight(product.dimensions.height || '')
      setDimLength(product.dimensions.length || '')
    } else {
      setDimWidth('')
      setDimHeight('')
      setDimLength('')
    }
    // Extract description from sustainability_notes JSON
    if (product.sustainability_notes && typeof product.sustainability_notes === 'object') {
      setSustainabilityText(product.sustainability_notes.description || '')
    } else {
      setSustainabilityText('')
    }
  }, [product])

  useEffect(() => {
    setCareNotesList(Array.isArray(careNotes) ? careNotes : [])
  }, [careNotes])

  useEffect(() => {
    setVariants(Array.isArray(colorVariants) ? colorVariants : [])
  }, [colorVariants])

  useEffect(() => {
    const sc = Array.isArray(sizeChart) ? sizeChart : []
    setSizes(sc)
  }, [sizeChart])

  const parsedDetails = useMemo(() => {
    const m = material.trim()
    const f = features.filter(x => x && x.trim())
    if (!m && !f.length) return null
    
    // Construct features as array of objects for consistency with backend
    const featuresList = f.map(x => ({ name: 'Feature', value: x.trim() }))
    
    return {
      material: m,
      features: featuresList
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
    // Return null if empty so it doesn't try to save
    if (!sustainabilityText.trim()) return null
    return { description: sustainabilityText.trim() }
  }, [sustainabilityText])

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

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

  const onUploadImages = async (files) => {
    if (!productId || !files?.length) return
    try {
      const urls = Array.from(files).map((f) => URL.createObjectURL(f))
      setUploadedPreviews((prev) => [...prev, ...urls])
    } catch {}
    setUploading(true)
    try {
      const formData = new FormData()
      if (files.length === 1) formData.append('image', files[0])
      else Array.from(files).forEach((f) => formData.append('images', f))
      const res = await fetch(`http://localhost:5000/api/products/${productId}/images`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      if (uploadInputRef?.current) uploadInputRef.current.value = ''
    } catch (e) {
    } finally {
      setUploading(false)
    }
  }

  const onSetPrimaryImage = async (url) => {
    if (!productId || !url) return
    setPending(true)
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image_url: url }),
      })
      if (!res.ok) throw new Error('Failed to set primary image')
      setPrimaryImageUrl(url)
    } catch (e) {
    } finally {
      setPending(false)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (parsedDetails === '__invalid__' || parsedDimensions === '__invalid__' || parsedSustainability === '__invalid__') return
    const payload = {}
    if (name.trim()) payload.name = name.trim()
    if (shortDescription.trim()) payload.description = shortDescription.trim()
    if (price !== '') payload.price = parseFloat(price)
    if (stock !== '') payload.stock = parseInt(stock, 10)
    if (categoryId !== '') payload.category_id = parseInt(categoryId, 10)
    if (parsedDetails !== '__invalid__') payload.details = parsedDetails
    const dimsObj = parsedDimensions !== '__invalid__' ? (parsedDimensions || {}) : {}
    if (sizes && sizes.length) dimsObj.size_chart = sizes
    if (Object.keys(dimsObj).length) payload.dimensions = dimsObj
    if (careNotesList && careNotesList.length) payload.care_notes = careNotesList.filter(Boolean)
    if (parsedSustainability !== '__invalid__') payload.sustainability_notes = parsedSustainability
    if (variants && variants.length) payload.color_variants = variants.filter((v) => v && (v.name || v.hex))

    setPending(true)
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Update failed')
    } catch (e) {
    } finally {
      setPending(false)
    }
  }

  const onCancel = () => {
    navigate(-1)
  }

  const displayedImages = useMemo(() => {
    const arr = Array.isArray(images) ? images : []
    const uniq = Array.from(new Set([...(primaryImageUrl ? [primaryImageUrl] : []), ...arr].filter(Boolean)))
    return uniq
  }, [images, primaryImageUrl])
  const additionalImages = useMemo(() => displayedImages.filter((u) => u !== primaryImageUrl), [displayedImages, primaryImageUrl])
  useEffect(() => {
    setLocalImages(displayedImages)
  }, [displayedImages])
  const preventDefaults = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const onDropFiles = (e, single = false) => {
    preventDefaults(e)
    const fl = e.dataTransfer?.files
    if (!fl || !fl.length) return
    const arr = Array.from(fl)
    onUploadImages(single ? [arr[0]] : arr)
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
        <h1 className="admin__edit__title">Edit Products</h1>
        <p className="admin__edit__subtitle">
          The most important feature in the product editing section is the product adding part.
          When adding products here, do not ignore to fill all the required fields completely
          and follow the product adding rules.
        </p>
      </div>
      <form id="admin__edit__form" className="admin__edit__form" onSubmit={onSubmit}>
          <div className="admin__edit__body">
          <div className="admin__edit__body_form">
            <div className="admin__edit__left">
              <div className="form-row form-row--dual">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    className="form-control"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Description</label>
                  <input
                    className="form-control"
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Short description"
                  />
                </div>
                <div className="admin__edit__sublabel">Please keep these fields short</div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select category</option>
                  {category?.id != null && (
                    <option value={String(category.id)}>{category?.name ?? `Category #${category.id}`}</option>
                  )}
                </select>
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
                    onDropFiles(e, false)
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
                          onDropFiles(e, false)
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
                            setLocalImages((prev) => prev.filter((_, idx) => idx !== i))
                          }}
                          aria-label="Remove image"
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
                      try {
                        const previews = files.map((f) => URL.createObjectURL(f))
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
                      } catch {}
                      onUploadImages(files)
                      setReplaceIndex(null)
                    }}
                  />
                </div>
                <div className="images-controls">
                  <span className="images-controls__hint">Use these controls to view more images and attach more.</span>
                  <div className="images-controls__buttons">
                    <button type="button" className="images-btn" onClick={() => scrollByTiles(-3)}>Prev</button>
                    <button type="button" className="images-btn" onClick={() => scrollByTiles(3)}>Next</button>
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
                          <span key={idx} className="color-chip">
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
            {/* Sustainability Notes section removed as it is now handled by Main Description */}
          </div>
        </div>
      </form>
    </div>
  )
}
