import { BarChart3, MessageCircle, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AiChat } from "@/components/features/ai/AiChat";
import { AiAnalyses } from "@/components/features/ai/AiAnalyses";
import { AiTools } from "@/components/features/ai/AiTools";
import logo from "@/assets/ai-consultant-logo.png";

/** Página do Assistente IA: chat consultivo, análises e ferramentas de conteúdo. */
export default function AiAssistant() {
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Assistente IA do Radar Eleitoral" width={44} height={44} className="h-11 w-11" />
          <div>
            <h1 className="text-2xl font-bold">Assistente IA</h1>
            <p className="text-sm text-muted-foreground">Consultor inteligente da campanha</p>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit">
          IA ativa · Gemini + GPT-5.5
        </Badge>
      </header>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat com Consultor IA
          </TabsTrigger>
          <TabsTrigger value="analyses" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Análises
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-2">
            <Wrench className="h-4 w-4" />
            Ferramentas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <AiChat />
        </TabsContent>
        <TabsContent value="analyses">
          <AiAnalyses />
        </TabsContent>
        <TabsContent value="tools">
          <AiTools />
        </TabsContent>
      </Tabs>
    </div>
  );
}
