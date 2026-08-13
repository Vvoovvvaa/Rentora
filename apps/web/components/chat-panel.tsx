"use client";

import Link from "next/link";
import { ArrowUpRight, CircleDot, ImageOff, MessageCircle, Send, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, apiMessage, chatApi, propertiesApi } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { ChatMessage, ChatRoom, Property } from "@/types/models";

type RoomContext = { property?: Property; lastMessage?: ChatMessage };
const messageTime = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "";
const messageDay = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value)) : "";

export function ChatPanel({ selectedRoomId }: { selectedRoomId?: number }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [active, setActive] = useState<number | undefined>(selectedRoomId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<Record<number, RoomContext>>({});
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const activeRef = useRef<number | undefined>(undefined);
  const feedRef = useRef<HTMLDivElement>(null);

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
    if (!active) { setMessages([]); return; }
    let mounted = true;
    chatApi.messages(active).then((items) => { if (mounted) setMessages(items); }).catch((reason) => mounted && setError(apiMessage(reason)));
    setUnread((current) => ({ ...current, [active]: 0 }));
    const token = localStorage.getItem("rentora_token");
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || API_URL, { auth: { token } });
    socketRef.current = socket;
    socket.emit("joinRoom", active);
    const onMessage = (message: ChatMessage) => {
      setContext((current) => ({ ...current, [message.roomId]: { ...current[message.roomId], lastMessage: message } }));
      if (message.roomId !== activeRef.current) {
        setUnread((current) => ({ ...current, [message.roomId]: (current[message.roomId] || 0) + 1 }));
        return;
      }
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    };
    socket.on("newMessage", onMessage);
    return () => { socket.off("newMessage", onMessage); socket.disconnect(); if (socketRef.current === socket) socketRef.current = null; };
  }, [active]);

  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }); }, [messages, active]);
  const activeRoom = useMemo(() => rooms.find((room) => room.id === active), [active, rooms]);
  const activeContext = active ? context[active] : undefined;
  const counterpart = activeRoom ? activeRoom.ownerId === user?.id ? "Interested renter" : "Property owner" : "";
  const selectRoom = (roomId: number) => { setActive(roomId); setUnread((current) => ({ ...current, [roomId]: 0 })); };
  const send = (event: React.FormEvent) => { event.preventDefault(); const body = text.trim(); if (!active || !body || !socketRef.current) return; socketRef.current.emit("sendMessage", { roomId: active, text: body }); setText(""); };

  return <div className="chat-shell">
    <aside className="chat-sidebar">
      <div className="chat-sidebar-head"><div><p className="eyebrow">Your inbox</p><h1>Messages</h1></div><span className="chat-room-count">{rooms.length}</span></div>
      <p className="chat-sidebar-copy">Conversations linked to your Rentora listings and enquiries.</p>
      <div className="chat-room-list" aria-label="Conversations">
        {loading && [1, 2, 3].map((item) => <div className="chat-room-skeleton" key={item}/>) }
        {!loading && rooms.map((room) => {
          const roomContext = context[room.id]; const image = roomContext?.property?.images?.[0]?.url; const propertyTitle = roomContext?.property?.title || `Property #${room.propertyId}`; const other = room.ownerId === user?.id ? "Interested renter" : "Property owner";
          return <button key={room.id} onClick={() => selectRoom(room.id)} className={`chat-room ${active === room.id ? "is-active" : ""}`} aria-pressed={active === room.id}>
            <span className="chat-room-image">{image ? <img src={image} alt=""/> : <ImageOff size={16}/>}</span>
            <span className="chat-room-text"><strong>{other}</strong><small className="truncate">{propertyTitle}</small><em className="truncate">{roomContext?.lastMessage?.text || "No messages yet"}</em></span>
            <span className="chat-room-meta"><time>{messageTime(roomContext?.lastMessage?.createdAt)}</time>{unread[room.id] ? <b>{unread[room.id]}</b> : null}</span>
          </button>;
        })}
      </div>
      {!loading && !rooms.length && <div className="chat-empty-list"><MessageCircle size={22}/><p>Start a conversation from a property to see it here.</p></div>}
    </aside>
    <section className="chat-conversation">
      <header className="chat-header">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f3eadf] text-[#8a6745]"><UserRound size={19}/></span><div className="min-w-0"><p>{active ? counterpart : "Choose a conversation"}</p><small className="truncate">{activeContext?.property?.title || (activeRoom ? `Property #${activeRoom.propertyId}` : "Select a conversation from your inbox")}</small></div></div>
        {activeRoom && <Link href={`/properties/${activeRoom.propertyId}`} className="chat-property-link">View property <ArrowUpRight size={15}/></Link>}
      </header>
      <div ref={feedRef} className="chat-feed" aria-live="polite">
        {error && <p className="chat-error">{error}</p>}
        {!active && !error && <div className="chat-empty-state"><MessageCircle size={29}/><h2>Your conversations, in one place</h2><p>Select a conversation to review property details and messages.</p></div>}
        {active && !messages.length && !error && <div className="chat-empty-state"><CircleDot size={25}/><h2>Start the conversation</h2><p>Send a message to discuss this property directly.</p></div>}
        {messages.map((message, index) => { const mine = message.senderId === user?.id; const previous = messages[index - 1]; const showDay = !previous || messageDay(previous.createdAt) !== messageDay(message.createdAt); return <div key={message.id}>{showDay && <p className="chat-day"><span>{messageDay(message.createdAt)}</span></p>}<div className={`message-row ${mine ? "is-mine" : ""}`}><div className={`message-bubble ${mine ? "is-mine" : ""}`}><p>{message.text}</p><time dateTime={message.createdAt}>{messageTime(message.createdAt)}</time></div></div></div>; })}
      </div>
      <form onSubmit={send} className="chat-composer"><input disabled={!active} value={text} onChange={(event) => setText(event.target.value)} className="field" placeholder={active ? "Write a message…" : "Choose a conversation first"}/><button disabled={!active || !text.trim()} className="btn-primary chat-send" aria-label="Send message"><Send size={18}/></button></form>
    </section>
  </div>;
}
