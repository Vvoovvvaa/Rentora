"use client";

import Link from "next/link";

import {
  ArrowRight,
  Check,
  Compass,
  GitCompare,
  House,
  Map,
  MapPin,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  apiMessage,
  propertiesApi,
} from "@/lib/api";

import type {
  Property,
} from "@/types/models";

import {
  PropertyCard,
  PropertySkeleton,
} from "./property-card";

import { SearchForm } from "./search-form";
import { RentoraAiHeroSearch } from "./rentora-ai-hero-search";

import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";

import {
  isPublicProperty,
} from "./property-presentation";

type StoryId =
  | "why"
  | "what"
  | "armenia"
  | "about";

type Story = {
  id: StoryId;
  icon: typeof Compass;
  title: string;
  summary: string;
  action: string;
  tone: string;
};

const storyList = (
  t: (key: string) => string,
): Story[] => [
  {
    id: "why",
    icon: Compass,
    title: t(
      "home.storyWhyTitle",
    ),
    summary: t(
      "home.storyWhyCopy",
    ),
    action: t(
      "home.exploreHomes",
    ),
    tone: "is-sand",
  },
  {
    id: "what",
    icon: House,
    title: t(
      "home.storyWhatTitle",
    ),
    summary: t(
      "home.storyWhatCopy",
    ),
    action: t(
      "home.searchWorks",
    ),
    tone: "is-cream",
  },
  {
    id: "armenia",
    icon: MapPin,
    title: t(
      "home.storyArmeniaTitle",
    ),
    summary: t(
      "home.storyArmeniaCopy",
    ),
    action: t(
      "home.openMap",
    ),
    tone: "is-map",
  },
  {
    id: "about",
    icon: Sparkles,
    title: t(
      "home.storyAboutTitle",
    ),
    summary: t(
      "home.storyAboutCopy",
    ),
    action: t(
      "home.readStory",
    ),
    tone: "is-dark",
  },
];

