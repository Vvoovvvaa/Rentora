"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CircleDot, ImageOff, MessageCircle, Send, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { apiMessage, chatApi, getSocketServerUrl, propertiesApi } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { ChatMessage, ChatRoom, Property } from "@/types/models";
import { useI18n } from "@/context/i18n-context";

type RoomContext = { property?: Property; lastMessage?: ChatMessage };

const messageTime = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "";
const messageDayKey = (value?: string) => value ? new Date(value).toDateString() : "";
const isSameDay = (first?: string, second?: string) => messageDayKey(first) === messageDayKey(second);

function DateSeparator({ value }: { value: string }) {
  const { t } = useI18n();
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const label = date.toDateString() === today.toDateString() ? t("messages.today") : date.toDateString() === yesterday.toDateString() ? t("messages.yesterday") : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  return <div className="chat-day" aria-label={label}><span>{label}</span></div>;
}

export function ChatPanel({ selectedRoomId }: { selectedRoomId?: number }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [active, setActive] = useState<number | undefined>(selectedRoomId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<Record<number, RoomContext>>({});
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketReady, setSocketReady] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const activeRef = useRef<number | undefined>(undefined);
  const feedRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottom = useRef(true);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    let mounted = true;
    chatApi.rooms().then((data) => {
      if (!mounted) return;
      setRooms(data);
      setActive((current) => current || selectedRoomId || data[0]?.id);
      void Promise.all(data.map(async (room) => {
        const [property, roomMessages] = await Promise.all([
          propertiesApi.one(room.propertyId).catch(() => undefined),
          chatApi.messages(room.id).catch(() => []),
        ]);
        return [room.id, { property, lastMessage: roomMessages.at(-1) }] as const;
      })).then((entries) => {
        if (mounted) setContext(Object.fromEntries(entries));
      });
    }).catch((reason) => setError(apiMessage(reason))).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [selectedRoomId]);

  useEffect(() => {
    if (!active) {
      const timer = window.setTimeout(() => setMessages([]), 0);
      return () => window.clearTimeout(timer);
    }
    const mounted = true;
    const errorTimer = window.setTimeout(() => setError(""), 0);
    chatApi.messages(active).then((items) => { if (mounted) setMessages(items); }).catch((reason) => mounted && setError(apiMessage(reason)));
    const unreadTimer = window.setTimeout(() => setUnread((current) => ({ ...current, [active]: 0 })), 0);
    const token = localStorage.getItem("rentora_token");
    const socket = io(getSocketServerUrl(), { auth: { token } });
    socketRef.current = socket;
    const joinRoom = () => {
      socket.timeout(10_000).emit("joinRoom", active, (joinError: Error | null) => {
        if (!mounted || !joinError) return;
        setSocketReady(false);
        setError(t("messages.connectionFailed"));
      });
    };
    const onConnect = () => {
      if (!mounted) return;
      setSocketReady(true);
      joinRoom();
    };
    const onConnectError = () => {
      if (!mounted) return;
      setSocketReady(false);
      setError(t("messages.connectionFailed"));
    };
    const onMessage = (message: ChatMessage) => {
      setContext((current) => ({ ...current, [message.roomId]: { ...current[message.roomId], lastMessage: message } }));
      if (message.roomId !== activeRef.current) {
        setUnread((current) => ({ ...current, [message.roomId]: (current[message.roomId] || 0) + 1 }));
        return;
      }
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    };
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("newMessage", onMessage);
    if (socket.connected) onConnect();
    return () => {
      window.clearTimeout(errorTimer);
      window.clearTimeout(unreadTimer);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("newMessage", onMessage);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [active, t]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || (!shouldStickToBottom.current && messages.length)) return;
    feed.scrollTo({ top: feed.scrollHeight, behavior: "smooth" });
  }, [messages, active]);

  const activeRoom = useMemo(() => rooms.find((room) => room.id === active), [active, rooms]);
  const activeContext = active ? context[active] : undefined;
  const activeTitle = activeContext?.property?.title || (activeRoom ? `#${activeRoom.propertyId}` : "");
  const selectRoom = (roomId: number) => {
    shouldStickToBottom.current = true;
    setActive(roomId);
    setUnread((current) => ({ ...current, [roomId]: 0 }));
  };
  const send = (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    const socket = socketRef.current;
    if (!active || !body || !socket || !socket.connected || sending) return;

    setSending(true);
    setError("");
    socket.timeout(10_000).emit(
      "sendMessage",
      { roomId: active, text: body },
      (sendError: Error | null, message?: ChatMessage) => {
        setSending(false);
        if (sendError || !message?.id) {
          setError(t("messages.sendFailed"));
          return;
        }

        setText("");
        setContext((current) => ({
          ...current,
          [message.roomId]: {
            ...current[message.roomId],
            lastMessage: message,
          },
        }));
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
      },
    );
  };
  const handleFeedScroll = () => {
    const feed = feedRef.current;
    if (!feed) return;
    shouldStickToBottom.current = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 96;
  };

  return <div className={`chat-shell ${active ? "has-active-chat" : ""}`}>
    <aside className="chat-sidebar" aria-label={t("messages.conversations")}>
      <div className="chat-sidebar-head">
        <div><p className="eyebrow">{t("messages.conversations")}</p><h1>{t("messages.title")}</h1><p className="chat-sidebar-copy">{t("messages.conversationCount", { count: rooms.length })}</p></div>
        <span className="chat-room-count" aria-label={t("messages.conversationCount", { count: rooms.length })}>{rooms.length}</span>
      </div>
      <div className="chat-room-list" aria-label={t("messages.conversations")}>
        {loading && [1, 2, 3].map((item) => <div className="chat-room-skeleton" key={item}/>) }
        {!loading && rooms.map((room) => {
          const roomContext = context[room.id];
          const image = roomContext?.property?.images?.[0]?.url;
          const propertyTitle = roomContext?.property?.title || `#${room.propertyId}`;
          return <button key={room.id} type="button" onClick={() => selectRoom(room.id)} className={`chat-room ${active === room.id ? "is-active" : ""}`} aria-pressed={active === room.id}>
            <span className="chat-room-thumb">{image ? <img src={image} alt=""/> : <ImageOff size={16}/>}</span>
            <span className="chat-room-copy">
              <span className="chat-room-title"><strong title={propertyTitle}>{propertyTitle}</strong><time>{messageTime(roomContext?.lastMessage?.createdAt)}</time></span>
              <span>{t("messages.propertyConversation")}</span>
              <p>{roomContext?.lastMessage?.text || t("messages.noMessages")}</p>
            </span>
            {unread[room.id] ? <b className="chat-unread">{unread[room.id]}</b> : null}
          </button>;
        })}
      </div>
      {!loading && !rooms.length && <div className="chat-empty-list"><MessageCircle size={24}/><strong>{t("messages.noConversations")}</strong><p>{t("messages.noConversationsCopy")}</p></div>}
    </aside>

    <section className="chat-main" aria-label={t("messages.title")}>
      <header className="chat-main-header">
        <div className="chat-header-identity">
          <button type="button" onClick={() => setActive(undefined)} className="chat-back-button" aria-label={t("messages.backToConversations")}><ArrowLeft size={18}/></button>
          <span className="chat-header-thumbnail">{activeContext?.property?.images?.[0]?.url ? <img src={activeContext.property.images[0].url} alt=""/> : <UserRound size={20}/>}</span>
          <div className="min-w-0"><h2 title={activeTitle}>{active ? activeTitle : t("messages.title")}</h2><p>{active ? t("messages.propertyConversation") : t("messages.selectConversation")}</p></div>
        </div>
        {activeRoom && <Link href={`/properties/${activeRoom.propertyId}`} className="chat-property-link">{t("common.viewProperty")} <ArrowUpRight size={15}/></Link>}
      </header>

      <div ref={feedRef} onScroll={handleFeedScroll} className="chat-messages" aria-live="polite">
        {error && <p className="chat-error">{error}</p>}
        {!active && !error && <div className="chat-empty-state"><MessageCircle size={30}/><h2>{t("messages.title")}</h2><p>{t("messages.selectConversation")}</p></div>}
        {active && !messages.length && !error && <div className="chat-empty-state"><CircleDot size={27}/><h2>{t("messages.noMessages")}</h2><p>{t("messages.messageOwner")}</p></div>}
        {messages.map((message, index) => {
          const mine = message.senderId === user?.id;
          const previous = messages[index - 1];
          const next = messages[index + 1];
          const previousSameSender = previous?.senderId === message.senderId && isSameDay(previous?.createdAt, message.createdAt);
          const nextSameSender = next?.senderId === message.senderId && isSameDay(next?.createdAt, message.createdAt);
          const showDay = !previous || !isSameDay(previous.createdAt, message.createdAt);
          return <div className={`chat-message-group ${mine ? "is-own" : ""} ${previousSameSender ? "is-continuation" : ""} ${nextSameSender ? "has-next" : ""}`} key={message.id}>
            {showDay && <DateSeparator value={message.createdAt}/>}
            <div className={`chat-message ${mine ? "is-own" : ""}`}><div className="chat-bubble"><p>{message.text}</p><time dateTime={message.createdAt}>{messageTime(message.createdAt)}</time></div></div>
          </div>;
        })}
      </div>

      <form onSubmit={send} className="chat-composer">
        <textarea disabled={!active || sending} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={2000} placeholder={active ? t("messages.typeMessage") : t("messages.chooseConversationFirst")} aria-label={t("messages.typeMessage")}/>
        <button type="submit" disabled={!active || !socketReady || !text.trim() || sending} className="chat-send" aria-label={sending ? t("messages.sending") : t("messages.send")}><Send size={18}/><span>{sending ? t("messages.sending") : t("messages.send")}</span></button>
      </form>
    </section>
  </div>;
}
