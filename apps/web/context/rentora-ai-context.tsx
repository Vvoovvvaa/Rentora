"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  aiApi,
  apiMessage,
} from "@/lib/api";

import { useAuth } from "@/context/auth-context";

import type {
  AiConversationMessage,
  AiPropertyResult,
} from "@/types/models";

const AI_STORAGE_KEY =
  "rentora_ai_conversation_v1";

const AI_MAX_MESSAGE_LENGTH = 500;

type RentoraAiContextValue = {
  messages: AiConversationMessage[];

  isOpen: boolean;

  loading: boolean;

  hydrated: boolean;

  error: string;

  draft: string;

  previousResponseId?: string;

  openPanel: () => void;

  closePanel: () => void;

  togglePanel: () => void;

  setDraft: (value: string) => void;

  sendMessage: (
    message: string,
  ) => Promise<void>;

  retryMessage: (
    messageId: string,
  ) => Promise<void>;

  resetConversation: () => void;

  clearError: () => void;
};

type PersistedAiState = {
  messages: AiConversationMessage[];

  previousResponseId?: string;

  draft: string;

  isOpen: boolean;
};

const RentoraAiContext =
  createContext<RentoraAiContextValue | null>(
    null,
  );

function createMessageId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createUserMessage(
  text: string,
): AiConversationMessage {
  return {
    id: createMessageId(),

    role: "user",

    text,

    status: "sending",
  };
}

function createAssistantMessage(
  text: string,
  properties: AiPropertyResult[],
): AiConversationMessage {
  return {
    id: createMessageId(),

    role: "assistant",

    text,

    properties,

    status: "sent",
  };
}

