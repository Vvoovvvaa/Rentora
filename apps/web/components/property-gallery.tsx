"use client";

import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PropertyImage } from "@/types/models";

export function PropertyGallery({ title, images }: { title: string; images: PropertyImage[] }) {
  const [active, setActive] = useState(0);
  const [allPhotosOpen, setAllPhotosOpen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const total = images.length;
  const previous = () => setActive((current) => (current - 1 + total) % total);
  const next = () => setActive((current) => (current + 1) % total);

  useEffect(() => { setActive((current) => Math.min(current, Math.max(total - 1, 0))); }, [total]);
  useEffect(() => {
    if (total < 2) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === "ArrowLeft") previous(); if (event.key === "ArrowRight") next(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [total]);

  if (!total) return <div className="gallery-empty"><Images size={34}/><p>Photos will appear here soon.</p></div>;

  return <section className="gallery" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const offset = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(offset) > 36) { if (offset > 0) previous(); else next(); } touchStart.current = null; }}>
    <div className="gallery-stage">
      <img src={images[active].url} alt={`${title} — photo ${active + 1}`} className="h-full w-full object-cover"/>
      {total > 1 && <>
        <button type="button" onClick={previous} className="gallery-control left-4" aria-label="Previous photo"><ChevronLeft size={22}/></button>
        <button type="button" onClick={next} className="gallery-control right-4" aria-label="Next photo"><ChevronRight size={22}/></button>
        <span className="gallery-counter">{active + 1} / {total}</span>
        <button type="button" className="gallery-view-all" onClick={() => setAllPhotosOpen(true)}><Images size={16}/> View all photos</button>
      </>}
    </div>
    {total > 1 && <div className="gallery-thumbnails">{images.map((image, index) => <button type="button" key={image.id} onClick={() => setActive(index)} className={`gallery-thumb ${index === active ? "is-active" : ""}`} aria-label={`Show photo ${index + 1}`}><img src={image.url} alt="" className="h-full w-full object-cover"/></button>)}</div>}
    {allPhotosOpen && <div className="gallery-lightbox" role="presentation" onMouseDown={() => setAllPhotosOpen(false)}><section className="gallery-lightbox-panel" role="dialog" aria-modal="true" aria-label={`All photos for ${title}`} onMouseDown={(event) => event.stopPropagation()}><div className="gallery-lightbox-header"><strong>{title}</strong><button type="button" onClick={() => setAllPhotosOpen(false)} aria-label="Close photos"><X size={19}/></button></div><div className="gallery-lightbox-grid">{images.map((image, index) => <button type="button" key={image.id} onClick={() => { setActive(index); setAllPhotosOpen(false); }}><img src={image.url} alt={`${title} — photo ${index + 1}`}/></button>)}</div></section></div>}
  </section>;
}
