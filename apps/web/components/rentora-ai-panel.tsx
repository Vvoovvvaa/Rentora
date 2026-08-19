"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUp,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
} from "react";

import {
  usePathname,
} from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/context/i18n-context";
import { useRentoraAi } from "@/context/rentora-ai-context";

import { getRentoraAiCopy } from "@/lib/rentora-ai-copy";

import { RentoraAiPropertyCard } from "./rentora-ai-property-card";

const HIDDEN_PATHS = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/account-blocked",
];

export function RentoraAiPanel() {
  const pathname =
    usePathname();

  const { user } =
    useAuth();

  const { locale } =
    useI18n();

  const {
    messages,
    isOpen,
    loading,
    error,
    draft,
    setDraft,
    closePanel,
    sendMessage,
    retryMessage,
    resetConversation,
  } = useRentoraAi();

  const copy =
    getRentoraAiCopy(locale);

  const scrollRef =
    useRef<HTMLDivElement>(
      null,
    );

  const hidden =
    HIDDEN_PATHS.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(
          `${path}/`,
        ),
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape"
      ) {
        closePanel();
      }
    };

    document.addEventListener(
      "keydown",
      closeOnEscape,
    );

    return () =>
      document.removeEventListener(
        "keydown",
        closeOnEscape,
      );
  }, [
    isOpen,
    closePanel,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const element =
      scrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  }, [
    messages,
    loading,
    error,
    isOpen,
  ]);

  if (
    hidden ||
    !isOpen
  ) {
    return null;
  }

  const submit = async () => {
    await sendMessage(draft);
  };

  return (
    <>
      <button
        type="button"
        aria-label={copy.close}
        onClick={closePanel}
        className="fixed inset-0 z-[60] bg-[#1d1713]/35 backdrop-blur-[2px] sm:hidden"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Rentora AI"
        className="fixed inset-x-3 bottom-3 top-[86px] z-[70] flex overflow-hidden rounded-[30px] border border-[#ead9c5] bg-[#fbf8f3] shadow-[0_30px_90px_rgba(34,24,17,.38)] sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[72vh] sm:max-h-[720px] sm:min-h-[520px] sm:w-[430px]"
      >
        <div className="flex min-h-0 w-full flex-col">
          <header className="flex flex-none items-center justify-between gap-4 border-b border-[#eadfd3] bg-[#fffdf9]/95 px-5 py-4 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 flex-none place-items-center rounded-[14px] bg-[#4b392b] text-[#f1d3a7] shadow-sm">
                <Sparkles
                  size={18}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-black tracking-[-.02em] text-[#30251e]">
                    Rentora AI
                  </h2>

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>

                <p className="mt-0.5 truncate text-[10px] font-semibold text-stone-500">
                  {
                    copy.panelSubtitle
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    resetConversation
                  }
                  title={
                    copy.reset
                  }
                  aria-label={
                    copy.reset
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl text-stone-500 transition hover:bg-[#f0e6da] hover:text-[#684b35]"
                >
                  <RotateCcw
                    size={16}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={
                  closePanel
                }
                aria-label={
                  copy.close
                }
                className="grid h-9 w-9 place-items-center rounded-xl text-stone-500 transition hover:bg-[#f0e6da] hover:text-[#684b35]"
              >
                <X
                  size={18}
                />
              </button>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
          >
            {messages.length ===
              0 && (
              <div className="flex min-h-full flex-col justify-center py-8">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] border border-[#e4ccb0] bg-[#f3e5d4] text-[#765338] shadow-sm">
                  <Sparkles
                    size={23}
                  />
                </div>

                <h3 className="mt-5 text-center text-xl font-black tracking-[-.04em] text-[#33271f]">
                  {
                    copy.welcomeTitle
                  }
                </h3>

                <p className="mx-auto mt-2 max-w-[310px] text-center text-[13px] leading-6 text-stone-500">
                  {
                    copy.welcomeText
                  }
                </p>

                {!user && (
                  <div className="mx-auto mt-5 rounded-2xl border border-[#e6d4bf] bg-white px-4 py-3 text-center">
                    <p className="text-xs font-semibold text-stone-600">
                      {
                        copy.guestHint
                      }
                    </p>

                    <Link
                      href="/login"
                      className="mt-2 inline-flex text-xs font-black text-[#8b6241] hover:underline"
                    >
                      {
                        copy.signIn
                      }
                    </Link>
                  </div>
                )}

                <p className="mx-auto mt-6 max-w-[300px] text-center text-[10px] leading-5 text-stone-400">
                  {
                    copy.disclaimer
                  }
                </p>
              </div>
            )}

            <div className="grid gap-5">
              {messages.map(
                (message) => {
                  const isUser =
                    message.role ===
                    "user";

                  return (
                    <div
                      key={
                        message.id
                      }
                      className={
                        isUser
                          ? "flex justify-end"
                          : "flex justify-start"
                      }
                    >
                      <div
                        className={
                          isUser
                            ? "max-w-[84%]"
                            : "w-full max-w-[94%]"
                        }
                      >
                        {!isUser && (
                          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#96704e]">
                            <Sparkles
                              size={
                                11
                              }
                            />
                            Rentora AI
                          </div>
                        )}

                        <div
                          className={
                            isUser
                              ? "rounded-[20px] rounded-br-[7px] bg-[#49382c] px-4 py-3 text-[13px] leading-5 text-[#fffaf3] shadow-sm"
                              : "rounded-[20px] rounded-bl-[7px] border border-[#eadfd3] bg-white px-4 py-3 text-[13px] leading-6 text-[#51463d] shadow-[0_4px_15px_rgba(58,42,29,.04)]"
                          }
                        >
                          {
                            message.text
                          }
                        </div>

                        {message.status ===
                          "error" && (
                          <button
                            type="button"
                            onClick={() =>
                              void retryMessage(
                                message.id,
                              )
                            }
                            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-rose-700"
                          >
                            <RotateCcw
                              size={
                                12
                              }
                            />

                            {
                              copy.retry
                            }
                          </button>
                        )}

                        {!isUser &&
                          message
                            .properties &&
                          message
                            .properties
                            .length >
                            0 && (
                            <div className="mt-3 grid gap-2.5">
                              {message.properties.map(
                                (
                                  property,
                                ) => (
                                  <RentoraAiPropertyCard
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
                      </div>
                    </div>
                  );
                },
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-[18px] rounded-bl-[7px] border border-[#eadfd3] bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                      <Loader2
                        size={14}
                        className="animate-spin text-[#a8794f]"
                      />

                      {
                        copy.searching
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-5 text-rose-700">
                <AlertCircle
                  size={15}
                  className="mt-0.5 flex-none"
                />

                <span>
                  {error}
                </span>
              </div>
            )}
          </div>

          <footer className="flex-none border-t border-[#e8ddd0] bg-[#fffdf9] p-3.5">
            <form
              onSubmit={(
                event,
              ) => {
                event.preventDefault();

                void submit();
              }}
              className="flex items-end gap-2 rounded-[20px] border border-[#ded1c2] bg-[#f8f3ed] p-1.5 transition focus-within:border-[#b9936d] focus-within:bg-white"
            >
              <textarea
                rows={1}
                maxLength={500}
                value={draft}
                disabled={loading}
                placeholder={
                  copy.inputPlaceholder
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
                    event
                      .target
                      .value,
                  )
                }
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    !event.shiftKey &&
                    !event
                      .nativeEvent
                      .isComposing
                  ) {
                    event.preventDefault();

                    void submit();
                  }
                }}
                className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-[13px] leading-5 text-[#342a23] outline-none placeholder:text-stone-400 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !draft.trim()
                }
                aria-label={
                  copy.send
                }
                className="grid h-11 w-11 flex-none place-items-center rounded-[15px] bg-[#49382c] text-[#f4d8b0] shadow-sm transition hover:bg-[#5c4534] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {loading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <ArrowUp
                    size={17}
                    strokeWidth={
                      2.5
                    }
                  />
                )}
              </button>
            </form>
          </footer>
        </div>
      </aside>
    </>
  );
}