export function HomeView() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const { t } =
    useI18n();

  const stories =
    storyList(t);

  const benefits = [
    [
      Map,
      t("home.mapSearch"),
      t(
        "home.mapSearchCopy",
      ),
    ],
    [
      GitCompare,
      t(
        "home.compareProperties",
      ),
      t(
        "home.comparePropertiesCopy",
      ),
    ],
    [
      MessageCircle,
      t(
        "home.talkDirectly",
      ),
      t(
        "home.talkDirectlyCopy",
      ),
    ],
  ] as const;

  const [
    properties,
    setProperties,
  ] = useState<Property[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    activeStory,
    setActiveStory,
  ] = useState<Story | null>(
    null,
  );

  const closeStoryRef =
    useRef<HTMLButtonElement>(
      null,
    );

  const load = () => {
    setLoading(true);

    propertiesApi
      .all()
      .then((items) =>
        setProperties(
          items.filter(
            isPublicProperty,
          ),
        ),
      )
      .catch((reason) =>
        setError(
          apiMessage(reason),
        ),
      )
      .finally(() =>
        setLoading(false),
      );
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void Promise.resolve().then(
      user
        ? load
        : () =>
            setLoading(false),
    );
  }, [
    authLoading,
    user,
  ]);

  useEffect(() => {
    if (!activeStory) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    const closeOnKey = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape"
      ) {
        event.preventDefault();

        setActiveStory(
          null,
        );
      }

      if (
        event.key === "Tab"
      ) {
        const dialog =
          document.querySelector<HTMLElement>(
            ".home-story-dialog",
          );

        const focusable =
          dialog
            ? Array.from(
                dialog.querySelectorAll<HTMLElement>(
                  'button:not([disabled]), a[href]',
                ),
              )
            : [];

        if (
          !focusable.length
        ) {
          return;
        }

        const first =
          focusable[0];

        const last =
          focusable[
            focusable.length -
              1
          ];

        if (
          event.shiftKey &&
          document.activeElement ===
            first
        ) {
          event.preventDefault();

          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement ===
            last
        ) {
          event.preventDefault();

          first.focus();
        }
      }
    };

    document.body.style.overflow =
      "hidden";

    window.setTimeout(
      () =>
        closeStoryRef.current?.focus(),
      0,
    );

    document.addEventListener(
      "keydown",
      closeOnKey,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        closeOnKey,
      );
    };
  }, [
    activeStory,
  ]);

  const ActiveStoryIcon =
    activeStory?.icon;

  return (
    <>
      <section className="hero-section home-hero relative bg-[#211b17] text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(184,149,104,.42),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(111,80,54,.3),transparent_26%)]" />
        </div>

        <div className="hero-content shell relative z-10">
          <div className="hero-editorial-grid relative z-30">
            <div>
              <p className="eyebrow !text-xs !tracking-[.22em] !text-[#e8d2b1]">
                <Sparkles
                  className="mr-2 inline"
                  size={15}
                />

                {t(
                  "home.eyebrow",
                )}
              </p>

              <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[.94] tracking-[-.075em] sm:text-7xl">
                {t(
                  "home.heroTitle",
                  {
                    accent:
                      t(
                        "home.heroAccent",
                      ),
                  },
                )}
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-stone-300">
                {t(
                  "home.heroCopy",
                )}
              </p>

              <div className="mt-8">
                <RentoraAiHeroSearch />
              </div>

              <div className="mt-5">
                <SearchForm />
              </div>
            </div>

            <aside className="hero-side-story">
              <div className="hero-side-window">
                <span className="text-[11px] font-black uppercase tracking-[.18em] text-[#e7c89f]">
                  {t(
                    "home.sideEyebrow",
                  )}
                </span>

                <h2>
                  {t(
                    "home.sideTitle",
                  )
                    .split("\n")
                    .map(
                      (
                        line,
                        index,
                      ) => (
                        <span
                          key={
                            line
                          }
                        >
                          {index >
                            0 && (
                            <br />
                          )}

                          {
                            line
                          }
                        </span>
                      ),
                    )}
                </h2>

                <p>
                  {t(
                    "home.sideCopy",
                  )}
                </p>

                <div className="hero-side-points">
                  <span>
                    {t(
                      "home.searchIntent",
                    )}
                  </span>

                  <span>
                    {t(
                      "home.decideContext",
                    )}
                  </span>
                </div>
              </div>

              <div className="hero-side-stats">
                <div>
                  <strong>
                    01
                  </strong>

                  <span>
                    {t(
                      "home.simpleDiscovery",
                    )}
                  </span>
                </div>

                <div>
                  <strong>
                    02
                  </strong>

                  <span>
                    {t(
                      "home.directConversations",
                    )}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="home-story-section">
        <div className="shell">
          <div className="home-section-intro">
            <div>
              <p className="eyebrow">
                {t(
                  "home.approach",
                )}
              </p>

              <h2>
                {t(
                  "home.approachTitle",
                )}
              </h2>
            </div>

            <p>
              {t(
                "home.approachCopy",
              )}
            </p>
          </div>

          <div className="home-story-grid">
            {stories.map(
              (story) => {
                const Icon =
                  story.icon;

                return (
                  <button
                    type="button"
                    className={`home-story-card ${story.tone}`}
                    onClick={() =>
                      setActiveStory(
                        story,
                      )
                    }
                    key={
                      story.id
                    }
                    aria-haspopup="dialog"
                  >
                    <span className="home-story-icon">
                      <Icon
                        size={
                          21
                        }
                      />
                    </span>

                    <span className="home-story-copy">
                      <strong>
                        {
                          story.title
                        }
                      </strong>

                      <small>
                        {
                          story.summary
                        }
                      </small>
                    </span>

                    <span className="home-story-action">
                      {t(
                        "common.learnMore",
                      )}

                      <ArrowRight
                        size={
                          15
                        }
                      />
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>
      </section>

      <section className="home-section homes-section">
        <div className="shell">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {t(
                  "home.freshListings",
                )}
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {t(
                  "home.homesWorthSeeing",
                )}
              </h1>

              <p className="home-heading-copy">
                {t(
                  "home.freshListingsCopy",
                )}
              </p>
            </div>

            <Link
              href="/properties"
              className="hidden items-center gap-2 font-semibold text-[#a77d54] sm:flex"
            >
              {t(
                "home.seeAllHomes",
              )}

              <ArrowRight
                size={17}
              />
            </Link>
          </div>

          {!user &&
          !authLoading ? (
            <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
              <p className="font-semibold text-stone-900">
                {t(
                  "home.signInForListings",
                )}
              </p>

              <Link
                href="/login"
                className="btn-primary mt-5"
              >
                {t(
                  "navigation.logIn",
                )}
              </Link>
            </div>
          ) : error ? (
            <ErrorBlock
              message={error}
              retry={load}
            />
          ) : (
            <div className="listing-grid">
              {loading
                ? [
                    1,
                    2,
                    3,
                  ].map(
                    (
                      item,
                    ) => (
                      <PropertySkeleton
                        key={
                          item
                        }
                      />
                    ),
                  )
                : properties
                    .slice(
                      0,
                      3,
                    )
                    .map(
                      (
                        property,
                      ) => (
                        <PropertyCard
                          key={
                            property.id
                          }
                          property={
                            property
                          }
                        />
                      ),
                    )}
            </div>
          )}

          {user &&
            !loading &&
            !error &&
            !properties.length && (
              <Empty
                label={t(
                  "home.noActiveHomes",
                )}
              />
            )}
        </div>
      </section>

      <section className="home-section home-benefits-section">
        <div className="shell">
          <div className="home-section-intro home-feature-intro">
            <div>
              <p className="eyebrow">
                {t(
                  "home.usefulByDesign",
                )}
              </p>

              <h2>
                {t(
                  "home.toolsTitle",
                )}
              </h2>
            </div>

            <p>
              {t(
                "home.toolsCopy",
              )}
            </p>
          </div>

          <div className="home-feature-grid">
            {benefits.map(
              ([
                Icon,
                title,
                text,
              ]) => (
                <div
                  className="home-feature-card"
                  key={
                    title
                  }
                >
                  <span>
                    <Icon
                      size={
                        21
                      }
                    />
                  </span>

                  <h3>
                    {title}
                  </h3>

                  <p>
                    {text}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="home-section home-cta-section">
        <div className="shell">
          <div className="home-listing-cta">
            <div>
              <p>
                {t(
                  "home.readyToList",
                )}
              </p>

              <h2>
                {t(
                  "home.listingCtaTitle",
                )}
              </h2>

              <span>
                {t(
                  "home.listingCtaCopy",
                )}
              </span>
            </div>

            <Link
              className="home-listing-cta-action"
              href="/properties/create"
            >
              {t(
                "home.createListing",
              )}

              <ArrowRight
                size={17}
              />
            </Link>
          </div>
        </div>
      </section>

      {activeStory &&
        ActiveStoryIcon && (
          <StoryDialog
            story={
              activeStory
            }
            Icon={
              ActiveStoryIcon
            }
            closeRef={
              closeStoryRef
            }
            onClose={() =>
              setActiveStory(
                null,
              )
            }
          />
        )}
    </>
  );
}

function StoryDialog({
  story,
  Icon,
  closeRef,
  onClose,
}: {
  story: Story;
  Icon: Story["icon"];
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const { t } =
    useI18n();

  const href =
    story.id ===
    "armenia"
      ? "/map"
      : story.id ===
          "why"
        ? "/properties"
        : story.id ===
            "what"
          ? "/search"
          : "/properties";

  return (
    <div
      className="home-story-backdrop"
      role="presentation"
      onMouseDown={
        onClose
      }
    >
      <section
        className="home-story-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-story-title"
        aria-describedby="home-story-intro"
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >
        <div className="home-story-dialog-top">
          <div>
            <span className="home-story-dialog-icon">
              <Icon
                size={22}
              />
            </span>

            <p className="eyebrow">
              {t(
                "home.approach",
              )}
            </p>
          </div>

          <button
            ref={closeRef}
            type="button"
            className="home-story-close"
            onClick={onClose}
            aria-label={t(
              "common.close",
            )}
          >
            <X
              size={19}
            />
          </button>
        </div>

        <h2 id="home-story-title">
          {story.title}
        </h2>

        <LocalizedStoryContent
          id={story.id}
        />

        <div className="home-story-dialog-footer">
          <Link
            href={href}
            className="btn-primary"
            onClick={onClose}
          >
            {story.action}

            <ArrowRight
              size={16}
            />
          </Link>

          <button
            type="button"
            className="home-story-close-text"
            onClick={onClose}
          >
            {t(
              "common.close",
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

function LocalizedStoryContent({
  id,
}: {
  id: StoryId;
}) {
  const {
    t,
    tList,
  } = useI18n();

  const key =
    `homeModal.${id}`;

  const secondBody =
    t(
      `${key}.secondBody`,
    );

  const thirdBody =
    t(
      `${key}.thirdBody`,
    );

  const thirdKicker =
    t(
      `${key}.thirdKicker`,
    );

  const closing =
    t(
      `${key}.closing`,
    );

  return (
    <>
      <p
        id="home-story-intro"
        className="home-story-lead"
      >
        {t(
          `${key}.lead`,
        )}
      </p>

      <StorySection
        title={t(
          `${key}.firstTitle`,
        )}
      >
        {t(
          `${key}.firstBody`,
        ) && (
          <p>
            {t(
              `${key}.firstBody`,
            )}
          </p>
        )}

        {tList(
          `${key}.chips`,
        ).length >
          0 && (
          <ChipList
            items={tList(
              `${key}.chips`,
            )}
          />
        )}
      </StorySection>

      <StorySection
        title={t(
          `${key}.secondTitle`,
        )}
      >
        {secondBody && (
          <p>
            {
              secondBody
            }
          </p>
        )}
      </StorySection>

      {thirdBody && (
        <StorySection
          title={t(
            `${key}.thirdTitle`,
          )}
          kicker={
            thirdKicker ||
            undefined
          }
        >
          <p>
            {thirdBody}
          </p>
        </StorySection>
      )}

      {closing && (
        <p className="home-story-closing">
          {closing}
        </p>
      )}
    </>
  );
}

function StorySection({
  title,
  kicker,
  highlight = false,
  children,
}: {
  title: string;
  kicker?: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`home-story-detail-section ${
        highlight
          ? "is-highlight"
          : ""
      }`}
    >
      {kicker && (
        <p className="home-story-section-kicker">
          {kicker}
        </p>
      )}

      <h3>
        {title}
      </h3>

      {children}
    </section>
  );
}

function ChipList({
  items,
}: {
  items: string[];
}) {
  return (
    <ul className="home-story-chip-list">
      {items.map(
        (item) => (
          <li key={item}>
            <Check
              size={13}
            />

            {item}
          </li>
        ),
      )}
    </ul>
  );
}

export function Empty({
  label,
}: {
  label: string;
}) {
  const { t } =
    useI18n();

  return (
    <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <p className="font-semibold">
        {label}
      </p>

      <p className="mt-2 text-sm text-stone-500">
        {t(
          "search.emptyHint",
        )}
      </p>
    </div>
  );
}

export function ErrorBlock({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  const { t } =
    useI18n();

  return (
    <div className="mt-10 rounded-3xl border border-rose-100 bg-rose-50 p-7">
      <p className="font-semibold text-rose-700">
        {message}
      </p>

      <button
        onClick={retry}
        className="btn-secondary mt-4 text-sm"
      >
        {t(
          "common.tryAgain",
        )}
      </button>
    </div>
  );
}