"use client";

import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Currency,
  PropertyFeature,
  PropertyListing,
} from "@/types/models";

import {
  currencyOptions,
  getFeatureGroups,
  getListingOptions,
} from "./property-form-options";

import { CustomSelect } from "./custom-select";

import {
  categoryLabels,
  cityOf,
  getFeatureLabel,
} from "./property-presentation";

import {
  applySearchState,
  searchStateFromParams,
  type SearchFormState,
} from "@/lib/property-search";

import { useI18n } from "@/context/i18n-context";

import styles from "./property-search.module.css";

const cities = [
  "YEREVAN",
  "GYUMRI",
  "VANADZOR",
  "DILIJAN",
  "TSAGHKADZOR",
  "SEVAN",
  "JERMUK",
];

type SearchFormProps = {
  compact?: boolean;

  submitPath?: string;

  state?: SearchFormState;

  onChange?: <
    Key extends keyof SearchFormState,
  >(
    key: Key,
    value: SearchFormState[Key],
  ) => void;

  onSubmit?: (
    state: SearchFormState,
  ) => void;
};

export function SearchForm({
  compact = false,
  submitPath = "/search",
  state,
  onChange,
  onSubmit,
}: SearchFormProps) {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const { t } = useI18n();

  const query =
    searchParams.toString();

  const urlState = useMemo(
    () =>
      searchStateFromParams(
        new URLSearchParams(query),
      ),
    [query],
  );

  const [
    localForm,
    setLocalForm,
  ] =
    useState<SearchFormState>(
      urlState,
    );

  const [
    advancedOpen,
    setAdvancedOpen,
  ] = useState(false);

  const form =
    state ?? localForm;

  useEffect(() => {
    if (state) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setLocalForm(urlState);
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [state, urlState]);

  const set = <
    Key extends keyof SearchFormState,
  >(
    key: Key,
    value: SearchFormState[Key],
  ) => {
    if (onChange) {
      onChange(key, value);
      return;
    }

    setLocalForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  };

  const submit = (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (onSubmit) {
      onSubmit(form);
      return;
    }

    const params =
      applySearchState(
        new URLSearchParams(),
        form,
      );

    router.push(
      `${submitPath}${
        params.size
          ? `?${params.toString()}`
          : ""
      }`,
    );
  };

  const featureOptions =
    getFeatureGroups(
      (id) =>
        t(`property.${id}`),
    ).flatMap(
      (group) =>
        group.options.map(
          (option) => ({
            value:
              option.value,

            label:
              getFeatureLabel(
                option.value,
              ),
          }),
        ),
    );

  /*
   * ======================================================
   * SEARCH НА HOME
   * ======================================================
   */

  if (!compact) {
    return (
      <form
        onSubmit={submit}
        className="hero-search rounded-3xl border border-white/15 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur-md"
      >
        <CustomSelect
          value={form.city}
          onChange={(value) =>
            set("city", value)
          }
          placeholder={t(
            "search.anyCity",
          )}
          ariaLabel={t(
            "property.city",
          )}
          options={cities.map(
            (city) => ({
              value: city,
              label: cityOf(city),
            }),
          )}
        />

        <CustomSelect
          value={
            form.category
          }
          onChange={(value) =>
            set(
              "category",
              value,
            )
          }
          placeholder={t(
            "search.anyHomeType",
          )}
          ariaLabel={t(
            "search.anyHomeType",
          )}
          options={Object.entries(
            categoryLabels,
          ).map(
            ([value, label]) => ({
              value,
              label,
            }),
          )}
        />

        <CustomSelect
          value={form.listing}
          onChange={(value) =>
            set(
              "listing",
              value as
                | PropertyListing
                | "",
            )
          }
          placeholder={t(
            "search.saleOrRent",
          )}
          ariaLabel={t(
            "search.saleOrRent",
          )}
          options={
            getListingOptions()
          }
        />

        <CustomSelect
          value={form.rooms}
          onChange={(value) =>
            set("rooms", value)
          }
          placeholder={t(
            "search.anyRooms",
          )}
          ariaLabel={t(
            "property.rooms",
          )}
          options={[
            1,
            2,
            3,
            4,
            5,
          ].map((rooms) => ({
            value:
              String(rooms),

            label:
              `${rooms} ${t(
                "common.rooms",
              )}`,
          }))}
        />

        <button
          type="submit"
          className="btn-primary gap-2"
        >
          <Search size={18} />

          {t(
            "search.searchHomes",
          )}
        </button>
      </form>
    );
  }

  /*
   * ======================================================
   * PROPERTIES SEARCH
   * ======================================================
   */

  return (
    <form
      onSubmit={submit}
      className={styles.search}
    >
      {/* ROW 1 */}

      <div
        className={
          styles.primaryRow
        }
      >
        <SearchSelect>
          <CustomSelect
            value={form.city}
            onChange={(value) =>
              set("city", value)
            }
            placeholder={t(
              "search.anyCity",
            )}
            ariaLabel={t(
              "property.city",
            )}
            options={cities.map(
              (city) => ({
                value: city,
                label:
                  cityOf(city),
              }),
            )}
          />
        </SearchSelect>

        <SearchSelect>
          <CustomSelect
            value={
              form.category
            }
            onChange={(value) =>
              set(
                "category",
                value,
              )
            }
            placeholder={t(
              "search.anyHomeType",
            )}
            ariaLabel={t(
              "search.anyHomeType",
            )}
            options={Object.entries(
              categoryLabels,
            ).map(
              ([
                value,
                label,
              ]) => ({
                value,
                label,
              }),
            )}
          />
        </SearchSelect>

        <SearchSelect>
          <CustomSelect
            value={
              form.listing
            }
            onChange={(value) =>
              set(
                "listing",
                value as
                  | PropertyListing
                  | "",
              )
            }
            placeholder={t(
              "search.saleOrRent",
            )}
            ariaLabel={t(
              "search.saleOrRent",
            )}
            options={
              getListingOptions()
            }
          />
        </SearchSelect>

        <SearchSelect>
          <CustomSelect
            value={form.rooms}
            onChange={(value) =>
              set(
                "rooms",
                value,
              )
            }
            placeholder={t(
              "search.anyRooms",
            )}
            ariaLabel={t(
              "property.rooms",
            )}
            options={[
              1,
              2,
              3,
              4,
              5,
            ].map(
              (rooms) => ({
                value:
                  String(rooms),

                label:
                  `${rooms} ${t(
                    "common.rooms",
                  )}`,
              }),
            )}
          />
        </SearchSelect>
      </div>

      {/* ROW 2 */}

      <div
        className={
          styles.secondaryRow
        }
      >
        <SearchNumber
          value={
            form.minPrice
          }
          placeholder={t(
            "search.priceFrom",
          )}
          onChange={(value) =>
            set(
              "minPrice",
              value,
            )
          }
        />

        <SearchNumber
          value={
            form.maxPrice
          }
          placeholder={t(
            "search.priceTo",
          )}
          onChange={(value) =>
            set(
              "maxPrice",
              value,
            )
          }
        />

        <button
          type="button"
          className={`${styles.advancedButton} ${
            advancedOpen
              ? styles.advancedButtonActive
              : ""
          }`}
          onClick={() =>
            setAdvancedOpen(
              (current) =>
                !current,
            )
          }
          aria-expanded={
            advancedOpen
          }
        >
          <span
            className={
              styles.advancedIcon
            }
          >
            <SlidersHorizontal
              size={16}
            />
          </span>

          <span>
            {advancedOpen
              ? t(
                  "search.hideAdvancedFilters",
                )
              : t(
                  "search.advancedFilters",
                )}
          </span>
        </button>

        <button
          type="submit"
          className={
            styles.searchButton
          }
        >
          <Search size={18} />

          <span>
            {t(
              "search.searchHomes",
            )}
          </span>
        </button>
      </div>

      {/* ADVANCED */}

      {advancedOpen && (
        <div
          className={
            styles.advanced
          }
        >
          <div
            className={
              styles.advancedGrid
            }
          >
            <AdvancedNumber
              value={
                form.bedrooms
              }
              placeholder={t(
                "property.bedrooms",
              )}
              onChange={(value) =>
                set(
                  "bedrooms",
                  value,
                )
              }
            />

            <AdvancedNumber
              value={
                form.floor
              }
              placeholder={t(
                "property.floor",
              )}
              onChange={(value) =>
                set(
                  "floor",
                  value,
                )
              }
            />

            <AdvancedNumber
              value={
                form.constructionYear
              }
              placeholder={t(
                "search.constructionYear",
              )}
              onChange={(value) =>
                set(
                  "constructionYear",
                  value,
                )
              }
            />

            <AdvancedNumber
              value={form.area}
              placeholder={t(
                "search.exactArea",
              )}
              onChange={(value) =>
                set(
                  "area",
                  value,
                )
              }
            />

            <SearchSelect
              advanced
            >
              <CustomSelect
                value={
                  form.currency
                }
                onChange={(value) =>
                  set(
                    "currency",
                    value as
                      | Currency
                      | "",
                  )
                }
                placeholder={t(
                  "search.anyCurrency",
                )}
                ariaLabel={t(
                  "search.anyCurrency",
                )}
                options={
                  currencyOptions
                }
              />
            </SearchSelect>

            <SearchSelect
              advanced
            >
              <CustomSelect
                value={
                  form.features
                }
                onChange={(value) =>
                  set(
                    "features",
                    value as
                      | PropertyFeature
                      | "",
                  )
                }
                placeholder={t(
                  "search.anyFeature",
                )}
                ariaLabel={t(
                  "search.anyFeature",
                )}
                options={
                  featureOptions
                }
              />
            </SearchSelect>
          </div>
        </div>
      )}
    </form>
  );
}

/*
 * ======================================================
 * SMALL COMPONENTS
 * ======================================================
 */

function SearchSelect({
  children,
  advanced = false,
}: {
  children:
    React.ReactNode;

  advanced?: boolean;
}) {
  return (
    <div
      className={`${styles.filterBox} ${
        advanced
          ? styles.advancedBox
          : ""
      }`}
    >
      {children}
    </div>
  );
}

function SearchNumber({
  value,
  placeholder,
  onChange,
}: {
  value: string;

  placeholder: string;

  onChange:
    (value: string) =>
      void;
}) {
  return (
    <label
      className={
        styles.numberBox
      }
    >
      <input
        value={value}
        inputMode="numeric"
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value.replace(
              /\D/g,
              "",
            ),
          )
        }
      />
    </label>
  );
}

function AdvancedNumber({
  value,
  placeholder,
  onChange,
}: {
  value: string;

  placeholder: string;

  onChange:
    (value: string) =>
      void;
}) {
  return (
    <label
      className={
        styles.advancedNumber
      }
    >
      <input
        value={value}
        inputMode="numeric"
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value.replace(
              /\D/g,
              "",
            ),
          )
        }
      />
    </label>
  );
}