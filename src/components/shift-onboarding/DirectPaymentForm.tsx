import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

const PAYMENT_DAYS = [
  { value: "1", label: "Dia 1" },
  { value: "5", label: "Dia 5" },
  { value: "10", label: "Dia 10" },
  { value: "15", label: "Dia 15" },
  { value: "20", label: "Dia 20" },
  { value: "25", label: "Dia 25" },
  { value: "30", label: "Dia 30" },
  { value: "outro", label: "Outro dia" },
];

const DISCOUNT_RATES = [
  { value: "20", label: "20%" },
  { value: "25", label: "25%" },
  { value: "27", label: "27%" },
  { value: "30", label: "30%" },
  { value: "32", label: "32%" },
  { value: "outro", label: "Outro (%)" },
];

interface DirectPaymentData {
  paysNextMonth?: string;
  paymentDay?: string;
  customPaymentDay?: string;
  grossValue?: string;
  discountRate?: string;
  customDiscountRate?: string;
}

interface DirectPaymentFormProps {
  data: DirectPaymentData;
  onChange: (data: DirectPaymentData) => void;
  paymentMethod: string;
  onComplete: () => void;
  onBack: () => void;
}

const DirectPaymentForm = ({ 
  data, 
  onChange, 
  paymentMethod,
  onComplete,
  onBack
}: DirectPaymentFormProps) => {
  const [subStep, setSubStep] = useState(1);
  const totalSubSteps = 4;

  const updateField = (field: keyof DirectPaymentData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const getDiscountHelpText = () => {
    return "Caso você não saiba o valor exato, não tem problema. Você pode usar essas faixas como referência.\nEm PF (RPA/autônomo), os descontos totais costumam ficar entre 27% e 33%. Sugerimos usar 33%.\nEm PJ, os descontos geralmente variam entre 18% e 22%. Sugerimos usar 20%.\nNo CLT, os descontos costumam incluir INSS, IR e encargos de folha. A média fica entre 25% e 32%. Sugerimos usar 32%.";
  };

  const canProceedSubStep = () => {
    switch (subStep) {
      case 1:
        return !!data.paysNextMonth;
      case 2:
        if (data.paymentDay === "outro") {
          return !!data.customPaymentDay;
        }
        return !!data.paymentDay;
      case 3:
        return !!data.grossValue;
      case 4:
        if (data.discountRate === "outro") {
          return !!data.customDiscountRate;
        }
        return !!data.discountRate;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (subStep < totalSubSteps) {
      setSubStep(subStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (subStep > 1) {
      setSubStep(subStep - 1);
    } else {
      onBack();
    }
  };

  const renderSubStep = () => {
    switch (subStep) {
      case 1:
        return (
          <motion.div
            key="direct-1"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Esse pagamento normalmente é referente ao mês anterior trabalhado?</Label>
            <p className="text-sm text-muted-foreground">
              A maioria dos hospitais e clínicas paga os plantões feitos no mês passado.
              Ex: plantões de setembro → recebimento em outubro.
            </p>
            <div className="space-y-2 mt-3">
              <button
                onClick={() => updateField("paysNextMonth", "sim")}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  data.paysNextMonth === "sim"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/30"
                }`}
              >
                <span className="font-medium text-foreground">Sim, recebo no mês seguinte</span>
              </button>
              <button
                onClick={() => updateField("paysNextMonth", "nao")}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  data.paysNextMonth === "nao"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/30"
                }`}
              >
                <span className="font-medium text-foreground">Não, recebo no mesmo mês</span>
              </button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="direct-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">E qual é o dia em que esse valor costuma cair na sua conta?</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {PAYMENT_DAYS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField("paymentDay", option.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    data.paymentDay === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground text-sm">{option.label}</span>
                </button>
              ))}
            </div>
            {data.paymentDay === "outro" && (
              <Input
                placeholder="Dia do mês (1-31)"
                type="number"
                min="1"
                max="31"
                value={data.customPaymentDay || ""}
                onChange={(e) => updateField("customPaymentDay", e.target.value)}
                className="bg-background mt-2"
              />
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="direct-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Qual é o valor BRUTO desse plantão?</Label>
            <p className="text-sm text-muted-foreground">
              Valor bruto é o valor total do plantão antes de qualquer imposto ou desconto.
              É o valor original, antes de cair na sua conta.
            </p>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                placeholder="0,00"
                value={data.grossValue || ""}
                onChange={(e) => updateField("grossValue", e.target.value)}
                className="pl-12 bg-background"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="direct-4"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Quanto desse plantão costuma ser descontado antes de cair na sua conta?</Label>
            <p className="text-sm text-muted-foreground">
              {getDiscountHelpText()}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {DISCOUNT_RATES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField("discountRate", option.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    data.discountRate === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground text-sm">{option.label}</span>
                </button>
              ))}
            </div>
            {data.discountRate === "outro" && (
              <div className="relative mt-2">
                <Input
                  placeholder="0"
                  type="number"
                  value={data.customDiscountRate || ""}
                  onChange={(e) => updateField("customDiscountRate", e.target.value)}
                  className="pr-8 bg-background"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {renderSubStep()}
      </AnimatePresence>

      <div className="flex items-center gap-4 pt-4">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button 
          variant="hero" 
          onClick={handleNext} 
          className="flex-1 gap-2"
          disabled={!canProceedSubStep()}
        >
          {subStep === totalSubSteps ? "Finalizar cadastro" : "Próximo"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default DirectPaymentForm;
export type { DirectPaymentData };
