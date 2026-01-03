import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Repeat, 
  Plus,
  Check,
  X,
  Edit2,
  Building2
} from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const HOSPITALS_LIST = [
  "Hospital São Lucas",
  "Hospital Albert Einstein",
  "Hospital Sírio-Libanês",
  "Hospital das Clínicas",
  "Hospital Santa Casa",
  "Hospital Oswaldo Cruz",
  "Hospital 9 de Julho",
  "UPA 24h",
  "Pronto Socorro Municipal",
  "Hospital Monte Klinikum",
];

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
  { value: "20-20", label: "Do dia 20 ao 20" },
  { value: "1-30", label: "Do dia 1 ao 30/31 (mês cheio)" },
  { value: "25-25", label: "Do dia 25 ao 25" },
  { value: "outro", label: "Outro período" },
];

const PAYMENT_DELAYS = [
  { value: "30", label: "30 dias" },
  { value: "45", label: "45 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
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
  { value: "15", label: "15%" },
  { value: "20", label: "20%" },
  { value: "25", label: "25%" },
  { value: "32", label: "32%" },
  { value: "33", label: "33%" },
  { value: "outro", label: "Outro (%)" },
];

const PAYMENT_METHODS = [
  { value: "cooperativa", label: "Cooperativa" },
  { value: "pf", label: "Pessoa Física (RPA / autônomo)" },
  { value: "pj", label: "PJ (CNPJ próprio / Nota Fiscal)" },
  { value: "clt", label: "CLT (extra)" },
];

interface SporadicShift {
  id: string;
  hospital: string;
  sector: string;
  date: string;
  startTime: string;
  endTime: string;
  alreadyRealized: boolean;
  paymentMethod: string;
  cooperativaData?: {
    cooperativa: string;
    workPeriod: string;
    customWorkPeriodStart?: string;
    customWorkPeriodEnd?: string;
    paymentDelay: string;
    customPaymentDelay?: string;
    paymentPeriod: string;
    customPaymentDay?: string;
    grossValue: string;
    taxRate: string;
    customTaxRate?: string;
  };
  directPaymentData?: {
    paysNextMonth: string;
    paymentDay: string;
    customPaymentDay?: string;
    grossValue: string;
    discountRate: string;
    customDiscountRate?: string;
  };
  paymentStatus: "pending" | "received" | "overdue";
  predictedPaymentDate?: string;
}

interface AddShiftModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialDate?: Date;
  startWithSporadic?: boolean; // Skip type selection and go directly to sporadic flow
}

type FlowStep = 
  | "type-selection" 
  | "already-realized"
  | "hospital-sector"
  | "date-time"
  | "payment-method"
  | "coop-1" | "coop-2" | "coop-3" | "coop-4" | "coop-5" | "coop-6"
  | "direct-1" | "direct-2" | "direct-3" | "direct-4"
  | "summary";

