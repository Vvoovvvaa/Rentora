"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";

import styles from "./city-discovery-section.module.css";

const cities = [
  {
    code: "YEREVAN",
    name: "Yerevan",
    caption: "Capital city",
    tone: "yerevan",
  },
  {
    code: "GYUMRI",
    name: "Gyumri",
    caption: "Culture & character",
    tone: "gyumri",
  },
  {
    code: "VANADZOR",
    name: "Vanadzor",
    caption: "Green surroundings",
    tone: "vanadzor",
  },
  {
    code: "DILIJAN",
    name: "Dilijan",
    caption: "Homes in the forest",
    tone: "dilijan",
  },
  {
    code: "SEVAN",
    name: "Sevan",
    caption: "Life by the lake",
    tone: "sevan",
  },
  {
    code: "TSAGHKADZOR",
    name: "Tsaghkadzor",
    caption: "Mountain living",
    tone: "tsaghkadzor",
  },
] as const;

export function CityDiscoverySection() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollCities = (direction: -1 | 1) => {
    const track = trackRef.current;

    if (!track) return;

    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  return (
    <section
      className={styles.section}
      aria-labelledby="city-discovery-title"
    >
      <div className={`shell ${styles.container}`}>
        <div className={styles.header}>
          <div className={styles.headingCopy}>
            <p className={styles.eyebrow}>
              <MapPin size={13} />
              Explore Armenia
            </p>

            <h2 id="city-discovery-title">
              Find homes by city
            </h2>

            <p className={styles.subtitle}>
              Choose a location and explore available properties.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link
              href="/properties"
              className={styles.allLink}
            >
              All homes
              <ArrowRight size={16} />
            </Link>

            <div className={styles.scrollControls}>
              <button
                type="button"
                onClick={() => scrollCities(-1)}
                aria-label="Previous cities"
                className={styles.scrollButton}
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => scrollCities(1)}
                aria-label="Next cities"
                className={styles.scrollButton}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          className={styles.track}
          role="list"
          aria-label="Browse properties by city"
        >
          {cities.map((city, index) => (
            <Link
              key={city.code}
              href={`/properties?city=${city.code}`}
              className={`${styles.card} ${styles[city.tone]}`}
              role="listitem"
            >
              <span
                className={styles.cityArtwork}
                aria-hidden="true"
              >
                <span className={styles.sun} />

                <span className={styles.buildingBack}>
                  <span />
                  <span />
                  <span />
                  <span />
                </span>

                <span className={styles.buildingFront}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              </span>

              <span className={styles.cardTop}>
                <span className={styles.cardIndex}>
                  0{index + 1}
                </span>

                <span className={styles.pinIcon}>
                  <MapPin size={15} />
                </span>
              </span>

              <span className={styles.cardBottom}>
                <span className={styles.cardCaption}>
                  {city.caption}
                </span>

                <span className={styles.cityName}>
                  {city.name}
                </span>

                <span className={styles.cardAction}>
                  Explore homes
                  <ArrowUpRight size={16} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}