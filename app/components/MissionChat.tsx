"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Mail, MessageSquare, X } from "lucide-react";
import type { Message, Mission } from "@/lib/types";
import { formatDateWithTimezones } from "@/lib/dateUtils";

interface MissionChatProps {
  mission: Mission;
  currentUserEmail: string;
  currentUserRole: "client" | "prestataire" | "admin";
  lang?: "fr" | "en";
}

const TEXT = {
  fr: {
    chat: "Chat",
    messages: "Messages",
    envoyerMessage: "Envoyer un message",
    ecrireMessage: "Écrire un message...",
    envoyer: "Envoyer",
    envoyerParEmail: "Envoyer par email",
    chatDirect: "Chat direct",
    aucunMessage: "Aucun message pour le moment",
    vous: "Vous",
    prestataire: "Prestataire",
    client: "Client",
    admin: "Admin LeBoy",
    nouveauMessage: "Nouveau message",
    typeMessage: "Type de message",
    choisirType: "Choisir le type de message",
    messageAdmin: "Tous les messages passent par l'administrateur LeBoy",
    messageClient: "Vos messages sont envoyés à l'administrateur LeBoy",
    messagePrestataire: "Vos messages sont envoyés à l'administrateur LeBoy",
  },
  en: {
    chat: "Chat",
    messages: "Messages",
    envoyerMessage: "Send a message",
    ecrireMessage: "Write a message...",
    envoyer: "Send",
    envoyerParEmail: "Send by email",
    chatDirect: "Direct chat",
    aucunMessage: "No messages yet",
    vous: "You",
    prestataire: "Provider",
    client: "Client",
    admin: "LeBoy Admin",
    nouveauMessage: "New message",
    typeMessage: "Message type",
    choisirType: "Choose message type",
    messageAdmin: "All messages go through LeBoy administrator",
    messageClient: "Your messages are sent to LeBoy administrator",
    messagePrestataire: "Your messages are sent to LeBoy administrator",
  },
} as const;

