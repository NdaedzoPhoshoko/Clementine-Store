import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './FlexModal.css'

export default function FlexModal({
  open = false,
  onClose,
  children,
  anchorRef,
  anchorPoint, // { x, y } viewport coords
  offset = { x: 0, y: 8 },
  backdrop = false,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  className = '',
  style = {},
  positionMode = 'fixed', // 'fixed' (lock on open) or 'anchored' (track on scroll)
  renderInPlace = true,
  parentRef, // optional: treat this as the inside area for outside-click when inline
  width
}) {
  const modalRef = useRef(null)
  const [pos, setPos] = useState({ top: '20%', left: '50%', centered: true })
  
  // Compute position from anchor or default to centered near top
  const computePosition = () => {
    let left = '50%'
    let top = '20%'
    let centered = true
    if (anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect()
      left = Math.round(r.left + offset.x)
      top = Math.round(r.bottom + offset.y)
      centered = false
    } else if (anchorPoint && Number.isFinite(anchorPoint.x) && Number.isFinite(anchorPoint.y)) {
      left = Math.round(anchorPoint.x + offset.x)
      top = Math.round(anchorPoint.y + offset.y)
      centered = false
    }
    return { top, left, centered }
  }

  useEffect(() => {
    if (!open) return
    setPos(computePosition())
  }, [open, anchorRef, anchorPoint, offset.x, offset.y])

  // Keep within viewport horizontally after mount (when width is known)
  useLayoutEffect(() => {
    if (!open || !modalRef.current || pos.centered) return
    const rect = modalRef.current.getBoundingClientRect()
    const margin = 12
    let left = pos.left
    if (typeof left === 'number') {
      if (left + rect.width + margin > window.innerWidth) left = window.innerWidth - rect.width - margin
      if (left < margin) left = margin
      setPos(p => ({ ...p, left }))
    }
    modalRef.current.focus()
  }, [open, pos.centered, pos.left])

  // Close on ESC
  useEffect(() => {
    if (!open || !closeOnEsc) return
    const h = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, closeOnEsc, onClose])

  // Close when clicking outside (supports inline or portal)
  useEffect(() => {
    if (!open || !closeOnOutsideClick) return
    const handler = (e) => {
      if (renderInPlace) {
        const root = parentRef?.current || modalRef.current?.parentElement
        if (root && !root.contains(e.target)) onClose?.()
      } else {
        if (modalRef.current && !modalRef.current.contains(e.target)) onClose?.()
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open, closeOnOutsideClick, onClose, renderInPlace, parentRef])

  // Reposition on scroll/resize to stay anchored to the trigger
  useEffect(() => {
    if (!open || positionMode !== 'anchored') return
    let rafId = null
    const update = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setPos(prev => {
          const next = computePosition()
          // Clamp vertically to viewport if needed
          const margin = 12
          if (typeof next.top === 'number') {
            const rect = modalRef.current?.getBoundingClientRect()
            const height = rect?.height || 0
            const maxTop = window.innerHeight - height - margin
            next.top = Math.max(margin, Math.min(next.top, maxTop))
          }
          return next
        })
      })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [open, anchorRef, anchorPoint, offset.x, offset.y, positionMode])

  if (!open) return null

  if (renderInPlace) {
    return (
      <div className="flexmodal__inline-root">
        <div
          className={`flexmodal__inline-container ${className}`}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          ref={modalRef}
          style={{ width, '--flexmodal-offset-y': `${offset?.y ?? 8}px`, ...style }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    )
  }

  const content = (
    <div className="flexmodal__portal" aria-hidden={!open}>
      {backdrop && <div className="flexmodal__backdrop" onClick={() => onClose?.()} />}
      <div
        className={`flexmodal__container ${className}`}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={modalRef}
        style={{ top: pos.top, left: pos.left, '--flexmodal-translate-x': pos.centered ? '-50%' : '0', ...style }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}