"use client";

import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useRef, useState } from "react";
import type { PropertyImage } from "@/types/models";

export function PropertyGallery({ title, images }: { title: string; images: PropertyImage[] }) {
  const [active, setActive] = useState(0); const touchStart = useRef<number | null>(null);
  const total = images.length; const previous = () => setActive((current) => (current - 1 + total) % total); const next = () => setActive((current) => (current + 1) % total);
  if (!total) return <div className="gallery-empty"><Images size={34}/><p>Photos will appear here soon.</p></div>;
  return <section className="gallery" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const offset = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(offset) > 36) { if (offset > 0) previous(); else next(); } touchStart.current = null; }}>
    <div className="gallery-stage"><img src={images[active].url} alt={`${title} — photo ${active + 1}`} className="h-full w-full object-cover"/>{total > 1 && <><button onClick={previous} className="gallery-control left-4" aria-label="Previous photo"><ChevronLeft size={22}/></button><button onClick={next} className="gallery-control right-4" aria-label="Next photo"><ChevronRight size={22}/></button><span className="absolute right-5 top-5 rounded-full bg-slate-950/65 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{active + 1} / {total}</span></>}</div>{total > 1 && <div className="gallery-thumbnails">{images.map((image, index) => <button key={image.id} onClick={() => setActive(index)} className={`gallery-thumb ${index === active ? "is-active" : ""}`} aria-label={`Show photo ${index + 1}`}><img src={image.url} alt="" className="h-full w-full object-cover"/></button>)}</div>}</section>;
}
