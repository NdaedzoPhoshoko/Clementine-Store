import React, { useState, useMemo, useEffect } from 'react'
import './New.css'
import { useNavigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAddCategoriesBulk from '../../../../../../hooks/admin_dashboard/categories/useAddCategoriesBulk.js'
import SuccessModal from '../../../../../../components/modals/success_modal/SuccessModal.jsx'
import ErrorModal from '../../../../../../components/modals/ErrorModal.jsx'

export default function New() {
  const navigate = useNavigate()
  const { add, pending, error, data } = useAddCategoriesBulk()

  const [nameInput, setNameInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [list, setList] = useState([])
  const [showErrors, setShowErrors] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (error) {
      setErrorMsg(typeof error === 'string' ? error : 'Failed to add categories')
    }
  }, [error])

  const parsedCategories = useMemo(() => list, [list])

  const onCancel = () => {
    navigate(-1)
  }

  const onAdd = () => {
    setShowErrors(true)
    const name = nameInput.trim()
    const description = descInput.trim()
    if (!name) {
      setErrorMsg('Category name is required')
      return
    }
    const next = [...list, description ? { name, description } : { name }]
    setList(next)
    setNameInput('')
    setDescInput('')
  }

  const onRemove = (idx) => {
    const next = [...list]
    next.splice(idx, 1)
    setList(next)
  }
  const clearAll = () => {
    setList([])
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setShowErrors(true)
    if (!list.length) {
      setErrorMsg('Enter at least one category name')
      return
    }
    try {
      const res = await add(list)
      if (res) {
        setSuccessOpen(true)
      }
    } catch (e2) {
      setErrorMsg(e2?.message || 'Failed to add categories')
    }
  }

  return (
    <div className="admin__edit__page">
      <SuccessModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        onAfterClose={() => navigate('/admin/product_management/categories')}
        variant="success"
        title="Categories Added"
        message="Bulk categories have been successfully created."
        autoCloseMs={1200}
      />
      {errorMsg && (
        <ErrorModal
          message={errorMsg}
          onClose={() => setErrorMsg('')}
          durationMs={8000}
        />
      )}
      <div className="admin__edit__header">
        <h1 className="admin__edit__title">New Categories</h1>
        <p className="admin__edit__subtitle">
          Add categories one by one and build a list before creating.
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
            disabled={pending || list.length === 0}
          >
            {pending ? (
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
            <div className="admin__edit__fullrow">
              <div className="bulk-card">
                <div className="bulk-inputs">
                  <input
                    type="text"
                    className={`form-control bulk-name ${showErrors && !nameInput.trim() && 'is-invalid'}`}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Category name"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
                  />
                  <input
                    type="text"
                    className="form-control bulk-desc"
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Optional description"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
                  />
                  <button type="button" className="bulk-add-btn" onClick={onAdd} aria-label="Add category">↩</button>
                </div>
              </div>
            </div>
            <div className="admin__edit__fullrow">
              <div className="bulk-list">
                <div className="bulk-list__heading">
                  <span>Categories to add:</span>
                  <button
                    type="button"
                    className="bulk-clear-btn"
                    disabled={list.length === 0}
                    onClick={clearAll}
                  >
                    Remove All
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {list.map((c, idx) => (
                    <motion.div
                      key={`${c.name}-${idx}`}
                      className="bulk-row"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="bulk-index">{idx + 1}</div>
                      <div className="bulk-row-left">
                        <div className="bulk-row-title">{c.name}</div>
                        {c.description ? <div className="bulk-row-desc">{c.description}</div> : null}
                      </div>
                      <button type="button" className="bulk-delete" onClick={() => onRemove(idx)}>Delete</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {list.length === 0 ? <div className="admin__edit__sublabel">No categories added yet</div> : null}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