const AddShiftModal = ({ open, onClose, onComplete, initialDate, startWithSporadic = false }: AddShiftModalProps) => {
  const [step, setStep] = useState<FlowStep>(startWithSporadic ? "already-realized" : "type-selection");
  const [shiftType, setShiftType] = useState<"avulso" | "recorrente" | null>(startWithSporadic ? "avulso" : null);
  const [showCustomHospital, setShowCustomHospital] = useState(false);
  const [showCustomCooperativa, setShowCustomCooperativa] = useState(false);
  
  const [shiftData, setShiftData] = useState<Partial<SporadicShift>>({
    date: initialDate ? format(initialDate, "yyyy-MM-dd") : "",
  });

  const [cooperativaData, setCooperativaData] = useState<SporadicShift["cooperativaData"]>({
    cooperativa: "",
    workPeriod: "",
    paymentDelay: "",
    paymentPeriod: "",
    grossValue: "",
    taxRate: "",
  });

  const [directPaymentData, setDirectPaymentData] = useState<SporadicShift["directPaymentData"]>({
    paysNextMonth: "",
    paymentDay: "",
    grossValue: "",
    discountRate: "",
  });

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(startWithSporadic ? "already-realized" : "type-selection");
      setShiftType(startWithSporadic ? "avulso" : null);
      setShiftData({ date: initialDate ? format(initialDate, "yyyy-MM-dd") : "" });
      setCooperativaData({
        cooperativa: "",
        workPeriod: "",
        paymentDelay: "",
        paymentPeriod: "",
        grossValue: "",
        taxRate: "",
      });
      setDirectPaymentData({
        paysNextMonth: "",
        paymentDay: "",
        grossValue: "",
        discountRate: "",
      });
      setShowCustomHospital(false);
      setShowCustomCooperativa(false);
    }
  }, [open, startWithSporadic, initialDate]);

  // Load last used payment method for smart defaults
  useEffect(() => {
    const saved = localStorage.getItem("plantonmed_last_sporadic_payment");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.paymentMethod) {
        // Pre-fill payment method if returning user
      }
    }
  }, []);

  const updateShiftData = (field: string, value: any) => {
    setShiftData(prev => ({ ...prev, [field]: value }));
  };

  const updateCooperativaData = (field: string, value: string) => {
    setCooperativaData(prev => prev ? { ...prev, [field]: value } : undefined);
  };

  const updateDirectPaymentData = (field: string, value: string) => {
    setDirectPaymentData(prev => prev ? { ...prev, [field]: value } : undefined);
  };

  const canProceed = () => {
    switch (step) {
      case "type-selection":
        return !!shiftType;
      case "already-realized":
        return shiftData.alreadyRealized !== undefined;
      case "hospital-sector":
        return !!shiftData.hospital;
      case "date-time":
        return !!(shiftData.date && shiftData.startTime && shiftData.endTime);
      case "payment-method":
        return !!shiftData.paymentMethod;
      case "coop-1":
        return !!cooperativaData?.cooperativa;
      case "coop-2":
        if (cooperativaData?.workPeriod === "outro") {
          return !!(cooperativaData.customWorkPeriodStart && cooperativaData.customWorkPeriodEnd);
        }
        return !!cooperativaData?.workPeriod;
      case "coop-3":
        if (cooperativaData?.paymentDelay === "outro") {
          return !!cooperativaData.customPaymentDelay;
        }
        return !!cooperativaData?.paymentDelay;
      case "coop-4":
        if (cooperativaData?.paymentPeriod === "exato") {
          return !!cooperativaData.customPaymentDay;
        }
        return !!cooperativaData?.paymentPeriod;
      case "coop-5":
        return !!cooperativaData?.grossValue;
      case "coop-6":
        if (cooperativaData?.taxRate === "outro") {
          return !!cooperativaData.customTaxRate;
        }
        return !!cooperativaData?.taxRate;
      case "direct-1":
        return !!directPaymentData?.paysNextMonth;
      case "direct-2":
        if (directPaymentData?.paymentDay === "outro") {
          return !!directPaymentData.customPaymentDay;
        }
        return !!directPaymentData?.paymentDay;
      case "direct-3":
        return !!directPaymentData?.grossValue;
      case "direct-4":
        if (directPaymentData?.discountRate === "outro") {
          return !!directPaymentData.customDiscountRate;
        }
        return !!directPaymentData?.discountRate;
      default:
        return true;
    }
  };

  const getNextStep = (): FlowStep => {
    switch (step) {
      case "type-selection":
        if (shiftType === "recorrente") {
          // Navigate to recurring shift flow (external)
          return "type-selection";
        }
        return "already-realized";
      case "already-realized":
        return "hospital-sector";
      case "hospital-sector":
        return "date-time";
      case "date-time":
        return "payment-method";
      case "payment-method":
        if (shiftData.paymentMethod === "cooperativa") {
          return "coop-1";
        }
        return "direct-1";
      case "coop-1": return "coop-2";
      case "coop-2": return "coop-3";
      case "coop-3": return "coop-4";
      case "coop-4": return "coop-5";
      case "coop-5": return "coop-6";
      case "coop-6": return "summary";
      case "direct-1": return "direct-2";
      case "direct-2": return "direct-3";
      case "direct-3": return "direct-4";
      case "direct-4": return "summary";
      default: return step;
    }
  };

  const getPrevStep = (): FlowStep => {
    switch (step) {
      case "already-realized": return "type-selection";
      case "hospital-sector": return "already-realized";
      case "date-time": return "hospital-sector";
      case "payment-method": return "date-time";
      case "coop-1": return "payment-method";
      case "coop-2": return "coop-1";
      case "coop-3": return "coop-2";
      case "coop-4": return "coop-3";
      case "coop-5": return "coop-4";
      case "coop-6": return "coop-5";
      case "direct-1": return "payment-method";
      case "direct-2": return "direct-1";
      case "direct-3": return "direct-2";
      case "direct-4": return "direct-3";
      case "summary":
        if (shiftData.paymentMethod === "cooperativa") {
          return "coop-6";
        }
        return "direct-4";
      default: return step;
    }
  };

  const navigate = useNavigate();

  const handleNext = () => {
    if (step === "type-selection" && shiftType === "recorrente") {
      // Navigate to recurring shift onboarding with state to skip intro
      onClose();
      navigate("/onboarding/plantoes", { state: { fromCalendar: true } });
      return;
    }
    setStep(getNextStep());
  };

  const handleBack = () => {
    if (step === "type-selection") {
      onClose();
      return;
    }
    // If started with sporadic and at first step, close modal
    if (startWithSporadic && step === "already-realized") {
      onClose();
      return;
    }
    setStep(getPrevStep());
  };

  const handleConfirm = () => {
    // Calculate predicted payment date
    let predictedDate = "";
    if (shiftData.paymentMethod === "cooperativa" && cooperativaData) {
      // Complex calculation based on work period and delay
      // Simplified for now
      predictedDate = format(new Date(), "dd/MM/yyyy");
    } else if (directPaymentData) {
      predictedDate = format(new Date(), "dd/MM/yyyy");
    }

    const newShift: SporadicShift = {
      id: Date.now().toString(),
      hospital: shiftData.hospital || "",
      sector: shiftData.sector || "",
      date: shiftData.date || "",
      startTime: shiftData.startTime || "",
      endTime: shiftData.endTime || "",
      alreadyRealized: shiftData.alreadyRealized || false,
      paymentMethod: shiftData.paymentMethod || "",
      cooperativaData: shiftData.paymentMethod === "cooperativa" ? cooperativaData : undefined,
      directPaymentData: shiftData.paymentMethod !== "cooperativa" ? directPaymentData : undefined,
      paymentStatus: shiftData.alreadyRealized ? "pending" : "pending",
      predictedPaymentDate: predictedDate,
    };

    // Save to localStorage
    const existing = localStorage.getItem("plantonmed_sporadic_shifts");
    let shifts: SporadicShift[] = [];
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        shifts = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Error parsing existing shifts:", e);
      }
    }
    shifts.push(newShift);
    localStorage.setItem("plantonmed_sporadic_shifts", JSON.stringify(shifts));

    // Auto-mark as completed if user selected "Sim, já realizei"
    if (shiftData.alreadyRealized) {
      const statusKey = `sporadic-${newShift.id}`;
      const existingStatuses = localStorage.getItem("plantonmed_shift_statuses");
      let statuses: Record<string, string> = {};
      if (existingStatuses) {
        try {
          statuses = JSON.parse(existingStatuses);
        } catch (e) {
          console.error("Error parsing shift statuses:", e);
        }
      }
      statuses[statusKey] = "completed";
      localStorage.setItem("plantonmed_shift_statuses", JSON.stringify(statuses));
    }

    // Save last payment method for smart defaults
    localStorage.setItem("plantonmed_last_sporadic_payment", JSON.stringify({
      paymentMethod: shiftData.paymentMethod,
    }));

    onComplete();
    onClose();
  };

  const handleAddAnother = () => {
    // Reset form
    setStep("already-realized");
    setShiftData({ date: "" });
    setCooperativaData({
      cooperativa: "",
      workPeriod: "",
      paymentDelay: "",
      paymentPeriod: "",
      grossValue: "",
      taxRate: "",
    });
    setDirectPaymentData({
      paysNextMonth: "",
      paymentDay: "",
      grossValue: "",
      discountRate: "",
    });
    setShowCustomHospital(false);
    setShowCustomCooperativa(false);
  };

  const getGrossValue = () => {
    if (shiftData.paymentMethod === "cooperativa") {
      return cooperativaData?.grossValue || "0";
    }
    return directPaymentData?.grossValue || "0";
  };

  const getPaymentMethodLabel = () => {
    const method = PAYMENT_METHODS.find(m => m.value === shiftData.paymentMethod);
    return method?.label || shiftData.paymentMethod;
  };

  const renderStep = () => {
    switch (step) {
      case "type-selection":
        return (
          <motion.div
            key="type-selection"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Tipo de plantão</h2>
              <p className="text-muted-foreground text-sm mt-1">Que tipo de plantão você quer cadastrar?</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShiftType("avulso")}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                  shiftType === "avulso"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  shiftType === "avulso" ? "bg-primary" : "bg-muted"
                }`}>
                  <Calendar className={`w-6 h-6 ${
                    shiftType === "avulso" ? "text-primary-foreground" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Avulso</p>
                  <p className="text-sm text-muted-foreground">Plantão único, específico</p>
                </div>
              </button>

              <button
                onClick={() => setShiftType("recorrente")}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                  shiftType === "recorrente"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  shiftType === "recorrente" ? "bg-primary" : "bg-muted"
                }`}>
                  <Repeat className={`w-6 h-6 ${
                    shiftType === "recorrente" ? "text-primary-foreground" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Recorrente</p>
                  <p className="text-sm text-muted-foreground">Mesmo dia, mesmo horário</p>
                </div>
              </button>
            </div>
          </motion.div>
        );

      case "already-realized":
        return (
          <motion.div
            key="already-realized"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Este plantão já aconteceu ou ainda vai acontecer?</h2>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => updateShiftData("alreadyRealized", true)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  shiftData.alreadyRealized === true
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Sim, já realizei</span>
                </div>
              </button>

              <button
                onClick={() => updateShiftData("alreadyRealized", false)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  shiftData.alreadyRealized === false
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">Não, ainda vai acontecer</span>
                </div>
              </button>
            </div>
          </motion.div>
        );

      case "hospital-sector":
        return (
          <motion.div
            key="hospital-sector"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Qual o Hospital e setor?</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Hospital</Label>
                {!showCustomHospital ? (
                  <Select
                    value={shiftData.hospital || ""}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setShowCustomHospital(true);
                        updateShiftData("hospital", "");
                      } else {
                        updateShiftData("hospital", value);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o hospital" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {HOSPITALS_LIST.map((hospital) => (
                        <SelectItem key={hospital} value={hospital}>
                          {hospital}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-primary font-medium">
                        <span className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Adicionar hospital manualmente
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Digite o nome do hospital"
                      value={shiftData.hospital || ""}
                      onChange={(e) => updateShiftData("hospital", e.target.value)}
                      className="bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomHospital(false)}
                      className="text-sm text-primary hover:underline"
                    >
                      ← Voltar para a lista
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Em qual setor?</Label>
                <Input
                  placeholder="Ex: UTI, Emergência, Centro Cirúrgico..."
                  value={shiftData.sector || ""}
                  onChange={(e) => updateShiftData("sector", e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          </motion.div>
        );

      case "date-time":
        return (
          <motion.div
            key="date-time"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Qual a data do plantão?</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data</Label>
                <Input
                  type="date"
                  value={shiftData.date || ""}
                  onChange={(e) => updateShiftData("date", e.target.value)}
                  className="bg-background"
                  max={shiftData.alreadyRealized ? format(new Date(), "yyyy-MM-dd") : undefined}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Hora de início</Label>
                  <Input
                    type="time"
                    value={shiftData.startTime || ""}
                    onChange={(e) => updateShiftData("startTime", e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Hora de término</Label>
                  <Input
                    type="time"
                    value={shiftData.endTime || ""}
                    onChange={(e) => updateShiftData("endTime", e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "payment-method":
        return (
          <motion.div
            key="payment-method"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Como será o pagamento desse plantão?</h2>
            </div>

            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => updateShiftData("paymentMethod", method.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    shiftData.paymentMethod === method.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{method.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      // Cooperativa flow
      case "coop-1":
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
                value={cooperativaData?.cooperativa || ""}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setShowCustomCooperativa(true);
                    updateCooperativaData("cooperativa", "");
                  } else {
                    updateCooperativaData("cooperativa", value);
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
                  value={cooperativaData?.cooperativa || ""}
                  onChange={(e) => updateCooperativaData("cooperativa", e.target.value)}
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

      case "coop-2":
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
              O que é "período trabalhado"? É o intervalo de dias que a cooperativa usa para fechar os plantões que você fez e calcular o valor a receber.
            </p>
            <div className="space-y-2">
              {WORK_PERIODS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateCooperativaData("workPeriod", option.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    cooperativaData?.workPeriod === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
            {cooperativaData?.workPeriod === "outro" && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Dia início"
                  type="number"
                  min="1"
                  max="31"
                  value={cooperativaData?.customWorkPeriodStart || ""}
                  onChange={(e) => updateCooperativaData("customWorkPeriodStart", e.target.value)}
                  className="bg-background"
                />
                <span className="self-center text-muted-foreground">ao</span>
                <Input
                  placeholder="Dia fim"
                  type="number"
                  min="1"
                  max="31"
                  value={cooperativaData?.customWorkPeriodEnd || ""}
                  onChange={(e) => updateCooperativaData("customWorkPeriodEnd", e.target.value)}
                  className="bg-background"
                />
              </div>
            )}
          </motion.div>
        );

      case "coop-3":
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
                  onClick={() => updateCooperativaData("paymentDelay", option.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    cooperativaData?.paymentDelay === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
            {cooperativaData?.paymentDelay === "outro" && (
              <Input
                placeholder="Número de dias"
                type="number"
                value={cooperativaData?.customPaymentDelay || ""}
                onChange={(e) => updateCooperativaData("customPaymentDelay", e.target.value)}
                className="bg-background mt-2"
              />
            )}
          </motion.div>
        );

      case "coop-4":
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
                  onClick={() => updateCooperativaData("paymentPeriod", option.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    cooperativaData?.paymentPeriod === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
            {cooperativaData?.paymentPeriod === "exato" && (
              <Input
                placeholder="Dia do mês (1-31)"
                type="number"
                min="1"
                max="31"
                value={cooperativaData?.customPaymentDay || ""}
                onChange={(e) => updateCooperativaData("customPaymentDay", e.target.value)}
                className="bg-background mt-2"
              />
            )}
          </motion.div>
        );

      case "coop-5":
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
              Valor bruto é o valor total do plantão, antes de qualquer taxa ou desconto da cooperativa. É o valor "de tabela", antes de cair na sua conta.
            </p>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                placeholder="0,00"
                value={cooperativaData?.grossValue || ""}
                onChange={(e) => updateCooperativaData("grossValue", e.target.value)}
                className="pl-12 bg-background"
              />
            </div>
          </motion.div>
        );

      case "coop-6":
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
              Se você não souber a taxa exata, tudo bem! A maioria das cooperativas desconta em média cerca de 35%. Pode usar esse número como referência.
            </p>
            <div className="space-y-2 mt-2">
              {TAX_RATES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateCooperativaData("taxRate", option.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    cooperativaData?.taxRate === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
            {cooperativaData?.taxRate === "outro" && (
              <div className="relative mt-2">
                <Input
                  placeholder="0"
                  type="number"
                  value={cooperativaData?.customTaxRate || ""}
                  onChange={(e) => updateCooperativaData("customTaxRate", e.target.value)}
                  className="pr-8 bg-background"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            )}
          </motion.div>
        );

      // Direct payment flow
      case "direct-1":
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
              A maioria dos hospitais e clínicas paga os plantões feitos no mês passado. Ex.: plantões de setembro → recebimento em outubro.
            </p>
            <div className="space-y-2 mt-3">
              <button
                onClick={() => updateDirectPaymentData("paysNextMonth", "sim")}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  directPaymentData?.paysNextMonth === "sim"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/30"
                }`}
              >
                <span className="font-medium text-foreground">Sim, recebo no mês seguinte</span>
              </button>
              <button
                onClick={() => updateDirectPaymentData("paysNextMonth", "nao")}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  directPaymentData?.paysNextMonth === "nao"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/30"
                }`}
              >
                <span className="font-medium text-foreground">Não, recebo no mesmo mês</span>
              </button>
            </div>
          </motion.div>
        );

      case "direct-2":
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
                  onClick={() => updateDirectPaymentData("paymentDay", option.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    directPaymentData?.paymentDay === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground text-sm">{option.label}</span>
                </button>
              ))}
            </div>
            {directPaymentData?.paymentDay === "outro" && (
              <Input
                placeholder="Dia do mês (1-31)"
                type="number"
                min="1"
                max="31"
                value={directPaymentData?.customPaymentDay || ""}
                onChange={(e) => updateDirectPaymentData("customPaymentDay", e.target.value)}
                className="bg-background mt-2"
              />
            )}
          </motion.div>
        );

      case "direct-3":
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
              Valor bruto é o valor total do plantão antes de qualquer imposto ou desconto. É o valor original, antes de cair na sua conta.
            </p>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                placeholder="0,00"
                value={directPaymentData?.grossValue || ""}
                onChange={(e) => updateDirectPaymentData("grossValue", e.target.value)}
                className="pl-12 bg-background"
              />
            </div>
          </motion.div>
        );

      case "direct-4":
        return (
          <motion.div
            key="direct-4"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium">Quanto desse plantão costuma ser descontado antes de cair na sua conta?</Label>
            <p className="text-sm text-muted-foreground text-xs leading-relaxed">
              Caso você não saiba o valor exato, não tem problema.
              <br />• Em PF (RPA/autônomo): 27% a 33%. Sugerimos usar 33%.
              <br />• Em PJ: 18% a 22%. Sugerimos usar 20%.
              <br />• No CLT: 25% a 32%. Sugerimos usar 32%.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {DISCOUNT_RATES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateDirectPaymentData("discountRate", option.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    directPaymentData?.discountRate === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground text-sm">{option.label}</span>
                </button>
              ))}
            </div>
            {directPaymentData?.discountRate === "outro" && (
              <div className="relative mt-2">
                <Input
                  placeholder="0"
                  type="number"
                  value={directPaymentData?.customDiscountRate || ""}
                  onChange={(e) => updateDirectPaymentData("customDiscountRate", e.target.value)}
                  className="pr-8 bg-background"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            )}
          </motion.div>
        );

      case "summary":
        const formattedDate = shiftData.date 
          ? format(parse(shiftData.date, "yyyy-MM-dd", new Date()), "d 'de' MMMM", { locale: ptBR })
          : "";
        
        return (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Resumo do seu plantão avulso</h2>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="font-semibold text-foreground">{shiftData.hospital}</span>
              </div>
              
              {shiftData.sector && (
                <div className="text-sm text-muted-foreground pl-6">
                  Setor: {shiftData.sector}
                </div>
              )}

              <div className="text-sm text-muted-foreground pl-6 space-y-1">
                <p>📅 Data: {formattedDate} — {shiftData.startTime} às {shiftData.endTime}</p>
                <p>💰 Valor bruto: R$ {getGrossValue()}</p>
                <p>🏷️ Vínculo: {getPaymentMethodLabel()}</p>
                <p>📆 Previsto para receber: --</p>
              </div>

              {shiftData.alreadyRealized && (
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-foreground">Status trabalhado: Realizado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-foreground">Status de pagamento: Aguardando recebimento</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4">
              <Button
                variant="hero"
                onClick={handleConfirm}
                className="w-full gap-2"
              >
                <Check className="w-4 h-4" />
                Confirmar plantão
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("hospital-sector")}
                className="w-full gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar informações
              </Button>
              <Button
                variant="ghost"
                onClick={handleAddAnother}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar outro plantão avulso
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const showNavButtons = step !== "summary";

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {showNavButtons && (
          <div className="flex items-center gap-4 pt-4 mt-4 border-t border-border">
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button 
              variant="hero" 
              onClick={handleNext} 
              className="flex-1 gap-2"
              disabled={!canProceed()}
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddShiftModal;
