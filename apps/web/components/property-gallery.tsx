"use client";

import {
  ChevronLeft,
  ChevronRight,
  Images,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { PropertyImage } from "@/types/models";

import styles from "./property-detail.module.css";

export function PropertyGallery({
  title,
  images,
}: {
  title: string;
  images: PropertyImage[];
}) {
  const [
    active,
    setActive,
  ] =
    useState(0);

  const [
    allPhotosOpen,
    setAllPhotosOpen,
  ] =
    useState(false);

  const touchStart =
    useRef<number | null>(
      null,
    );

  const total =
    images.length;

  const activeIndex =
    Math.min(
      active,
      Math.max(
        total - 1,
        0,
      ),
    );

  const previous =
    useCallback(() => {
      if (!total) {
        return;
      }

      setActive(
        (current) =>
          (current -
            1 +
            total) %
          total,
      );
    }, [total]);

  const next =
    useCallback(() => {
      if (!total) {
        return;
      }

      setActive(
        (current) =>
          (current +
            1) %
          total,
      );
    }, [total]);

  const openAt = (
    index: number,
  ) => {
    setActive(index);

    setAllPhotosOpen(
      true,
    );
  };

  useEffect(() => {
    if (
      !allPhotosOpen
    ) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    const handleKey = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setAllPhotosOpen(
          false,
        );
      }

      if (
        event.key ===
        "ArrowLeft"
      ) {
        previous();
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        next();
      }
    };

    window.addEventListener(
      "keydown",
      handleKey,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKey,
      );
    };
  }, [
    allPhotosOpen,
    next,
    previous,
  ]);

  if (!total) {
    return (
      <div
        className={
          styles.galleryEmpty
        }
      >
        <span>
          <Images
            size={26}
          />
        </span>

        <p>
          Photos will
          appear here
          soon.
        </p>
      </div>
    );
  }

  const second =
    images[1];

  const third =
    images[2];

  return (
    <>
      <section
        className={
          styles.gallery
        }
      >
        {/* =====================
            DESKTOP COLLAGE
        ===================== */}

        <div
          className={`${styles.galleryDesktop} ${
            total === 1
              ? styles.galleryDesktopSingle
              : ""
          }`}
        >
          <button
            type="button"
            className={
              styles.galleryMain
            }
            onClick={() =>
              openAt(0)
            }
          >
            <img
              src={
                images[0]
                  .url
              }
              alt={`${title} — photo 1`}
              className={
                styles.galleryImage
              }
            />

            <span
              className={
                styles.galleryImageOverlay
              }
            />
          </button>

          {second && (
            <div
              className={`${styles.gallerySide} ${
                !third
                  ? styles.gallerySideSingle
                  : ""
              }`}
            >
              <button
                type="button"
                className={
                  styles.galleryTile
                }
                onClick={() =>
                  openAt(
                    1,
                  )
                }
              >
                <img
                  src={
                    second.url
                  }
                  alt={`${title} — photo 2`}
                  className={
                    styles.galleryImage
                  }
                />

                <span
                  className={
                    styles.galleryImageOverlay
                  }
                />
              </button>

              {third && (
                <button
                  type="button"
                  className={
                    styles.galleryTile
                  }
                  onClick={() =>
                    openAt(
                      2,
                    )
                  }
                >
                  <img
                    src={
                      third.url
                    }
                    alt={`${title} — photo 3`}
                    className={
                      styles.galleryImage
                    }
                  />

                  <span
                    className={
                      styles.galleryImageOverlay
                    }
                  />
                </button>
              )}
            </div>
          )}

          <span
            className={
              styles.galleryCount
            }
          >
            <Images
              size={14}
            />

            {total}
          </span>

          <button
            type="button"
            className={
              styles.galleryViewAll
            }
            onClick={() =>
              setAllPhotosOpen(
                true,
              )
            }
          >
            <Images
              size={16}
            />

            View all photos
          </button>
        </div>

        {/* =====================
            MOBILE CAROUSEL
        ===================== */}

        <div
          className={
            styles.galleryMobile
          }
          onTouchStart={(
            event,
          ) => {
            touchStart.current =
              event.touches[0]
                .clientX;
          }}
          onTouchEnd={(
            event,
          ) => {
            if (
              touchStart.current ===
              null
            ) {
              return;
            }

            const offset =
              event.changedTouches[0]
                .clientX -
              touchStart.current;

            if (
              Math.abs(
                offset,
              ) > 36
            ) {
              if (
                offset >
                0
              ) {
                previous();
              } else {
                next();
              }
            }

            touchStart.current =
              null;
          }}
        >
          <img
            src={
              images[
                activeIndex
              ].url
            }
            alt={`${title} — photo ${activeIndex + 1}`}
            className={
              styles.galleryImage
            }
          />

          <span
            className={
              styles.galleryImageOverlay
            }
          />

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={
                  previous
                }
                className={`${styles.galleryControl} ${styles.galleryControlLeft}`}
                aria-label="Previous photo"
              >
                <ChevronLeft
                  size={20}
                />
              </button>

              <button
                type="button"
                onClick={
                  next
                }
                className={`${styles.galleryControl} ${styles.galleryControlRight}`}
                aria-label="Next photo"
              >
                <ChevronRight
                  size={20}
                />
              </button>
            </>
          )}

          <span
            className={
              styles.mobileCounter
            }
          >
            {activeIndex +
              1}{" "}
            / {total}
          </span>

          <button
            type="button"
            className={
              styles.mobileViewAll
            }
            onClick={() =>
              setAllPhotosOpen(
                true,
              )
            }
          >
            <Images
              size={15}
            />
          </button>
        </div>
      </section>

      {/* =========================
          LIGHTBOX
      ========================= */}

      {allPhotosOpen && (
        <div
          className={
            styles.lightbox
          }
          role="presentation"
          onMouseDown={() =>
            setAllPhotosOpen(
              false,
            )
          }
        >
          <section
            className={
              styles.lightboxPanel
            }
            role="dialog"
            aria-modal="true"
            aria-label={`All photos for ${title}`}
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <header
              className={
                styles.lightboxHeader
              }
            >
              <div>
                <strong>
                  {title}
                </strong>

                <span>
                  {activeIndex +
                    1}{" "}
                  / {total}
                </span>
              </div>

              <button
                type="button"
                className={
                  styles.lightboxClose
                }
                onClick={() =>
                  setAllPhotosOpen(
                    false,
                  )
                }
                aria-label="Close photos"
              >
                <X
                  size={19}
                />
              </button>
            </header>

            <div
              className={
                styles.lightboxBody
              }
            >
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={
                  previous
                }
                aria-label="Previous photo"
              >
                <ChevronLeft
                  size={25}
                />
              </button>

              <div
                className={
                  styles.lightboxImageWrap
                }
              >
                <img
                  src={
                    images[
                      activeIndex
                    ].url
                  }
                  alt={`${title} — photo ${activeIndex + 1}`}
                  className={
                    styles.lightboxImage
                  }
                />
              </div>

              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={
                  next
                }
                aria-label="Next photo"
              >
                <ChevronRight
                  size={25}
                />
              </button>
            </div>

            {total > 1 && (
              <div
                className={
                  styles.lightboxThumbs
                }
              >
                {images.map(
                  (
                    image,
                    index,
                  ) => (
                    <button
                      type="button"
                      key={
                        image.id
                      }
                      className={`${styles.lightboxThumb} ${
                        index ===
                        activeIndex
                          ? styles.lightboxThumbActive
                          : ""
                      }`}
                      onClick={() =>
                        setActive(
                          index,
                        )
                      }
                    >
                      <img
                        src={
                          image.url
                        }
                        alt=""
                      />
                    </button>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}