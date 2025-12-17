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
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const [detailsText, setDetailsText] = useState('')
  const [dimensionsText, setDimensionsText] = useState('')
  const [sustainabilityText, setSustainabilityText] = useState('')
  const [careNotesList, setCareNotesList] = useState([])

  const [variants, setVariants] = useState([])
  const [sizes, setSizes] = useState([])
  const [newSize, setNewSize] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [newVariantName, setNewVariantName] = useState('')
  const [newVariantHex, setNewVariantHex] = useState('#000000')
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
    setDescription(product.description || '')
    setPrice(product.price != null ? String(product.price) : '')
    setStock(product.stock != null ? String(product.stock) : '')
    setCategoryId(product.category_id != null ? String(product.category_id) : '')
    setPrimaryImageUrl(product.image_url || '')
    setDetailsText(product.details ? JSON.stringify(product.details, null, 2) : '')
    setDimensionsText(product.dimensions ? JSON.stringify(product.dimensions, null, 2) : '')
    setSustainabilityText(product.sustainability_notes ? JSON.stringify(product.sustainability_notes, null, 2) : '')
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
    try {
      if (!detailsText.trim()) return null
      return JSON.parse(detailsText)
    } catch {
      return '__invalid__'
    }
  }, [detailsText])

  const parsedDimensions = useMemo(() => {
    try {
      if (!dimensionsText.trim()) return null
      return JSON.parse(dimensionsText)
    } catch {
      return '__invalid__'
    }
  }, [dimensionsText])

  const parsedSustainability = useMemo(() => {
    try {
      if (!sustainabilityText.trim()) return null
      return JSON.parse(sustainabilityText)
    } catch {
      return '__invalid__'
    }
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

  const onAddCareNote = () => {
    setCareNotesList([...careNotesList, ''])
  }

  const onRemoveCareNote = (idx) => {
    setCareNotesList(careNotesList.filter((_, i) => i !== idx))
  }

  const onChangeCareNote = (idx, value) => {
    const next = [...careNotesList]
    next[idx] = value
    setCareNotesList(next)
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
    if (description.trim()) payload.description = description.trim()
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
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a brief description"
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
                  selected sizes are: {Array.isArray(sizes) && sizes.length ? sizes.join(', ') : 'none'}
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
                    <div className="admin__edit__sublabel">selected colors are:</div>
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
                <label className="form-label">Details (JSON)</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={detailsText}
                  onChange={(e) => setDetailsText(e.target.value)}
                  placeholder='{"material":"cotton","fit":"regular"}'
                />
                <div className="admin__edit__sublabel">Provide valid JSON for product details</div>
              </div>
              <div className="form-group">
                <label className="form-label">Dimensions (JSON)</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={dimensionsText}
                  onChange={(e) => setDimensionsText(e.target.value)}
                  placeholder='{"weight":"500g","length":"70cm"}'
                />
                <div className="admin__edit__sublabel">Include size chart in Sizes above</div>
              </div>
            </div>
            <div className="form-group admin__edit__fullrow">
              <label className="form-label">Care Notes</label>
              {Array.isArray(careNotesList) && careNotesList.length ? (
                careNotesList.map((n, idx) => (
                  <div key={idx} className="selector-row">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Machine wash cold"
                      value={n}
                      onChange={(e) => onChangeCareNote(idx, e.target.value)}
                    />
                    <button type="button" className="note-remove-btn" onClick={() => onRemoveCareNote(idx)}>Remove</button>
                  </div>
                ))
              ) : (
                <div className="admin__edit__sublabel">No care notes added yet</div>
              )}
              <div className="selector-row">
                <button type="button" className="btn-add-note" onClick={onAddCareNote}>Add Note</button>
              </div>
            </div>
            <div className="form-group admin__edit__fullrow">
              <label className="form-label">Sustainability Notes (JSON)</label>
              <textarea
                className="form-control"
                rows={6}
                value={sustainabilityText}
                onChange={(e) => setSustainabilityText(e.target.value)}
                placeholder='{"recycled_materials":true,"certifications":["GOTS"]}'
              />
              <div className="admin__edit__sublabel">Provide valid JSON for sustainability info</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
