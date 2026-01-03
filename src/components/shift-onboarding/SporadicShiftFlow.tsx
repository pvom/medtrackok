import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Calendar } from "lucide-react";

interface SporadicShiftData {
  averageShiftsPerMonth: string;
  averageNetValue: string;
  paymentPeriod: string;
  customPaymentDay: string;
}

interface SporadicShiftFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

const PAYMENT_PERIODS = [
  { value: "1-5", label: "1 a 5" },
  { value: "10-15", label: "10 a 15" },
  { value: "20-30", label: "20 a 30" },
  { value: "outro", label: "Outro dia" },
];

const SporadicShiftFlow = ({ onComplete, onBack }: SporadicShiftFlowProps) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SporadicShiftData>({
    averageShiftsPerMonth: "",
    averageNetValue: "",
    paymentPeriod: "",
    customPaymentDay: "",
  });

  const totalSteps = 4; // removed completion screen, now handled by parent

  const updateField = (field: keyof SporadicShiftData, value: string) => {
    setData({ ...data, [field]: value });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return true; // intro screen
      case 2:
        return !!data.averageShiftsPerMonth;
      case 3:
        return !!data.averageNetValue;
      case 4:
        if (data.paymentPeriod === "outro") {
          return !!data.customPaymentDay;
        }
        return !!data.paymentPeriod;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Save data and complete
      localStorage.setItem("plantonmed_sporadic_shifts", JSON.stringify(data));
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="sporadic-intro"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-center"
          >
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-primary-light mx-auto mb-6 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Calendar className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Vamos organizar seus plantões avulsos?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Para começarmos sua previsão mensal, precisamos só de uma visão geral dos seus plantões avulsos.
              Depois você poderá cadastrar cada plantão avulso específico, e o app recalcula tudo automaticamente.
            </p>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="sporadic-qty"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Label className="text-xl font-semibold text-foreground">
                Em média, quantos plantões avulsos você faz por mês?
              </Label>
            </div>
            <div className="max-w-xs mx-auto">
              <Input
                type="number"
                placeholder="Ex: 8"
                value={data.averageShiftsPerMonth}
                onChange={(e) => updateField("averageShiftsPerMonth", e.target.value)}
                className="bg-background text-center text-2xl h-14"
                min="0"
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="sporadic-value"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Label className="text-xl font-semibold text-foreground">
                Qual é o valor médio líquido que você recebe por esses plantões avulsos?
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                Valor líquido é o valor que realmente cai na sua conta, depois de descontados impostos e taxas.
              </p>
            </div>
            <div className="max-w-xs mx-auto relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">R$</span>
              <Input
                type="text"
                placeholder="0,00"
                value={data.averageNetValue}
                onChange={(e) => updateField("averageNetValue", e.target.value)}
                className="bg-background pl-12 text-center text-2xl h-14"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="sporadic-payment"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Label className="text-xl font-semibold text-foreground">
                Quando esses plantões geralmente caem na sua conta?
              </Label>
            </div>
            <div className="space-y-3 max-w-sm mx-auto">
              {PAYMENT_PERIODS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField("paymentPeriod", option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-center transition-all ${
                    data.paymentPeriod === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground text-lg">{option.label}</span>
                </button>
              ))}
            </div>
            {data.paymentPeriod === "outro" && (
              <div className="max-w-xs mx-auto">
                <Input
                  type="number"
                  placeholder="Dia do mês (1-31)"
                  min="1"
                  max="31"
                  value={data.customPaymentDay}
                  onChange={(e) => updateField("customPaymentDay", e.target.value)}
                  className="bg-background text-center"
                />
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  const getNextButtonText = () => {
    if (step === 1) return "Começar";
    if (step === 4) return "Finalizar";
    return "Próximo";
  };

  const showBackButton = step > 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg px-6">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 border-t border-border">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          {showBackButton && (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
          {step === 1 && (
            <Button variant="outline" onClick={onBack} className="gap-2">
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
            {getNextButtonText()}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SporadicShiftFlow;
export type { SporadicShiftData };
