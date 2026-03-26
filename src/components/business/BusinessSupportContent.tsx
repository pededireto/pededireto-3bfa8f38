import { useState } from "react";
import { MessageCircle, Send, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SupportMessage {
  id: string;
  content: string;
  sender: "user" | "staff";
  senderName: string;
  timestamp: string;
  read: boolean;
}

interface SupportConversation {
  id: string;
  staffName: string;
  lastMessage: string;
  lastDate: string;
  unread: boolean;
  status: "open" | "resolved";
}

// Mock data for initial UI
const MOCK_CONVERSATIONS: SupportConversation[] = [
  {
    id: "1",
    staffName: "Equipa PedeDireto",
    lastMessage: "Bem-vindo à PedeDireto! Estamos aqui para ajudar. 🎉",
    lastDate: "Hoje",
    unread: true,
    status: "open",
  },
];

const MOCK_MESSAGES: SupportMessage[] = [
  {
    id: "1",
    content: "Bem-vindo à PedeDireto! 🎉 Estamos aqui para te ajudar a tirar o máximo partido da plataforma. Se tiveres alguma dúvida, é só escrever!",
    sender: "staff",
    senderName: "Equipa PedeDireto",
    timestamp: "Hoje, 10:00",
    read: true,
  },
];

const BusinessSupportContent = ({ businessId }: { businessId: string }) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>(MOCK_MESSAGES);

  const handleSend = () => {
    if (!messageText.trim()) return;
    const newMsg: SupportMessage = {
      id: Date.now().toString(),
      content: messageText,
      sender: "user",
      senderName: "Tu",
      timestamp: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessageText("");
  };

  // List view
  if (!selectedConversation) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suporte PedeDireto</h1>
          <p className="text-sm text-muted-foreground">A equipa responde normalmente em menos de 2h</p>
        </div>

        <div className="space-y-2">
          {MOCK_CONVERSATIONS.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-card shadow-card hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{conv.staffName}</span>
                  <span className="text-xs text-muted-foreground">{conv.lastDate}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread && (
                <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center text-[10px] px-1">
                  1
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Precisas de ajuda? A nossa equipa está disponível para te apoiar.
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => setSelectedConversation("1")}
          >
            Enviar mensagem
          </Button>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
      {/* Chat header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSelectedConversation(null)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button
          onClick={() => setSelectedConversation(null)}
          className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold">Equipa PedeDireto</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                {msg.sender === "staff" && (
                  <p className="text-xs font-medium mb-1 opacity-70">{msg.senderName}</p>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.timestamp}
                  {msg.sender === "user" && " ✓✓"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Escreve uma mensagem..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="icon" onClick={handleSend} disabled={!messageText.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BusinessSupportContent;