export function MissionChat({ mission, currentUserEmail, currentUserRole, lang = "fr" }: MissionChatProps) {
  const t = TEXT[lang];
  const [messages, setMessages] = useState<Message[]>(mission.messages || []);
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState<"chat" | "email">("chat");
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Pour l'admin : choisir le destinataire (client ou prestataire)
  const [adminRecipient, setAdminRecipient] = useState<"client" | "prestataire">("client");

  // Charger les messages périodiquement
  useEffect(() => {
    if (!showChat) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/missions/${mission.id}/messages`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Erreur chargement messages:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Rafraîchir toutes les 3 secondes

    return () => clearInterval(interval);
  }, [mission.id, showChat]);

  // Scroller vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fonction pour obtenir l'email de l'admin
  const getAdminEmail = (): string => {
    // Utiliser l'email admin par défaut
    return process.env.NEXT_PUBLIC_ADMIN_EMAIL || "contact@leboy.com";
  };

  const getRecipient = (): { role: "client" | "prestataire" | "admin"; email: string } => {
    if (currentUserRole === "client") {
      // Le client envoie toujours à l'admin
      return { role: "admin", email: getAdminEmail() };
    } else if (currentUserRole === "prestataire") {
      // Le prestataire envoie toujours à l'admin
      return { role: "admin", email: getAdminEmail() };
    } else {
      // Admin peut répondre au client ou au prestataire
      // Par défaut, on répond au client (sera modifiable dans l'interface admin)
      return { role: "client", email: mission.clientEmail };
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    let recipient = getRecipient();
    
    // Si c'est l'admin, utiliser le destinataire choisi
    if (currentUserRole === "admin") {
      if (adminRecipient === "client") {
        recipient = { role: "client", email: mission.clientEmail };
      } else if (adminRecipient === "prestataire" && mission.prestataireId) {
        // Récupérer l'email du prestataire
        try {
          const prestataireRes = await fetch(`/api/prestataires/${mission.prestataireId}`);
          if (prestataireRes.ok) {
            const prestataireData = await prestataireRes.json();
            recipient = { role: "prestataire", email: prestataireData.prestataire?.email || "" };
          }
        } catch (err) {
          console.error("Erreur récupération prestataire:", err);
        }
      }
    }

    try {
      const res = await fetch(`/api/missions/${mission.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient.role,
          toEmail: recipient.email || mission.clientEmail,
          content: newMessage.trim(),
          type: messageType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        
        // Si c'est un email, afficher un message de confirmation
        if (messageType === "email") {
          alert(lang === "fr" 
            ? "✅ Message envoyé par email !" 
            : "✅ Message sent by email!");
        }
      } else {
        const error = await res.json();
        alert(error.error || (lang === "fr" ? "Erreur lors de l'envoi" : "Error sending message"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors de l'envoi du message" : "Error sending message");
    } finally {
      setSending(false);
    }
  };

  const getAuthorLabel = (message: Message): string => {
    if (message.fromEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      return t.vous;
    }
    if (message.from === "admin") return t.admin;
    if (message.from === "prestataire") return t.prestataire;
    return t.client;
  };

  if (!showChat) {
    return (
      <button
        onClick={() => setShowChat(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8A55F] text-white text-sm font-semibold rounded-md hover:bg-[#B8944F] transition"
      >
        <MessageSquare className="w-4 h-4" />
        {t.chat}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E2E8] flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-[#0A1B2A]">{t.chat}</h3>
            <p className="text-xs text-[#6B7280]">
              {mission.ref} - {mission.titre}
            </p>
          </div>
          <button
            onClick={() => setShowChat(false)}
            className="text-[#6B7280] hover:text-[#0A1B2A] text-2xl leading-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message informatif selon le rôle */}
        <div className="px-4 pt-3">
          {currentUserRole === "client" && (
            <p className="text-xs text-[#6B7280] bg-blue-50 p-2 rounded-md border border-blue-200">
              ℹ️ {t.messageClient}
            </p>
          )}
          {currentUserRole === "prestataire" && (
            <p className="text-xs text-[#6B7280] bg-blue-50 p-2 rounded-md border border-blue-200">
              ℹ️ {t.messagePrestataire}
            </p>
          )}
          {currentUserRole === "admin" && (
            <p className="text-xs text-[#6B7280] bg-green-50 p-2 rounded-md border border-green-200">
              ℹ️ {t.messageAdmin}
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280] text-sm">{t.aucunMessage}</div>
          ) : (
            messages.map((message) => {
              const isOwn = message.fromEmail.toLowerCase() === currentUserEmail.toLowerCase();
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn
                        ? "bg-[#C8A55F] text-white"
                        : "bg-[#F9F9FB] text-[#0A1B2A] border border-[#E2E2E8]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">
                          {getAuthorLabel(message)}
                        </span>
                        {message.type === "email" && (
                          <Mail className="w-3 h-3 opacity-75" />
                        )}
                      </div>
                      <div className="text-[10px] opacity-75 space-y-0.5 text-right">
                        <div>🇨🇲 {formatDateWithTimezones(message.createdAt).cameroon}</div>
                        <div>🇨🇦 {formatDateWithTimezones(message.createdAt).canada}</div>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#E2E2E8] space-y-3">
          {/* Type de message */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-[#0A1B2A]">{t.typeMessage}:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMessageType("chat")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  messageType === "chat"
                    ? "bg-[#C8A55F] text-white"
                    : "bg-[#F9F9FB] text-[#6B7280] border border-[#E2E2E8]"
                }`}
              >
                <MessageSquare className="w-3 h-3 inline mr-1" />
                {t.chatDirect}
              </button>
              <button
                type="button"
                onClick={() => setMessageType("email")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  messageType === "email"
                    ? "bg-[#C8A55F] text-white"
                    : "bg-[#F9F9FB] text-[#6B7280] border border-[#E2E2E8]"
                }`}
              >
                <Mail className="w-3 h-3 inline mr-1" />
                {t.envoyerParEmail}
              </button>
            </div>
          </div>

          {/* Sélecteur de destinataire pour l'admin */}
          {currentUserRole === "admin" && (
            <div className="flex items-center gap-3 p-3 bg-[#F9F9FB] rounded-lg border border-[#E2E2E8]">
              <label className="text-xs font-medium text-[#0A1B2A]">
                {lang === "fr" ? "Répondre à :" : "Reply to:"}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-[#0A1B2A] cursor-pointer">
                  <input
                    type="radio"
                    name="adminRecipient"
                    value="client"
                    checked={adminRecipient === "client"}
                    onChange={() => setAdminRecipient("client")}
                    className="w-3 h-3 text-[#C8A55F] border-gray-300 focus:ring-[#C8A55F]"
                  />
                  {t.client}
                </label>
                {mission.prestataireId && (
                  <label className="flex items-center gap-2 text-xs text-[#0A1B2A] cursor-pointer">
                    <input
                      type="radio"
                      name="adminRecipient"
                      value="prestataire"
                      checked={adminRecipient === "prestataire"}
                      onChange={() => setAdminRecipient("prestataire")}
                      className="w-3 h-3 text-[#C8A55F] border-gray-300 focus:ring-[#C8A55F]"
                    />
                    {t.prestataire}
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSend} className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t.ecrireMessage}
              className="flex-1 px-3 py-2 text-sm border border-[#DDDDDD] rounded-md focus:outline-none focus:border-[#C8A55F] resize-none"
              rows={2}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-[#0A1B2A] text-white text-sm font-semibold rounded-md hover:bg-[#07121e] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

