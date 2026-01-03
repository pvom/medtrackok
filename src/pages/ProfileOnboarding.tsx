import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Briefcase,
  TrendingUp,
  Target,
  Check,
  Calendar,
  Clock
} from "lucide-react";
import medtrackLogo from "@/assets/medtrack-logo.png";

interface OnboardingData {
  exclusivePlantonista: string;
  otherMedicalActivities: string[];
  otherIncomeSource: string;
  otherIncomeDescription: string;
  incomeStability: string;
  financialPriority: string;
  controlMethod: string;
  taxKnowledge: string;
  monthlyGoal: string;
  appHelp: string[];
}

const ProfileOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    exclusivePlantonista: "",
    otherMedicalActivities: [],
    otherIncomeSource: "",
    otherIncomeDescription: "",
    incomeStability: "",
    financialPriority: "",
    controlMethod: "",
    taxKnowledge: "",
    monthlyGoal: "",
    appHelp: []
  });

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("plantonmed_profile", JSON.stringify(data));
      setShowShiftDialog(true);
    }
  };

  const handleShiftChoice = (registerNow: boolean) => {
    setShowShiftDialog(false);
    if (registerNow) {
      navigate("/onboarding/plantoes");
    } else {
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const toggleArrayValue = (field: keyof OnboardingData, value: string) => {
    const currentArray = data[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    setData({ ...data, [field]: newArray });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center">
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-primary-light mx-auto mb-6 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Vamos personalizar sua experiência?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Essas perguntas rápidas nos ajudam a entender melhor sua rotina e a melhorar suas projeções, cálculos e recomendações financeiras.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Leva menos de 2 minutos.
            </p>
          </div>
        );

      case 1:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Como é a sua atuação médica hoje?</h2>
                <p className="text-sm text-muted-foreground">Isso nos ajuda a entender sua rotina</p>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Você atua exclusivamente como plantonista?</Label>
              <div className="space-y-3">
                {[
                  { value: "exclusive", label: "Sim, só faço plantões" },
                  { value: "medical_other", label: "Não, faço plantões e outras atividades médicas" },
                  { value: "non_medical", label: "Não, faço plantões e atividades fora da medicina" }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setData({ ...data, exclusivePlantonista: option.value })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      data.exclusivePlantonista === option.value
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="font-medium text-foreground">{option.label}</span>
                  </button>
                ))}
              </div>

              {data.exclusivePlantonista === "medical_other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3 pt-4"
                >
                  <Label className="text-base font-medium">Quais outras atividades médicas você exerce?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Consultório próprio",
                      "Procedimentos",
                      "Hospital/clínica com carga fixa",
                      "Cooperativa",
                      "Telemedicina",
                      "Residência/aperfeiçoamento",
                      "Aulas/palestras",
                      "Outra"
                    ].map(activity => (
                      <button
                        key={activity}
                        onClick={() => toggleArrayValue("otherMedicalActivities", activity)}
                        className={`p-3 rounded-lg border text-sm text-left transition-all ${
                          data.otherMedicalActivities.includes(activity)
                            ? "border-primary bg-primary-light text-primary font-medium"
                            : "border-border hover:border-primary/30 text-foreground"
                        }`}
                      >
                        {data.otherMedicalActivities.includes(activity) && (
                          <Check className="w-4 h-4 inline mr-1" />
                        )}
                        {activity}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {data.exclusivePlantonista === "non_medical" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3 pt-4"
                >
                  <Label className="text-base font-medium">Você possui outra fonte de renda fora da medicina?</Label>
                  <div className="flex gap-3">
                    {["Sim", "Não"].map(option => (
                      <button
                        key={option}
                        onClick={() => setData({ ...data, otherIncomeSource: option })}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                          data.otherIncomeSource === option
                            ? "border-primary bg-primary-light"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {data.otherIncomeSource === "Sim" && (
                    <Input
                      placeholder="Qual?"
                      value={data.otherIncomeDescription}
                      onChange={(e) => setData({ ...data, otherIncomeDescription: e.target.value })}
                    />
                  )}
                </motion.div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Situação financeira atual</h2>
                <p className="text-sm text-muted-foreground">Aqui entendemos sua estabilidade de renda, reservas e prioridades.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Sua renda é:</Label>
                {[
                  { value: "stable", label: "Estável", desc: "Valores parecidos todo mês" },
                  { value: "variable", label: "Variável", desc: "Depende muito dos plantões/extras" }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setData({ ...data, incomeStability: option.value })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      data.incomeStability === option.value
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="font-medium text-foreground">{option.label}</span>
                    <p className="text-sm text-muted-foreground">{option.desc}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Hoje, sua principal prioridade financeira é:</Label>
                {[
                  "Aumentar renda",
                  "Reduzir gastos",
                  "Organizar finanças e impostos",
                  "Investir melhor",
                  "Planejar independência financeira"
                ].map(option => (
                  <button
                    key={option}
                    onClick={() => setData({ ...data, financialPriority: option })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      data.financialPriority === option
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="font-medium text-foreground">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Organização e controle</h2>
                <p className="text-sm text-muted-foreground">Seu nível de gestão financeira</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Como você controla seus ganhos e gastos?</Label>
                {[
                  "Planilha manual",
                  "App genérico",
                  "Não costumo controlar",
                  "Outro"
                ].map(option => (
                  <button
                    key={option}
                    onClick={() => setData({ ...data, controlMethod: option })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      data.controlMethod === option
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="font-medium text-foreground">{option}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Você sabe quanto paga de impostos e taxas (ISS, IR, taxas da cooperativa etc.)?</Label>
                {[
                  "Sim",
                  "Tenho uma ideia aproximada",
                  "Não faço a menor ideia"
                ].map(option => (
                  <button
                    key={option}
                    onClick={() => setData({ ...data, taxKnowledge: option })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      data.taxKnowledge === option
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="font-medium text-foreground">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Metas e comportamento financeiro</h2>
                <p className="text-sm text-muted-foreground">Seus objetivos e como podemos te ajudar</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Qual é sua meta de recebimento líquido mensal?
                </Label>
                <p className="text-sm text-muted-foreground">Após todos os descontos de impostos e taxas</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={data.monthlyGoal}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      const formatted = (Number(value) / 100).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2
                      });
                      setData({ ...data, monthlyGoal: formatted });
                    }}
                    className="pl-12"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">O que você mais gostaria que o app te ajudasse a fazer?</Label>
                {[
                  "Calcular o quanto preciso trabalhar para atingir minha meta",
                  "Planejar férias e folgas sem perder renda",
                  "Controlar impostos e taxas",
                  "Comparar quanto rende cada hospital/setor",
                  "Todas as anteriores"
                ].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      if (option === "Todas as anteriores") {
                        // Toggle: se já está selecionada, desmarca tudo
                        if (data.appHelp.includes("Todas as anteriores")) {
                          setData({ ...data, appHelp: [] });
                        } else {
                          setData({ ...data, appHelp: [option] });
                        }
                      } else {
                        // Remove "Todas as anteriores" se estava selecionada
                        const filteredHelp = data.appHelp.filter(v => v !== "Todas as anteriores");
                        const newArray = filteredHelp.includes(option)
                          ? filteredHelp.filter(v => v !== option)
                          : [...filteredHelp, option];
                        setData({ ...data, appHelp: newArray });
                      }
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      data.appHelp.includes(option)
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {data.appHelp.includes(option) && (
                      <Check className="w-4 h-4 inline mr-2 text-primary" />
                    )}
                    <span className="font-medium text-foreground">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center">
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-success/10 mx-auto mb-6 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Check className="w-10 h-10 text-success" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Tudo pronto!
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Agora vamos te ajudar a organizar sua vida financeira como plantonista: metas, impostos/taxas, projeções, férias e muito mais.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return data.exclusivePlantonista !== "";
      case 2:
        return data.incomeStability !== "" && data.financialPriority !== "";
      case 3:
        return data.controlMethod !== "" && data.taxKnowledge !== "";
      case 4:
        return data.monthlyGoal !== "" && data.appHelp.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <img src={medtrackLogo} alt="MedTrack" className="h-8 w-8 object-contain" />
          <span className="font-semibold text-foreground">MedTrack</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {step > 0 && step < totalSteps - 1 && `Passo ${step} de ${totalSteps - 2}`}
        </div>
      </header>

      {/* Progress Bar */}
      {step > 0 && step < totalSteps - 1 && (
        <div className="h-1 bg-muted">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((step) / (totalSteps - 2)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 border-t border-border">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          {step > 0 && (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
          <Button 
            variant="hero" 
            onClick={handleNext} 
            className="flex-1 gap-2"
            disabled={!canProceed()}
          >
            {step === 0 ? "Começar" : step === totalSteps - 1 ? "Concluir cadastro de perfil" : "Continuar"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </footer>

      {/* Dialog para escolha de cadastro de plantões */}
      <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Cadastrar seus plantões agora?
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Você quer cadastrar sua grade de plantões ou prefere fazer isso mais tarde?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              variant="hero" 
              onClick={() => handleShiftChoice(true)}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Quero cadastrar agora
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleShiftChoice(false)}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Deixar para depois
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileOnboarding;
