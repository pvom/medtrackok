import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Shuffle,
  HelpCircle,
  Plus,
  Trash2,
  Heart
} from "lucide-react";
import medtrackLogo from "@/assets/medtrack-logo.png";
import CooperativaForm, { CooperativaData } from "@/components/shift-onboarding/CooperativaForm";
import DirectPaymentForm, { DirectPaymentData } from "@/components/shift-onboarding/DirectPaymentForm";
import ShiftSummary from "@/components/shift-onboarding/ShiftSummary";
import SporadicShiftFlow from "@/components/shift-onboarding/SporadicShiftFlow";

interface Shift {
  id: string;
  hospital: string;
  sector: string;
  duration: string;
  recurrence: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  paymentMethod: string;
  grossValue: string;
  discountRate: string;
  cooperativaData?: CooperativaData;
  directPaymentData?: DirectPaymentData;
}

const HOSPITALS_LIST = [
  "Hospital Geral de Fortaleza (HGF)",
  "Hospital Instituto Dr. José Frota (IJF)",
  "Hospital Universitário Walter Cantídio (HUWC)",
  "Hospital de Messejana Dr. Carlos Alberto Studart Gomes",
  "Hospital Infantil Albert Sabin",
  "Hospital César Cals",
  "Hospital Batista Memorial",
  "Hospital Monte Klinikum",
  "Hospital São Carlos",
  "Hospital Regional Unimed",
  "Hospital Antonio Prudente",
  "Hospital São Mateus",
  "Hospital Regional da Unimed Maracanaú",
  "UPA do Conjunto Ceará",
  "UPA de Messejana",
  "UPA Cristo Redentor",
  "UPA Praia do Futuro",
  "Hospital Distrital Gonzaga Mota (Messejana)",
  "Hospital Distrital Gonzaga Mota (José Walter)",
  "Hospital e Maternidade José Martiniano de Alencar",
];

const DURATION_OPTIONS = [
  { value: "diurno-6h", label: "Plantão diurno — 6h", hours: 6 },
  { value: "diurno-12h", label: "Plantão diurno — 12h", hours: 12 },
  { value: "noturno-12h", label: "Plantão noturno — 12h", hours: 12 },
];

const RECURRENCE_OPTIONS = [
  { value: "semanal", label: "Toda semana" },
  { value: "quinzenal", label: "A cada 15 dias" },
  { value: "mensal", label: "1x por mês" },
];

const PAYMENT_METHODS = [
  { value: "cooperativa", label: "Cooperativa" },
  { value: "pf", label: "Pessoa Física (RPA / autônomo)" },
  { value: "pj", label: "PJ (CNPJ próprio / Nota Fiscal)" },
  { value: "clt", label: "Contratado CLT" },
];

type MainStep = "intro" | "type-selection" | "fixed-intro" | "adding-shift" | "shift-summary" | "sporadic-flow" | "completion";

const ShiftOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if coming from calendar to add fixed shift directly
  const fromCalendar = location.state?.fromCalendar === true;
  
  const [mainStep, setMainStep] = useState<MainStep>(fromCalendar ? "adding-shift" : "intro");
  const [shiftType, setShiftType] = useState(fromCalendar ? "fixed" : "");
  const [fixedShifts, setFixedShifts] = useState<Shift[]>([]);
  const [addShiftStep, setAddShiftStep] = useState(1);
  const [showCustomHospital, setShowCustomHospital] = useState(false);
  const [showCustomCooperativa, setShowCustomCooperativa] = useState(false);
  const [currentShift, setCurrentShift] = useState<Partial<Shift>>({ daysOfWeek: [] });
  const [cooperativaData, setCooperativaData] = useState<CooperativaData>({});
  const [directPaymentData, setDirectPaymentData] = useState<DirectPaymentData>({});

  const handleSkip = () => {
    navigate("/dashboard");
  };

  const calculateEndTime = (startTime: string, duration: string) => {
    if (!startTime || !duration) return "";
    const durationOption = DURATION_OPTIONS.find(d => d.value === duration);
    if (!durationOption) return "";
    
    const [hours, minutes] = startTime.split(":").map(Number);
    const endHours = (hours + durationOption.hours) % 24;
    return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const toggleDayOfWeek = (day: string) => {
    const currentDays = currentShift.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setCurrentShift({ ...currentShift, daysOfWeek: newDays });
  };

  const getGrossValue = () => {
    if (currentShift.paymentMethod === "cooperativa") {
      return cooperativaData.grossValue || "";
    }
    return directPaymentData.grossValue || "";
  };

  const getDiscountRate = () => {
    if (currentShift.paymentMethod === "cooperativa") {
      const rate = cooperativaData.taxRate;
      if (rate === "outro") return cooperativaData.customTaxRate || "";
      return rate || "";
    }
    const rate = directPaymentData.discountRate;
    if (rate === "outro") return directPaymentData.customDiscountRate || "";
    return rate || "";
  };

  const addShift = () => {
    if (currentShift.hospital && currentShift.daysOfWeek && currentShift.daysOfWeek.length > 0) {
      const endTime = calculateEndTime(currentShift.startTime || "", currentShift.duration || "");
      const newShift: Shift = {
        id: Date.now().toString(),
        hospital: currentShift.hospital || "",
        sector: currentShift.sector || "",
        duration: currentShift.duration || "",
        recurrence: currentShift.recurrence || "",
        daysOfWeek: currentShift.daysOfWeek || [],
        startTime: currentShift.startTime || "",
        endTime: endTime,
        paymentMethod: currentShift.paymentMethod || "",
        grossValue: getGrossValue(),
        discountRate: getDiscountRate(),
        cooperativaData: currentShift.paymentMethod === "cooperativa" ? cooperativaData : undefined,
        directPaymentData: currentShift.paymentMethod !== "cooperativa" ? directPaymentData : undefined,
      };
      setFixedShifts([...fixedShifts, newShift]);
      setMainStep("shift-summary");
    }
  };

  const resetShiftForm = () => {
    setCurrentShift({ daysOfWeek: [] });
    setCooperativaData({});
    setDirectPaymentData({});
    setAddShiftStep(1);
    setShowCustomHospital(false);
    setShowCustomCooperativa(false);
  };

  const removeShift = (id: string) => {
    setFixedShifts(fixedShifts.filter(s => s.id !== id));
  };

  const handleEditShift = () => {
    // Remove the last shift and go back to editing
    const lastShift = fixedShifts[fixedShifts.length - 1];
    if (lastShift) {
      setFixedShifts(fixedShifts.slice(0, -1));
      setCurrentShift({
        hospital: lastShift.hospital,
        sector: lastShift.sector,
        duration: lastShift.duration,
        recurrence: lastShift.recurrence,
        daysOfWeek: lastShift.daysOfWeek,
        startTime: lastShift.startTime,
        paymentMethod: lastShift.paymentMethod,
      });
      if (lastShift.cooperativaData) {
        setCooperativaData(lastShift.cooperativaData);
      }
      if (lastShift.directPaymentData) {
        setDirectPaymentData(lastShift.directPaymentData);
      }
      setAddShiftStep(1);
      setMainStep("adding-shift");
    }
  };

  const handleAddAnotherShift = () => {
    resetShiftForm();
    setMainStep("adding-shift");
  };

  const handleFinishOnboarding = () => {
    localStorage.setItem("plantonmed_shifts", JSON.stringify({ shiftType, fixedShifts }));
    // If hybrid, go to sporadic flow next; otherwise go to completion
    if (shiftType === "hybrid") {
      setMainStep("sporadic-flow");
    } else {
      setMainStep("completion");
    }
  };

  const handleGoToDashboard = () => {
    navigate(fromCalendar ? "/calendar" : "/dashboard");
  };

  const daysOfWeek = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo"
  ];

  const canProceedInAddShift = () => {
    switch (addShiftStep) {
      case 1:
        return !!currentShift.hospital;
      case 2:
        return !!(currentShift.duration && currentShift.recurrence && currentShift.daysOfWeek && currentShift.daysOfWeek.length > 0 && currentShift.startTime);
      case 3:
        return !!currentShift.paymentMethod;
      case 4:
        if (currentShift.paymentMethod === "cooperativa") {
          return !!(cooperativaData.cooperativa && cooperativaData.workPeriod && cooperativaData.paymentDelay && cooperativaData.paymentPeriod && cooperativaData.grossValue && cooperativaData.taxRate);
        }
        return !!(directPaymentData.paysNextMonth && directPaymentData.paymentDay && directPaymentData.grossValue && directPaymentData.discountRate);
      default:
        return false;
    }
  };

  const getProgressPercentage = () => {
    switch (mainStep) {
      case "intro": return 0;
      case "type-selection": return 25;
      case "fixed-intro": return 40;
      case "adding-shift": return 50 + (addShiftStep * 10);
      case "shift-summary": return 90;
      case "sporadic-flow": return 50;
      case "completion": return 100;
      default: return 0;
    }
  };

  const renderContent = () => {
    switch (mainStep) {
      case "intro":
        return (
          <div className="text-center">
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-primary-light mx-auto mb-6 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Calendar className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Perfeito. Vamos registrar seus plantões?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Com isso seu painel financeiro já vai ficar todo personalizado. Vamos lá!
            </p>
          </div>
        );

      case "type-selection":
        return (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6 text-center">
              Como é sua rotina de plantões hoje?
            </h2>

            <div className="space-y-3">
              {[
                { 
                  value: "fixed", 
                  icon: Clock, 
                  label: "Tenho plantões fixos", 
                  desc: "Mesmo dia, mesmo horário… aquela rotina clássica." 
                },
                { 
                  value: "sporadic", 
                  icon: Shuffle, 
                  label: "Só faço plantões avulsos", 
                  desc: "Quando chamam, eu vou." 
                },
                { 
                  value: "hybrid", 
                  icon: Building2, 
                  label: "Tenho os dois (fixo + avulso)", 
                  desc: "Minha rotina é meio híbrida, meio caos." 
                },
                { 
                  value: "organizing", 
                  icon: HelpCircle, 
                  label: "Ainda estou organizando minha rotina", 
                  desc: "Não existe padrão. Cada semana é uma aventura." 
                }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setShiftType(option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${
                    shiftType === option.value
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    shiftType === option.value ? "bg-primary" : "bg-muted"
                  }`}>
                    <option.icon className={`w-5 h-5 ${
                      shiftType === option.value ? "text-primary-foreground" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "fixed-intro":
        return (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2 text-center">
              Vamos começar cadastrando seus plantões fixos?
            </h2>
            <p className="text-muted-foreground mb-8 text-center">
              Eles vão direto para o seu calendário.
            </p>

            {fixedShifts.length > 0 && (
              <div className="space-y-3 mb-6">
                {fixedShifts.map(shift => (
                  <motion.div
                    key={shift.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-border bg-card flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{shift.hospital}</p>
                      <p className="text-sm text-muted-foreground">
                        {shift.daysOfWeek.map(d => d.substring(0, 3)).join(", ")} • {shift.startTime} às {shift.endTime}
                      </p>
                      {shift.grossValue && (
                        <p className="text-sm text-primary font-medium">R$ {shift.grossValue}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeShift(shift.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                resetShiftForm();
                setMainStep("adding-shift");
              }}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar plantão fixo
            </Button>
          </div>
        );

      case "adding-shift":
        return renderAddShiftContent();

      case "sporadic-flow":
        return (
          <SporadicShiftFlow
            onComplete={() => setMainStep("completion")}
            onBack={() => shiftType === "hybrid" ? setMainStep("fixed-intro") : setMainStep("type-selection")}
          />
        );

      case "shift-summary":
        const lastShift = fixedShifts[fixedShifts.length - 1];
        if (!lastShift) return null;
        
        return (
          <div className="space-y-6">
            <ShiftSummary
              data={{
                hospital: lastShift.hospital,
                sector: lastShift.sector,
                duration: lastShift.duration,
                recurrence: lastShift.recurrence,
                daysOfWeek: lastShift.daysOfWeek,
                startTime: lastShift.startTime,
                endTime: lastShift.endTime,
                paymentMethod: lastShift.paymentMethod,
                grossValue: lastShift.grossValue,
                discountRate: lastShift.discountRate,
                cooperativa: lastShift.cooperativaData?.cooperativa,
              }}
              onEdit={handleEditShift}
            />

            <div className="space-y-3 pt-4">
              <Button
                variant="outline"
                onClick={handleAddAnotherShift}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Cadastrar outro plantão fixo
              </Button>
              <Button
                variant="hero"
                onClick={handleFinishOnboarding}
                className="w-full gap-2"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case "completion":
        return (
          <div className="text-center">
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-primary/10 mx-auto mb-6 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Heart className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Você fez o mais difícil.
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Agora deixa que a gente cuida do resto. 💙
            </p>
            <Button
              variant="hero"
              onClick={handleGoToDashboard}
              className="gap-2"
            >
              Ir para o painel
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderAddShiftContent = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <AnimatePresence mode="wait">
          {addShiftStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-foreground text-lg">Dados do Plantão</h3>
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Em que hospital você dá esse plantão?</Label>
                {!showCustomHospital ? (
                  <Select
                    value={currentShift.hospital || ""}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setShowCustomHospital(true);
                        setCurrentShift({ ...currentShift, hospital: "" });
                      } else {
                        setCurrentShift({ ...currentShift, hospital: value });
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
                      value={currentShift.hospital || ""}
                      onChange={(e) => setCurrentShift({ ...currentShift, hospital: e.target.value })}
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
                <Label className="text-base font-medium">Em qual setor?</Label>
                <Input
                  placeholder="Ex: UTI, Emergência, Centro Cirúrgico"
                  value={currentShift.sector || ""}
                  onChange={(e) => setCurrentShift({ ...currentShift, sector: e.target.value })}
                  className="bg-background"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Isso nos permite comparar depois quanto cada hospital/setor rende financeiramente pra você.
              </p>
            </motion.div>
          )}

          {addShiftStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-foreground text-lg">Agenda e Recorrência</h3>
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Duração</Label>
                <Select
                  value={currentShift.duration || ""}
                  onValueChange={(value) => setCurrentShift({ ...currentShift, duration: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Recorrência</Label>
                <div className="space-y-2">
                  {RECURRENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCurrentShift({ ...currentShift, recurrence: option.value })}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        currentShift.recurrence === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      <span className="font-medium text-foreground">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Dias da Semana</Label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDayOfWeek(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        (currentShift.daysOfWeek || []).includes(day)
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border hover:border-primary/30"
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Horário de Início</Label>
                <Input
                  type="time"
                  value={currentShift.startTime || ""}
                  onChange={(e) => setCurrentShift({ ...currentShift, startTime: e.target.value })}
                  className="bg-background"
                />
                {currentShift.startTime && currentShift.duration && (
                  <p className="text-sm text-muted-foreground">
                    Término: {calculateEndTime(currentShift.startTime, currentShift.duration)}
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Com isso calculamos quantos plantões desse tipo você tem por mês.
              </p>
            </motion.div>
          )}

          {addShiftStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-foreground text-lg">Recebimento e Taxas/Impostos</h3>
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Como você recebe esse plantão?</Label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCurrentShift({ ...currentShift, paymentMethod: option.value })}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        currentShift.paymentMethod === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      <span className="font-medium text-foreground">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {addShiftStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {currentShift.paymentMethod === "cooperativa" ? (
                <CooperativaForm
                  data={cooperativaData}
                  onChange={setCooperativaData}
                  showCustomCooperativa={showCustomCooperativa}
                  setShowCustomCooperativa={setShowCustomCooperativa}
                  onComplete={addShift}
                  onBack={() => setAddShiftStep(3)}
                />
              ) : (
                <DirectPaymentForm
                  data={directPaymentData}
                  onChange={setDirectPaymentData}
                  paymentMethod={currentShift.paymentMethod || ""}
                  onComplete={addShift}
                  onBack={() => setAddShiftStep(3)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const handleMainBack = () => {
    switch (mainStep) {
      case "type-selection":
        setMainStep("intro");
        break;
      case "fixed-intro":
        setMainStep("type-selection");
        break;
      case "adding-shift":
        if (addShiftStep > 1) {
          setAddShiftStep(addShiftStep - 1);
        } else {
          // If coming from calendar, go back to calendar
          if (fromCalendar) {
            navigate("/calendar");
          } else {
            setMainStep("fixed-intro");
          }
        }
        break;
      case "shift-summary":
        setMainStep("fixed-intro");
        break;
      default:
        break;
    }
  };

  const handleMainNext = () => {
    switch (mainStep) {
      case "intro":
        setMainStep("type-selection");
        break;
      case "type-selection":
        if (shiftType === "fixed" || shiftType === "hybrid") {
          setMainStep("fixed-intro");
        } else if (shiftType === "sporadic") {
          setMainStep("sporadic-flow");
        } else {
          // For organizing, skip to completion
          handleFinishOnboarding();
        }
        break;
      case "fixed-intro":
        if (fixedShifts.length > 0) {
          handleFinishOnboarding();
        }
        break;
      case "adding-shift":
        if (addShiftStep < 4) {
          setAddShiftStep(addShiftStep + 1);
        } else {
          addShift();
        }
        break;
      default:
        break;
    }
  };

  const canProceedMain = () => {
    switch (mainStep) {
      case "intro":
        return true;
      case "type-selection":
        return shiftType !== "";
      case "fixed-intro":
        return fixedShifts.length > 0;
      case "adding-shift":
        return canProceedInAddShift();
      default:
        return false;
    }
  };

  const getNextButtonText = () => {
    switch (mainStep) {
      case "intro":
        return "👉 Começar";
      case "adding-shift":
        return addShiftStep === 4 ? "Finalizar cadastro" : "Próximo";
      case "fixed-intro":
        return fixedShifts.length > 0 ? "Continuar" : "";
      default:
        return "Continuar";
    }
  };

  const showFooter = mainStep !== "completion" && mainStep !== "shift-summary" && mainStep !== "sporadic-flow" && !(mainStep === "adding-shift" && addShiftStep === 4);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <img src={medtrackLogo} alt="MedTrack" className="h-8 w-8 object-contain" />
          <span className="font-semibold text-foreground">MedTrack</span>
        </div>
        {mainStep === "intro" && (
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Fazer depois
          </Button>
        )}
      </header>

      {/* Progress Bar */}
      {mainStep !== "intro" && mainStep !== "completion" && mainStep !== "sporadic-flow" && (
        <div className="h-1 bg-muted">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage()}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Content */}
      {mainStep === "sporadic-flow" ? (
        <div className="flex-1 flex flex-col">
          {renderContent()}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={mainStep + (mainStep === "adding-shift" ? `-${addShiftStep}` : "")}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Footer */}
      {showFooter && (
        <footer className="p-6 border-t border-border">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            {mainStep !== "intro" && (
              <Button variant="outline" onClick={handleMainBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
            {getNextButtonText() && (
              <Button 
                variant="hero" 
                onClick={handleMainNext} 
                className="flex-1 gap-2"
                disabled={!canProceedMain()}
              >
                {getNextButtonText()}
                {mainStep !== "intro" && <ArrowRight className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};

export default ShiftOnboarding;
