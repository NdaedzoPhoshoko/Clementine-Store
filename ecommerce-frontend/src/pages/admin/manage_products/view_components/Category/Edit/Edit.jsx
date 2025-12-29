import React, { useEffect, useState, useRef } from 'react'
import './Edit.css'
import { useNavigate, useParams } from 'react-router-dom'
import useFetchCategory from '../../../../../../hooks/admin_dashboard/categories/useFetchCategory.js'
import useUpdateCategory from '../../../../../../hooks/admin_dashboard/categories/useUpdateCategory.js'
import { Save, X, Upload, Image as ImageIcon, Loader } from 'lucide-react'
import SuccessModal from '../../../../../../components/modals/success_modal/SuccessModal.jsx'
import ErrorModal from '../../../../../../components/modals/ErrorModal.jsx'

export default function Edit({ productId }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const categoryId = productId ?? id
  const { category, loading: fetchLoading, error: fetchError } = useFetchCategory(categoryId)
  const { update, pending: updatePending, error: updateError } = useUpdateCategory()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showErrors, setShowErrors] = useState(false)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [errorModalMessage, setErrorModalMessage] = useState('')

  // File input ref
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!category) return
    const cat = category?.category ?? category
    setName(typeof cat?.name === 'string' ? cat.name : '')
    setDescription(typeof cat?.description === 'string' ? cat.description : '')
    if (typeof cat?.image === 'string' && cat.image) {
      setImagePreview(cat.image)
    }
  }, [category])

  useEffect(() => {
    if (updateError) {
      setErrorModalMessage(updateError)
    }
  }, [updateError])

  const onCancel = () => {
    navigate('/admin/product_management/categories')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!categoryId) return

    if (!name.trim()) {
      setShowErrors(true)
      return
    }

    try {
      const payload = { name, description }
      await update(categoryId, payload)
      setSuccessModalOpen(true)
    } catch (err) {
      setErrorModalMessage(err?.message || 'Failed to update category')
    }
  }

  // Image handling
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setSelectedFile(null)
  }

  if (fetchLoading) {
    return (
      <div className="admin__edit__page" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Loader className="spin" size={32} />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="admin__edit__page">
         <div className="admin__edit__header">
            <h1 className="admin__edit__title">Error</h1>
         </div>
         <div className="error-msg">{fetchError}</div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="admin__edit__page">
         <div className="admin__edit__header">
            <h1 className="admin__edit__title">Category Not Found</h1>
         </div>
      </div>
    )
  }

  return (
    <div className="admin__edit__page">
      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        onAfterClose={() => navigate('/admin/product_management/categories')}
        variant="success"
        title="Category Updated"
        message="Category details have been successfully updated."
        autoCloseMs={1200}
      />
      {errorModalMessage && (
        <ErrorModal
          message={errorModalMessage}
          onClose={() => setErrorModalMessage('')}
          durationMs={8000}
        />
      )}
      <div className="admin__edit__header">
        <h1 className="admin__edit__title">Edit Category</h1>
        <p className="admin__edit__subtitle">
          Update the category details below. Ensure the category name is unique and descriptive.
        </p>
        <div className="admin__edit__header_actions">
          <button
            type="button"
            className="admin__edit__btn"
            onClick={onCancel}
          >
            Back
          </button>
          <button
            type="submit"
            form="admin__edit__form"
            className="admin__edit__btn admin__edit__btn--update"
            disabled={updatePending}
          >
            {updatePending ? (
              <>
                <Loader size={16} className="btn-spinner" />
                Updating…
              </>
            ) : (
              'Update'
            )}
          </button>
        </div>
      </div>

      <div className="admin__edit__content">
        <form id="admin__edit__form" className="admin__edit__form" onSubmit={handleSubmit}>
          
          <div className="admin__edit__columns">
            {/* Left Column */}
            <div className="admin__edit__column admin__edit__column--left">
              
              <div className="form-group">
                <label className="form-label">Category Name{(showErrors && !name.trim()) && <span className="error-star">*</span>}</label>
                <input
                  className={`form-control ${showErrors && !name.trim() ? 'is-invalid' : ''}`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter category description"
                  rows={6}
                />
              </div>

            </div>

            {/* Image upload section masked per request */}
          </div>

          {updateError && (
             <></>
          )}

          {false && <></>}

        </form>
      </div>
    </div>
  )
}
