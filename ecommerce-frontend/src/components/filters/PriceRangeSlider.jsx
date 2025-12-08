import React, { useEffect, useState, useRef } from "react";
import "./PriceRangeSlider.css";

export default function PriceRangeSlider({
  min = 0,
  max = 1000,
  valueMin,
  valueMax,
  step = 1,
  onDebouncedChange,
}) {
  const clamp = (v) => {
    const num = Number.isFinite(Number(v)) ? Number(v) : min;
    return Math.min(Math.max(num, min), max);
  };

  const [localMin, setLocalMin] = useState(
    valueMin != null && valueMin !== "" ? Number(valueMin) : min
  );
  const [localMax, setLocalMax] = useState(
    valueMax != null && valueMax !== "" ? Number(valueMax) : max
  );

  // Sync external value changes into local state
  useEffect(() => {
    setLocalMin(valueMin != null && valueMin !== "" ? clamp(valueMin) : min);
  }, [valueMin, min, max]);
  useEffect(() => {
    setLocalMax(valueMax != null && valueMax !== "" ? clamp(valueMax) : max);
  }, [valueMax, min, max]);

  // Ensure localMin <= localMax
  useEffect(() => {
    if (localMin > localMax) {
      setLocalMin(localMax);
    }
  }, [localMin, localMax]);

  // Debounce outgoing change
  const debounceRef = useRef(null);
  const isFirstRender = useRef(true);
  
  // Use a ref for the callback to avoid triggering the effect when the parent re-renders (creating a new function)
  const onDebouncedChangeRef = useRef(onDebouncedChange);
  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      if (typeof onDebouncedChangeRef.current === "function") {
        onDebouncedChangeRef.current(localMin, localMax);
      }
    }, 300);
    
    return () => clearTimeout(debounceRef.current);
  }, [localMin, localMax]); // Removed onDebouncedChange from dependencies

  const handleMinRange = (e) => {
    const v = clamp(e.target.value);
    if (v <= localMax) setLocalMin(v);
    else setLocalMin(localMax);
  };

  const sliderRef = useRef(null);
  const startDrag = (thumb) => (e) => {
    e.preventDefault();
    setActiveThumb(thumb);
    const move = (ev) => {
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const rect = sliderRef.current?.getBoundingClientRect();
      if (!rect) return;
      let ratio = (clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      if (thumb === 'min') {
        setLocalMin(Math.min(stepped, localMax));
      } else {
        setLocalMax(Math.max(stepped, localMin));
      }
    };
    const end = () => {
      setActiveThumb(null);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  };
  const handleMaxRange = (e) => {
    const v = clamp(e.target.value);
    if (v >= localMin) setLocalMax(v);
    else setLocalMax(localMin);
  };

  const [activeThumb, setActiveThumb] = useState(null);
  useEffect(() => {
    const end = () => setActiveThumb(null);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end, { passive: true });
    return () => {
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchend', end);
    };
  }, []);

  const handleMinInput = (e) => {
    const v = clamp(e.target.value);
    setLocalMin(v <= localMax ? v : localMax);
  };
  const handleMaxInput = (e) => {
    const v = clamp(e.target.value);
    setLocalMax(v >= localMin ? v : localMin);
  };

  const percent = (v) => ((v - min) / (max - min)) * 100;

  return (
    <div className="filter-component price-range" aria-label="Price range filter">
      <div className="price-range__inputs">
        <label className="filter-label form-label" htmlFor="price-min">Min</label>
        <input
          id="price-min"
          type="number"
          className="filter-input form-control"
          value={Number.isFinite(localMin) ? localMin : ""}
          min={min}
          max={max}
          step={step}
          onChange={handleMinInput}
          aria-label="Minimum price"
        />
        <label className="filter-label form-label" htmlFor="price-max">Max</label>
        <input
          id="price-max"
          type="number"
          className="filter-input form-control"
          value={Number.isFinite(localMax) ? localMax : ""}
          min={min}
          max={max}
          step={step}
          onChange={handleMaxInput}
          aria-label="Maximum price"
        />
      </div>

      <div className="price-range__slider" ref={sliderRef} role="group" aria-label="Price range slider">
        <div className="price-range__track" aria-hidden="true">
          <div
            className="price-range__fill"
            style={{
              left: `${percent(localMin)}%`,
              width: `${percent(localMax) - percent(localMin)}%`,
            }}
          />
        </div>
        <div className="price-range__blocker" aria-hidden="true" />
        <button
          type="button"
          className="price-range__handle price-range__handle--min"
          style={{ left: `${percent(localMin)}%` }}
          onMouseDown={startDrag('min')}
          onTouchStart={startDrag('min')}
          aria-label="Minimum price"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localMin}
        />
        <button
          type="button"
          className="price-range__handle price-range__handle--max"
          style={{ left: `${percent(localMax)}%` }}
          onMouseDown={startDrag('max')}
          onTouchStart={startDrag('max')}
          aria-label="Maximum price"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localMax}
        />
      </div>
    </div>
  );
}