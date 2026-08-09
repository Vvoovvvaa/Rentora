"use client";

import { Send, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, apiMessage, chatApi } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { ChatMessage, ChatRoom } from "@/types/models";

export function ChatPanel({ selectedRoomId }: { selectedRoomId?: number }) {
  const { user } = useAuth(); const [rooms, setRooms] = useState<ChatRoom[]>([]); const [active, setActive] = useState<number | undefined>(selectedRoomId); const [messages, setMessages] = useState<ChatMessage[]>([]); const [text, setText] = useState(""); const [error, setError] = useState(""); const socketRef = useRef<Socket | null>(null); const activeRef = useRef<number | undefined>(undefined);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { chatApi.rooms().then((data) => { setRooms(data); setActive((current) => current || selectedRoomId || data[0]?.id); }).catch((reason) => setError(apiMessage(reason))); }, [selectedRoomId]);
  useEffect(() => { if (!active) return; chatApi.messages(active).then(setMessages).catch((reason) => setError(apiMessage(reason))); const token = localStorage.getItem("rentora_token"); const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || API_URL, { auth: { token } }); socketRef.current = socket; socket.emit("joinRoom", active);
    const onMessage = (message: ChatMessage) => { if (message.roomId !== activeRef.current) return; setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]); };
    socket.on("newMessage", onMessage);
    return () => { socket.off("newMessage", onMessage); socket.disconnect(); if (socketRef.current === socket) socketRef.current = null; };
  }, [active]);
  const send = (event: React.FormEvent) => { event.preventDefault(); const body = text.trim(); if (!active || !body || !socketRef.current) return; socketRef.current.emit("sendMessage", { roomId: active, text: body }); setText(""); };
  return <div className="chat-surface"><aside className="chat-sidebar"><div><p className="eyebrow">Inbox</p><h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Messages</h1></div><div className="mt-6 flex gap-2 overflow-x-auto md:grid">{rooms.map((room) => <button key={room.id} onClick={() => setActive(room.id)} className={`chat-room ${active === room.id ? "is-active" : ""}`}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm"><UserRound size={18}/></span><span><strong>Conversation #{room.id}</strong><small>Property #{room.propertyId}</small></span></button>)}</div>{!rooms.length && !error && <p className="mt-6 text-sm leading-6 text-slate-500">Start a conversation from a listing to see it here.</p>}</aside><section className="flex min-h-[560px] flex-col"><header className="chat-header"><div><p className="text-sm font-bold text-slate-900">{active ? `Conversation #${active}` : "Choose a conversation"}</p><p className="mt-0.5 text-xs text-slate-400">Messages are delivered in real time</p></div><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50"/></header><div className="chat-feed">{error && <p className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p>}{messages.map((message) => { const mine = message.senderId === user?.id; return <div key={message.id} className={`message-row ${mine ? "is-mine" : ""}`}><div className={`message-bubble ${mine ? "is-mine" : ""}`}><p>{message.text}</p><time dateTime={message.createdAt}>{new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</time></div></div>; })}</div><form onSubmit={send} className="chat-composer"><input disabled={!active} value={text} onChange={(event) => setText(event.target.value)} className="field" placeholder="Write a message…"/><button disabled={!active || !text.trim()} className="btn-primary grid h-11 w-11 shrink-0 place-items-center p-0" aria-label="Send message"><Send size={18}/></button></form></section></div>;
}
