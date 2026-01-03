import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, ArrowLeft } from "lucide-react";

const COOPERATIVAS_LIST = [
  "Unimed Fortaleza",
  "Unimed Ceará",
  "Hapvida",
  "SulAmérica",
  "Coopanest-CE",
  "Cooperanest Ceará",
  "Coopcardio",
  "Coopermed Ceará",
  "Coopego",
  "Coopanest Metropolitana",
];

const WORK_PERIODS = [
  { value: "21-20", label: "Do dia 21 ao 20" },
  { value: "1-30", label: "Do dia 1 ao 30/31 (mês cheio)" },
  { value: "25-25", label: "Do dia 25 ao 25" },
  { value: "outro", label: "Outro período" },
];

const PAYMENT_DELAYS = [
  { value: "30", label: "30 dias" },
  { value: "45", label: "45 dias" },
  { value: "60", label: "60 dias" },
  { value: "outro", label: "Outro" },
];

const PAYMENT_PERIODS = [
  { value: "1-5", label: "Entre os dias 1 e 5" },
  { value: "10-15", label: "Entre 10 e 15" },
  { value: "20-30", label: "Entre 20 e 30" },
  { value: "exato", label: "Dia exato" },
];

const TAX_RATES = [
  { value: "20", label: "20%" },
  { value: "25", label: "25%" },
  { value: "35", label: "35% (média das cooperativas)" },
  { value: "40", label: "40%" },
  { value: "outro", label: "Outro (%)" },
];

interface CooperativaData {
  cooperativa?: string;
  workPeriod?: string;
  customWorkPeriodStart?: string;
  customWorkPeriodEnd?: string;
  paymentDelay?: string;
  customPaymentDelay?: string;
  paymentPeriod?: string;
  customPaymentDay?: string;
  grossValue?: string;
  taxRate?: string;
  customTaxRate?: string;
}

interface CooperativaFormProps {
  data: CooperativaData;
  onChange: (data: CooperativaData) => void;
  showCustomCooperativa: boolean;
  setShowCustomCooperativa: (show: boolean) => void;
  onComplete: () => void;
  onBack: () => void;
}

const CooperativaForm = ({ 
  data, 
  onChange, 
  showCustomCooperativa, 
  setShowCustomCooperativa,
  onComplete,
  onBack
}: CooperativaFormProps) => {
  const [subStep, setSubStep] = useState(1);
  const totalSubSteps = 6;

  const updateField = (field: keyof CooperativaData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const canProceedSubStep = () => {
    switch (subStep) {
      case 1:
        return !!data.cooperativa;
      case 2:
        if (data.workPeriod === "outro") {
          return !!(data.customWorkPeriodStart && data.customWorkPeriodEnd);
        }
        return !!data.workPeriod;
      case 3:
        if (data.paymentDelay === "outro") {
          return !!data.customPaymentDelay;
        }
        return !!data.paymentDelay;
      case 4:
        if (data.paymentPeriod === "exato") {
          return !!data.customPaymentDay;
        }
        return !!data.paymentPeriod;
      case 5:
        return !!data.grossValue;
      case 6:
        if (data.taxRate === "outro") {
          return !!data.customTaxRate;
        }
        return !!data.taxRate;
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
            key="coop-1"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Qual cooperativa te paga esse plantão?</Label>
            {!showCustomCooperativa ? (
              <Select
                value={data.cooperativa || ""}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setShowCustomCooperativa(true);
                    updateField("cooperativa", "");
                  } else {
                    updateField("cooperativa", value);
                  }
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione a cooperativa" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {COOPERATIVAS_LIST.map((coop) => (
                    <SelectItem key={coop} value={coop}>
                      {coop}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-primary font-medium">
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar cooperativa manualmente
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Digite o nome da cooperativa"
                  value={data.cooperativa || ""}
                  onChange={(e) => updateField("cooperativa", e.target.value)}
                  className="bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomCooperativa(false)}
                  className="text-sm text-primary hover:underline"
                >
                  ← Voltar para a lista
                </button>
              </div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="coop-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Como funciona o período trabalhado dessa cooperativa?</Label>
            <p className="text-sm text-muted-foreground">
              O que é "período trabalhado"? É o intervalo de dias que a cooperativa usa para fechar mês.
              Ex: algumas cooperativas consideram 20 a 19, outras usam mês cheio.
            </p>
            <div className="space-y-2">
              {WORK_PERIODS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField("workPeriod", option.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    data.workPeriod === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
            {data.workPeriod === "outro" && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Dia início"
                  type="number"
                  min="1"
                  max="31"
                  value={data.customWorkPeriodStart || ""}
                  onChange={(e) => updateField("customWorkPeriodStart", e.target.value)}
                  className="bg-background"
                />
                <span className="self-center text-muted-foreground">ao</span>
                <Input
                  placeholder="Dia fim"
                  type="number"
                  min="1"
                  max="31"
                  value={data.customWorkPeriodEnd || ""}
                  onChange={(e) => updateField("customWorkPeriodEnd", e.target.value)}
                  className="bg-background"
                />
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="coop-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Depois que o período trabalhado fecha, em quanto tempo você recebe?</Label>
            <div className="space-y-2">
              {PAYMENT_DELAYS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField("paymentDelay", option.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    data.paymentDelay === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
            {data.paymentDelay === "outro" && (
              <Input
                placeholder="Número de dias"
                type="number"
                value={data.customPaymentDelay || ""}
                onChange={(e) => updateField("customPaymentDelay", e.target.value)}
                className="bg-background mt-2"
              />
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="coop-4"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Em qual parte do mês esse pagamento costuma cair?</Label>
            <div className="space-y-2">
              {PAYMENT_PERIODS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField("paymentPeriod", option.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    data.paymentPeriod === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
            {data.paymentPeriod === "exato" && (
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

      case 5:
        return (
          <motion.div
            key="coop-5"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Qual é o valor BRUTO que a cooperativa paga por esse plantão?</Label>
            <p className="text-sm text-muted-foreground">
              Valor bruto é o valor total do plantão, antes de qualquer taxa ou desconto.
              É o valor "de tabela", antes de cair na sua conta.
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

      case 6:
        return (
          <motion.div
            key="coop-6"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Qual é a taxa (%) que a cooperativa desconta desse plantão?</Label>
            <p className="text-sm text-muted-foreground">
              A maioria das cooperativas desconta em média cerca de 35%.
              Pode usar esse número como referência.
            </p>
            <div className="space-y-2 mt-2">
              {TAX_RATES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField("taxRate", option.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    data.taxRate === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
            {data.taxRate === "outro" && (
              <div className="relative mt-2">
                <Input
                  placeholder="0"
                  type="number"
                  value={data.customTaxRate || ""}
                  onChange={(e) => updateField("customTaxRate", e.target.value)}
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

export default CooperativaForm;
export type { CooperativaData };
