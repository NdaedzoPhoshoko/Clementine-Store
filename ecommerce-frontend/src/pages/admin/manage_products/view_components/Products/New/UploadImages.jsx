import React, { useState, useRef } from 'react'
import { Upload, X, Loader } from 'lucide-react'
import useUploadProductImages from '../../../../../../hooks/admin_dashboard/products/useUploadProductImages.js'
import './New.css'

export default function UploadImages({ productId, onComplete }) {
  const [queuedFiles, setQueuedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const uploadInputRef = useRef(null)
  const imagesScrollRef = useRef(null)
  
  const { upload } = useUploadProductImages()

  const onSelectFiles = (e) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    const newPreviews = files.map(f => URL.createObjectURL(f))
    
    setQueuedFiles(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...newPreviews])
    
    e.target.value = ''
  }

  const onRemoveFile = (idx) => {
    // Revoke URL
    try { URL.revokeObjectURL(previews[idx]) } catch {}
    
    setQueuedFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const onUpload = async () => {
    if (!queuedFiles.length) {
      onComplete()
      return
    }

    setUploading(true)
    try {
      await upload(productId, queuedFiles)
      onComplete()
    } catch (e) {
      console.error('Upload failed', e)
      alert('Upload failed, please try again.')
    } finally {
      setUploading(false)
    }
  }

  const scrollByTiles = (n) => {
    if (!imagesScrollRef?.current) return
    imagesScrollRef.current.scrollBy({ left: n * 172, behavior: 'smooth' })
  }

  return (
    <div className="admin__edit__page">
       <div className="admin__edit__header">
        <h1 className="admin__edit__title">Upload Additional Images</h1>
        <p className="admin__edit__subtitle">
          Add more images to your product. These will appear in the product gallery.
        </p>
        <div className="admin__edit__header_actions">
            <button
            type="button"
            className="admin__edit__btn"
            onClick={onComplete}
            disabled={uploading}
          >
            Skip
          </button>
          <button
            type="button"
            className="admin__edit__btn admin__edit__btn--update"
            onClick={onUpload}
            disabled={uploading || !queuedFiles.length}
          >
            {uploading ? (
              <>
                <Loader size={16} className="btn-spinner" />
                Uploading...
              </>
            ) : (
              'Upload & Finish'
            )}
          </button>
        </div>
      </div>

      <div className="admin__edit__body">
        <div className="form-group">
            <label className="form-label">Product Images</label>
            
            <div className="images-scroll" ref={imagesScrollRef}>
                 {/* Upload Tile */}
                <div 
                  className="image-tile placeholder"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <div className="image-placeholder">
                    <Upload size={24} />
                    <span>Add Images</span>
                  </div>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={onSelectFiles}
                  />
                </div>

                {/* Previews */}
                {previews.map((url, idx) => (
                    <div key={idx} className="image-tile has-image">
                        <button
                          type="button"
                          className="image-remove"
                          onClick={() => onRemoveFile(idx)}
                        >
                          <X size={14} />
                        </button>
                        <img src={url} alt={`Preview ${idx}`} />
                    </div>
                ))}
            </div>

             <div className="images-controls">
                <span className="images-controls__hint">
                    {queuedFiles.length} images selected
                </span>
                <div className="images-controls__buttons">
                  <button type="button" className="images-btn" onClick={() => scrollByTiles(-1)}>Prev</button>
                  <button type="button" className="images-btn" onClick={() => scrollByTiles(1)}>Next</button>
                </div>
              </div>
        </div>
      </div>
    </div>
  )
}
