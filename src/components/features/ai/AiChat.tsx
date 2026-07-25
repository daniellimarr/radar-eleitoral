import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Eraser, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { SUGGESTED_QUESTIONS } from "@/components/features/ai/aiCatalog";
import { describeAiError } from "@/lib/aiRouting";
import logo from "@/assets/ai-consultant-logo.png";

const STORAGE_KEY = "radar-ai-consultor-conversa";
const AI_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

/** Lê a conversa única persistida neste navegador. */
function loadStoredMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

export function AiChat() {
  const initialMessages = useMemo(loadStoredMessages, []);
  const [input, setInput] = useState("");
  const composerRef = useRef<HTMLDivElement | null>(null);

  /** PromptInputTextarea não encaminha ref, então buscamos o elemento no formulário. */
  const focusTextarea = useCallback(() => {
    composerRef.current?.querySelector("textarea")?.focus();
  }, []);

  // Injeta o token da sessão a cada requisição (o token expira/rotaciona).
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: AI_ENDPOINT,
        body: { task: "chat", preference: "auto" },
        fetch: async (url, options) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(options?.headers);
          headers.set("Authorization", `Bearer ${data.session?.access_token ?? ""}`);
          return fetch(url, { ...options, headers });
        },
      }),
    [],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: "consultor-ia",
    messages: initialMessages,
    transport,
    onError: (error) => toast.error(describeAiError(null, error.message)),
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* cota do localStorage excedida: conversa segue apenas em memória */
    }
  }, [messages]);

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!isBusy) focusTextarea();
  }, [isBusy, focusTextarea]);

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || isBusy) return;
      setInput("");
      void sendMessage({ text: value });
    },
    [isBusy, sendMessage],
  );

  const clear = () => {
    setMessages([]);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="flex h-[calc(100vh-19rem)] min-h-[520px] flex-col">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Consultor IA Eleitoral" width={40} height={40} className="h-10 w-10" loading="lazy" />
            <div>
              <CardTitle className="text-base">Consultor IA Eleitoral</CardTitle>
              <p className="text-xs text-muted-foreground">
                Analisa os dados agregados da sua campanha
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clear} disabled={messages.length === 0}>
            <Eraser className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="gap-4">
              {messages.length === 0 && (
                <div className="mx-auto max-w-md py-10 text-center">
                  <img src={logo} alt="" width={64} height={64} className="mx-auto h-16 w-16" loading="lazy" />
                  <p className="mt-4 font-medium">Pronto para analisar sua campanha</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pergunte sobre estratégia, eleitores, finanças, bairros prioritários ou agenda.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <MessageResponse key={index}>{part.text}</MessageResponse>
                      ) : null,
                    )}
                  </MessageContent>
                </Message>
              ))}

              {status === "submitted" && <Shimmer>Analisando os dados da campanha...</Shimmer>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div ref={composerRef}>
          <PromptInput
            onSubmit={(_message, event) => {
              event.preventDefault();
              submit(input);
            }}
          >
            <PromptInputTextarea
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="Pergunte qualquer coisa sobre sua campanha..."
            />
            <PromptInputFooter className="justify-between">
              <span className="text-[11px] text-muted-foreground">
                Enter envia • Shift+Enter nova linha
              </span>
              <PromptInputSubmit status={status} disabled={!input.trim() && !isBusy} />
            </PromptInputFooter>
          </PromptInput>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-primary" />
            Perguntas sugeridas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px] pr-3">
            <div className="space-y-4">
              {SUGGESTED_QUESTIONS.map((group) => (
                <div key={group.group}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.group}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <Button
                        key={item.label}
                        variant="outline"
                        size="sm"
                        className="h-auto rounded-full py-1 text-xs"
                        disabled={isBusy}
                        onClick={() => submit(item.prompt)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default AiChat;
