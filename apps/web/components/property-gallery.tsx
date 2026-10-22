"use client";

import { ChevronLeft, ChevronRight, Images, Maximize2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PropertyImage } from "@/types/models";
import styles from "./property-detail.module.css";

export function PropertyGallery({ title, images }: { title: string; images: PropertyImage[] }) {
  const [active, setActive] = useState(0);
  const [allPhotosOpen, setAllPhotosOpen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const total = images.length;
  const activeIndex = Math.min(active, Math.max(total - 1, 0));

  const previous = useCallback(() => {
    if (total > 1) setActive((current) => (current - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    if (total > 1) setActive((current) => (current + 1) % total);
  }, [total]);

  const openAt = (index: number) => { setActive(index); setAllPhotosOpen(true); };

  useEffect(() => {
    if (!allPhotosOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAllPhotosOpen(false);
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKey); };
  }, [allPhotosOpen, next, previous]);

  if (!total) return <div className={styles.galleryEmpty}><span><Images size={26}/></span><p>Photos will appear here soon.</p></div>;

  const current = images[activeIndex];
  const swipe = (event: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const offset = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(offset) > 36) offset > 0 ? previous() : next();
    touchStart.current = null;
  };

  return <>
    <section className={styles.gallery} aria-label={`${title} photos`}>
      <div className={styles.gallerySlider} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={swipe}>
        <button type="button" className={styles.galleryPhotoButton} onClick={() => openAt(activeIndex)} aria-label={`Open photo ${activeIndex + 1} of ${total}`}>
          <Image key={current.id} src={current.url} alt={`${title} — photo ${activeIndex + 1}`} width={1600} height={1000} unoptimized className={styles.gallerySlide}/>
        </button>

        {total > 1 && <>
          <button type="button" onClick={previous} className={`${styles.galleryControl} ${styles.galleryControlLeft}`} aria-label="Previous photo"><ChevronLeft size={21}/></button>
          <button type="button" onClick={next} className={`${styles.galleryControl} ${styles.galleryControlRight}`} aria-label="Next photo"><ChevronRight size={21}/></button>
        </>}

        <span className={styles.galleryCount}><Images size={14}/>{activeIndex + 1} / {total}</span>
        <button type="button" className={styles.galleryViewAll} onClick={() => setAllPhotosOpen(true)}><Maximize2 size={16}/>View all photos</button>
      </div>
    </section>

    {allPhotosOpen && <div className={styles.lightbox} role="presentation" onMouseDown={() => setAllPhotosOpen(false)}>
      <section className={styles.lightboxPanel} role="dialog" aria-modal="true" aria-label={`All photos for ${title}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.lightboxHeader}>
          <div><strong>{title}</strong><span>{activeIndex + 1} / {total}</span></div>
          <button type="button" className={styles.lightboxClose} onClick={() => setAllPhotosOpen(false)} aria-label="Close photos"><X size={19}/></button>
        </header>
        <div className={styles.lightboxBody}>
          {total > 1 && <button type="button" className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={previous} aria-label="Previous photo"><ChevronLeft size={25}/></button>}
          <div className={styles.lightboxImageWrap}><Image key={current.id} src={current.url} alt={`${title} — photo ${activeIndex + 1}`} width={1800} height={1200} unoptimized className={styles.lightboxImage}/></div>
          {total > 1 && <button type="button" className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={next} aria-label="Next photo"><ChevronRight size={25}/></button>}
        </div>
        {total > 1 && <div className={styles.lightboxThumbs}>{images.map((image, index) => <button type="button" key={image.id} className={`${styles.lightboxThumb} ${index === activeIndex ? styles.lightboxThumbActive : ""}`} onClick={() => setActive(index)} aria-label={`Show photo ${index + 1}`}><Image src={image.url} alt="" width={144} height={102} unoptimized/></button>)}</div>}
      </section>
    </div>}
  </>;
}
