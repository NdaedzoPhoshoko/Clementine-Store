import React, { useEffect, useRef, useState } from "react";
import "./SponsoredBanner.css";

export default function SponsoredBanner() {
  const slides = [
    {
      id: 1,
      title: "You have no idea what we have for us",
      subtitle: "Discover exclusive drops curated for your cart.",
      image: "/images/sponsored/eye-speak-CGyur4w8qKo-unsplash.jpg",
      cta: "Shop New Arrivals",
      kicker: "Sponsored",
    },
    {
      id: 2,
      title: "Mega Sale — prices you’ll love",
      subtitle: "Up to 60% off top categories. Limited time.",
      image: "/images/sponsored/force-majeure-00tlC0Clfrs-unsplash.jpg",
      cta: "Browse Deals",
      kicker: "Sponsored",
    },
    {
      id: 3,
      title: "Exclusive Sneaker Drops",
      subtitle: "Fresh colorways and iconic silhouettes. Limited pairs.",
      image: "/images/sponsored/kaboompics_sporty-fashion-photography-blue-sneakers-and-tennis-vibes-40270.jpg",
      cta: "Shop Sneaker Picks",
      kicker: "Sponsored",
    },
    {
      id: 4,
      title: "Streetwear & Essentials",
      subtitle: "Everyday fits from top brands. Your style, your way.",
      image: "/images/sponsored/keagan-henman-xPJYL0l5Ii8-unsplash.jpg",
      cta: "Explore Streetwear",
      kicker: "Sponsored",
    },
    {
      id: 5,
      title: "Beauty & Lifestyle",
      subtitle: "Elevate your everyday with curated lifestyle picks.",
      image: "/images/sponsored/xuan-thu-le-2OXNxfTt3kQ-unsplash.jpg",
      cta: "Discover Lifestyle",
      kicker: "Sponsored",
    },
    {
      id: 6,
      title: "Free Shipping & Easy Returns",
      subtitle: "Zero hassle on every order. Shop with confidence.",
      image: "/images/sponsored/no-revisions-kWVImL5QxJI-unsplash.jpg",
      cta: "Start Shopping",
      kicker: "Sponsored",
    },
  ];
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Preload images to avoid flicker on Edge
  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
    // no cleanup needed
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // kick off first slide after mount to allow CSS transitions
    const init = setTimeout(() => setIndex(0), 50);
    // autoplay to next slide every 5 seconds
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => {
      clearTimeout(init);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  const restartAutoplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
  };
  const pauseAutoplay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const goto = (i) => {
    if (i === index) return;
    setIndex(i);
    restartAutoplay();
  };

  return (
    <section
      className={`sponsored-banner ${ready ? 'is-ready' : ''}`}
      aria-label="Sponsored banners"
    >
      <div className="sponsored-banner__slides">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`sponsored-banner__slide ${i === index ? "is-active" : ""}`}
            style={{
              backgroundImage: `url('${s.image}')`,
            }}
            role="img"
            aria-label={s.title}
          >
            <div className="sponsored-banner__content">
              <div className="sponsored-banner__kicker">{s.kicker}</div>
              <h3 className="sponsored-banner__title">{s.title}</h3>
              <p className="sponsored-banner__subtitle">{s.subtitle}</p>
              <button className="sponsored-banner__cta" type="button">
                {s.cta} <span aria-hidden>›</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="sponsored-banner__dots" role="tablist" aria-label="Slide navigation">
        {slides.map((s, i) => (
          <button
            key={`dot-${s.id}`}
            className={`sponsored-banner__dot ${i === index ? "is-active" : ""}`}
            onClick={() => goto(i)}
            aria-label={`Go to slide ${i + 1}`}
            role="tab"
            aria-selected={i === index}
          />
        ))}
      </div>
    </section>
  );
}
