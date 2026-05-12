import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, Loader2, XCircle, User, MapPin, Vote } from "lucide-react";
import logoRadar from "@/assets/logo-radar-eleitoral.png";

import { usePublicRegistration } from "@/hooks/usePublicRegistration";
import { RegistrationStepHeader } from "@/components/public-registration/RegistrationStepHeader";
import { StepDadosPessoais } from "@/components/public-registration/StepDadosPessoais";
import { StepEndereco } from "@/components/public-registration/StepEndereco";
import { StepDadosPoliticos } from "@/components/public-registration/StepDadosPoliticos";

type Step = "dados" | "endereco" | "politico";
const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "dados", label: "Dados Pessoais", icon: <User className="h-4 w-4" /> },
  { key: "endereco", label: "Endereço", icon: <MapPin className="h-4 w-4" /> },
  { key: "politico", label: "Dados Políticos", icon: <Vote className="h-4 w-4" /> },
];

export default function PublicRegistration() {
  const { slug } = useParams();
  const { 
    tenantId, 
    tenantName, 
    leaderName, 
    form, 
    loading, 
    saving, 
    geocoding, 
    submitted, 
    cpfValid,
    actions 
  } = usePublicRegistration(slug);

  const [currentStep, setCurrentStep] = useState<Step>("dados");
  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const goNext = () => {
    if (currentStep === "dados") {
      if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
      const cleanedCpf = form.cpf.replace(/\D/g, "");
      if (!cleanedCpf || cleanedCpf.length !== 11) { toast.error("CPF é obrigatório"); return; }
      if (cpfValid === false) { toast.error("CPF inválido"); return; }
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) setCurrentStep(steps[nextIndex].key);
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setCurrentStep(steps[prevIndex].key);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await actions.handleSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-10 space-y-3">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg font-semibold">Link inválido ou expirado</p>
            <p className="text-sm text-muted-foreground">Solicite um novo link ao responsável.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-10 space-y-4">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Cadastro realizado!</h2>
            <p className="text-sm text-muted-foreground">Obrigado por se cadastrar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <img src={logoRadar} alt="Radar Eleitoral" className="h-7 w-7 rounded" />
          <span className="font-bold text-base">RADAR ELEITORAL</span>
        </div>
        {tenantName && <p className="text-center text-sm font-medium mt-1">{tenantName}</p>}
        {leaderName && <p className="text-center text-xs text-muted-foreground">Liderança: <strong>{leaderName}</strong></p>}
      </div>

      <RegistrationStepHeader 
        steps={steps} 
        currentStepIndex={currentStepIndex} 
        onStepClick={setCurrentStep} 
      />

      <div className="px-4 pb-32 max-w-lg mx-auto">
        <form onSubmit={handleSubmitForm}>
          {currentStep === "dados" && (
            <StepDadosPessoais 
              form={form} 
              updateForm={actions.updateForm} 
              cpfValid={cpfValid} 
              onCpfBlur={actions.handleCpfBlur} 
            />
          )}

          {currentStep === "endereco" && (
            <StepEndereco 
              form={form} 
              updateForm={actions.updateForm} 
              geocoding={geocoding} 
              onCepBlur={actions.handleCepBlur} 
            />
          )}

          {currentStep === "politico" && (
            <StepDadosPoliticos 
              form={form} 
              updateForm={actions.updateForm} 
            />
          )}

          {/* Footer fixo com navegação */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
            <div className="max-w-lg mx-auto flex gap-3">
              {currentStepIndex > 0 && (
                <Button type="button" variant="outline" onClick={goPrev} className="flex-1 h-12">
                  Voltar
                </Button>
              )}
              {currentStepIndex < steps.length - 1 ? (
                <Button type="button" onClick={goNext} className="flex-1 h-12">
                  Próximo
                </Button>
              ) : (
                <Button type="submit" disabled={saving} className="flex-1 h-12">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Finalizar Cadastro
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