export function RentoraAiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    messages,
    setMessages,
  ] = useState<
    AiConversationMessage[]
  >([]);

  const [
    previousResponseId,
    setPreviousResponseId,
  ] = useState<
    string | undefined
  >(undefined);

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    hydrated,
    setHydrated,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    draft,
    setDraft,
  ] = useState("");

  /*
   * Restore the current AI conversation
   * when the frontend is mounted.
   */
  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem(
          AI_STORAGE_KEY,
        );

      if (!stored) {
        setHydrated(true);

        return;
      }

      const parsed =
        JSON.parse(
          stored,
        ) as Partial<PersistedAiState>;

      if (
        Array.isArray(
          parsed.messages,
        )
      ) {
        setMessages(
          parsed.messages,
        );
      }

      if (
        typeof parsed.previousResponseId ===
        "string"
      ) {
        setPreviousResponseId(
          parsed.previousResponseId,
        );
      }

      if (
        typeof parsed.draft ===
        "string"
      ) {
        setDraft(
          parsed.draft,
        );
      }

      if (
        typeof parsed.isOpen ===
        "boolean"
      ) {
        setIsOpen(
          parsed.isOpen,
        );
      }
    } catch {
      sessionStorage.removeItem(
        AI_STORAGE_KEY,
      );
    } finally {
      setHydrated(true);
    }
  }, []);

  /*
   * Persist conversation while the user
   * navigates around Rentora.
   */
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const state: PersistedAiState = {
      messages,

      previousResponseId,

      draft,

      isOpen,
    };

    try {
      sessionStorage.setItem(
        AI_STORAGE_KEY,
        JSON.stringify(
          state,
        ),
      );
    } catch {
      /*
       * AI still works even if browser
       * storage is unavailable.
       */
    }
  }, [
    messages,
    previousResponseId,
    draft,
    isOpen,
    hydrated,
  ]);

  const openPanel =
    useCallback(() => {
      setIsOpen(true);
    }, []);

  const closePanel =
    useCallback(() => {
      setIsOpen(false);
    }, []);

  const togglePanel =
    useCallback(() => {
      setIsOpen(
        (current) =>
          !current,
      );
    }, []);

  const clearError =
    useCallback(() => {
      setError("");
    }, []);

  const executeMessage =
    useCallback(
      async (
        userMessage: AiConversationMessage,
      ) => {
        setLoading(true);

        setError("");

        try {
          const response =
            await aiApi.chat({
              message:
                userMessage.text,

              ...(previousResponseId
                ? {
                    previousResponseId,
                  }
                : {}),
            });

          /*
           * Mark the user message
           * as successfully sent.
           */
          setMessages(
            (current) =>
              current.map(
                (message) =>
                  message.id ===
                  userMessage.id
                    ? {
                        ...message,
                        status:
                          "sent",
                      }
                    : message,
              ),
          );

          /*
           * Add AI answer.
           */
          const assistantMessage =
            createAssistantMessage(
              response.message,
              response.properties ??
                [],
            );

          setMessages(
            (current) => [
              ...current,
              assistantMessage,
            ],
          );

          /*
           * This ID is what allows:
           *
           * User:
           * Find apartments in Gyumri
           *
           * User:
           * Only with parking
           *
           * to remain one conversation.
           */
          if (
            response.responseId
          ) {
            setPreviousResponseId(
              response.responseId,
            );
          }

          setDraft("");
        } catch (reason) {
          setMessages(
            (current) =>
              current.map(
                (message) =>
                  message.id ===
                  userMessage.id
                    ? {
                        ...message,
                        status:
                          "error",
                      }
                    : message,
              ),
          );

          setError(
            apiMessage(
              reason,
            ),
          );
        } finally {
          setLoading(false);
        }
      },
      [
        previousResponseId,
      ],
    );

  const sendMessage =
    useCallback(
      async (
        rawMessage: string,
      ) => {
        if (
          loading ||
          authLoading
        ) {
          return;
        }

        const message =
          rawMessage.trim();

        if (!message) {
          return;
        }

        if (
          message.length >
          AI_MAX_MESSAGE_LENGTH
        ) {
          setError(
            `Message must be ${AI_MAX_MESSAGE_LENGTH} characters or fewer.`,
          );

          return;
        }

        /*
         * The AI entry remains visible
         * for guests.
         *
         * The real /ai/chat endpoint
         * requires AuthGuard, so guests
         * are sent through the existing
         * Rentora login flow.
         */
        if (!user) {
          setDraft(
            message,
          );

          setIsOpen(true);

          router.push(
            "/login",
          );

          return;
        }

        setIsOpen(true);

        setError("");

        const userMessage =
          createUserMessage(
            message,
          );

        setMessages(
          (current) => [
            ...current,
            userMessage,
          ],
        );

        await executeMessage(
          userMessage,
        );
      },
      [
        loading,
        authLoading,
        user,
        router,
        executeMessage,
      ],
    );

  const retryMessage =
    useCallback(
      async (
        messageId: string,
      ) => {
        if (loading) {
          return;
        }

        const message =
          messages.find(
            (item) =>
              item.id ===
                messageId &&
              item.role ===
                "user",
          );

        if (!message) {
          return;
        }

        setMessages(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                message.id
                  ? {
                      ...item,
                      status:
                        "sending",
                    }
                  : item,
            ),
        );

        await executeMessage(
          {
            ...message,

            status:
              "sending",
          },
        );
      },
      [
        loading,
        messages,
        executeMessage,
      ],
    );

  const resetConversation =
    useCallback(() => {
      setMessages([]);

      setPreviousResponseId(
        undefined,
      );

      setDraft("");

      setError("");

      try {
        sessionStorage.removeItem(
          AI_STORAGE_KEY,
        );
      } catch {
        /*
         * Ignore unavailable storage.
         */
      }
    }, []);

  const value =
    useMemo<RentoraAiContextValue>(
      () => ({
        messages,

        isOpen,

        loading,

        hydrated,

        error,

        draft,

        previousResponseId,

        openPanel,

        closePanel,

        togglePanel,

        setDraft,

        sendMessage,

        retryMessage,

        resetConversation,

        clearError,
      }),
      [
        messages,
        isOpen,
        loading,
        hydrated,
        error,
        draft,
        previousResponseId,
        openPanel,
        closePanel,
        togglePanel,
        sendMessage,
        retryMessage,
        resetConversation,
        clearError,
      ],
    );

  return (
    <RentoraAiContext.Provider
      value={value}
    >
      {children}
    </RentoraAiContext.Provider>
  );
}

export function useRentoraAi() {
  const context =
    useContext(
      RentoraAiContext,
    );

  if (!context) {
    throw new Error(
      "useRentoraAi must be used inside RentoraAiProvider",
    );
  }

  return context;
}