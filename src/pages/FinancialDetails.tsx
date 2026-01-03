import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Wallet,
  Check,
  X,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Receipt,
  AlertTriangle
} from "lucide-react";
import { 
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth
} from "date-fns";
import { ptBR } from "date-fns/locale";


interface FixedShiftData {
  id: string;
  hospital: string;
  sector: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  grossValue: string;
  discountRate: string;
  paymentMethod?: string;
  cooperativaData?: {
    cooperativa?: string;
    workPeriod?: string;
    paymentDelay?: string;
    customPaymentDelay?: string;
    paymentPeriod?: string;
    customPaymentDay?: string;
  };
  directPaymentData?: {
    paymentTiming?: string;
    paymentDay?: string;
    customPaymentDay?: string;
  };
}

interface ShiftData {
  shiftType: string;
  fixedShifts: FixedShiftData[];
}

interface MonthlyShift {
  id: string;
  hospital: string;
  sector?: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: "fixed" | "sporadic";
  grossValue: number;
  netValue: number;
  taxAmount: number;
  expectedPaymentDate?: string;
  expectedPaymentDateRaw?: Date;
  status: "pending" | "completed" | "missed";
  paymentStatus: "pending" | "received";
}

interface Payment {
  date: Date;
  amount: number;
  hospital: string;
  shiftId: string;
}

const DAY_MAP: Record<string, number> = {
  "Domingo": 0,
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  "Sábado": 6,
};

const FinancialDetails = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyShifts, setMonthlyShifts] = useState<MonthlyShift[]>([]);
  const [shiftStatuses, setShiftStatuses] = useState<Record<string, "pending" | "completed" | "missed">>({});
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, "pending" | "received">>({});
  const [confirmedPayments, setConfirmedPayments] = useState<Payment[]>([]);
  
  // Financial totals
  const [totalPredicted, setTotalPredicted] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalTaxes, setTotalTaxes] = useState(0);
  const [taxesPaid, setTaxesPaid] = useState(0);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const calculateExpectedPaymentDate = (
    shiftDate: Date, 
    paymentMethod?: string,
    cooperativaData?: FixedShiftData['cooperativaData'],
    directPaymentData?: FixedShiftData['directPaymentData']
  ): { display: string; rawDate?: Date } | undefined => {
    const today = new Date();
    
    if (paymentMethod === "cooperativa" && cooperativaData) {
      const delay = parseInt(cooperativaData.customPaymentDelay || cooperativaData.paymentDelay || "30");
      const paymentPeriod = cooperativaData.paymentPeriod;
      const customDay = cooperativaData.customPaymentDay;
      
      // Calculate base payment date
      const baseDate = new Date(shiftDate);
      baseDate.setDate(baseDate.getDate() + delay);
      
      if (paymentPeriod === "exato" && customDay) {
        const paymentDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), parseInt(customDay));
        if (paymentDate < baseDate) {
          paymentDate.setMonth(paymentDate.getMonth() + 1);
        }
        return { display: `Dia ${customDay}`, rawDate: paymentDate };
      } else if (paymentPeriod === "1-5") {
        const paymentDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 5);
        if (paymentDate < baseDate) {
          paymentDate.setMonth(paymentDate.getMonth() + 1);
        }
        return { display: "Entre dias 1-5", rawDate: paymentDate };
      } else if (paymentPeriod === "10-15") {
        const paymentDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 15);
        if (paymentDate < baseDate) {
          paymentDate.setMonth(paymentDate.getMonth() + 1);
        }
        return { display: "Entre dias 10-15", rawDate: paymentDate };
      } else if (paymentPeriod === "20-30") {
        const paymentDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 30);
        if (paymentDate < baseDate) {
          paymentDate.setMonth(paymentDate.getMonth() + 1);
        }
        return { display: "Entre dias 20-30", rawDate: paymentDate };
      }
      return { display: format(baseDate, "d MMM", { locale: ptBR }), rawDate: baseDate };
    } else if (directPaymentData) {
      const paymentDay = directPaymentData.customPaymentDay || directPaymentData.paymentDay;
      if (paymentDay) {
        const dayNum = parseInt(paymentDay);
        const paymentDate = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), dayNum);
        if (directPaymentData.paymentTiming !== "mesmo-mes" || paymentDate < shiftDate) {
          paymentDate.setMonth(paymentDate.getMonth() + 1);
        }
        return { display: `Dia ${paymentDay}`, rawDate: paymentDate };
      }
      if (directPaymentData.paymentTiming === "mesmo-mes") {
        const paymentDate = new Date(shiftDate.getFullYear(), shiftDate.getMonth() + 1, 0);
        return { display: "Mesmo mês", rawDate: paymentDate };
      }
      const paymentDate = new Date(shiftDate.getFullYear(), shiftDate.getMonth() + 2, 0);
      return { display: "Mês seguinte", rawDate: paymentDate };
    }
    return undefined;
  };

  const getPaymentDelayDays = (expectedDate?: Date): number | null => {
    if (!expectedDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expected = new Date(expectedDate);
    expected.setHours(0, 0, 0, 0);
    
    if (today > expected) {
      const diffTime = today.getTime() - expected.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
  };

  const loadData = () => {
    const shiftsData = localStorage.getItem("plantonmed_shifts");
    const sporadicShiftsData = localStorage.getItem("plantonmed_sporadic_shifts");
    const statusesData = localStorage.getItem("plantonmed_shift_statuses");
    const paymentStatusesData = localStorage.getItem("plantonmed_payment_statuses");
    
    const statuses = statusesData ? JSON.parse(statusesData) : {};
    const payments = paymentStatusesData ? JSON.parse(paymentStatusesData) : {};
    
    setShiftStatuses(statuses);
    setPaymentStatuses(payments);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const shifts: MonthlyShift[] = [];
    let predictedTotal = 0;
    let taxesTotal = 0;
    const paymentsList: Payment[] = [];

    // Helper to check if a payment date falls in the selected month
    const isPaymentInMonth = (paymentDate?: Date): boolean => {
      if (!paymentDate) return false;
      return isSameMonth(paymentDate, currentMonth);
    };

    // Load fixed shifts - generate for a wide range to capture all potential payments
    if (shiftsData) {
      const data: ShiftData = JSON.parse(shiftsData);

      if (data.fixedShifts) {
        data.fixedShifts.forEach((fixedShift) => {
          const gross = parseFloat(fixedShift.grossValue?.replace(/\./g, '').replace(',', '.') || '0');
          const discount = parseFloat(fixedShift.discountRate || '0');
          const net = gross * (1 - discount / 100);
          const tax = gross - net;

          // Generate shifts for past 3 months to capture delayed payments
          const searchStart = new Date(currentMonth);
          searchStart.setMonth(searchStart.getMonth() - 3);
          const searchEnd = endOfMonth(currentMonth);
          const searchDays = eachDayOfInterval({ start: startOfMonth(searchStart), end: searchEnd });

          searchDays.forEach((day) => {
            const dayOfWeek = getDay(day);
            const matchingDay = fixedShift.daysOfWeek.find(d => DAY_MAP[d] === dayOfWeek);
            
            if (matchingDay) {
              const expectedPaymentResult = calculateExpectedPaymentDate(
                day,
                fixedShift.paymentMethod,
                fixedShift.cooperativaData,
                fixedShift.directPaymentData
              );

              // Only include if payment is expected in the selected month
              if (isPaymentInMonth(expectedPaymentResult?.rawDate)) {
                const shiftId = `${fixedShift.id}-${format(day, 'yyyy-MM-dd')}`;
                const shiftStatus = statuses[shiftId] || "pending";
                const paymentStatus = payments[shiftId] || "pending";
                
                shifts.push({
                  id: shiftId,
                  hospital: fixedShift.hospital,
                  sector: fixedShift.sector,
                  date: day,
                  startTime: fixedShift.startTime,
                  endTime: fixedShift.endTime,
                  type: "fixed",
                  grossValue: gross,
                  netValue: net,
                  taxAmount: tax,
                  expectedPaymentDate: expectedPaymentResult?.display,
                  expectedPaymentDateRaw: expectedPaymentResult?.rawDate,
                  status: shiftStatus,
                  paymentStatus: paymentStatus
                });

                predictedTotal += net;
                taxesTotal += tax;

                // Track confirmed payments
                if (paymentStatus === "received") {
                  paymentsList.push({
                    date: expectedPaymentResult?.rawDate || day,
                    amount: net,
                    hospital: fixedShift.hospital,
                    shiftId: shiftId
                  });
                }
              }
            }
          });
        });
      }
    }

    // Load sporadic shifts
    if (sporadicShiftsData) {
      try {
        const sporadicShifts = JSON.parse(sporadicShiftsData);
        if (Array.isArray(sporadicShifts)) {
          sporadicShifts.forEach((shift: any) => {
            const [year, month, day] = shift.date.split('-').map(Number);
            const shiftDate = new Date(year, month - 1, day);
            
            let grossValue = 0;
            let netValue = 0;
            let taxAmount = 0;
            let expectedPaymentResult: { display: string; rawDate?: Date } | undefined;

            if (shift.paymentMethod === "cooperativa" && shift.cooperativaData) {
              grossValue = parseFloat(shift.cooperativaData.grossValue?.replace(/\./g, '').replace(',', '.') || '0');
              const taxRate = parseFloat(shift.cooperativaData.customTaxRate || shift.cooperativaData.taxRate || '0');
              netValue = grossValue * (1 - taxRate / 100);
              taxAmount = grossValue - netValue;
              expectedPaymentResult = calculateExpectedPaymentDate(shiftDate, "cooperativa", shift.cooperativaData, undefined);
            } else if (shift.directPaymentData) {
              grossValue = parseFloat(shift.directPaymentData.grossValue?.replace(/\./g, '').replace(',', '.') || '0');
              const discountRate = parseFloat(shift.directPaymentData.customDiscountRate || shift.directPaymentData.discountRate || '0');
              netValue = grossValue * (1 - discountRate / 100);
              taxAmount = grossValue - netValue;
              expectedPaymentResult = calculateExpectedPaymentDate(shiftDate, "direct", undefined, shift.directPaymentData);
            }

            // Only include if payment is expected in the selected month
            if (isPaymentInMonth(expectedPaymentResult?.rawDate)) {
              const shiftId = `sporadic-${shift.id}`;
              const shiftStatus = statuses[shiftId] || "pending";
              const paymentStatus = payments[shiftId] || "pending";

              shifts.push({
                id: shiftId,
                hospital: shift.hospital,
                sector: shift.sector,
                date: shiftDate,
                startTime: shift.startTime,
                endTime: shift.endTime,
                type: "sporadic",
                grossValue,
                netValue,
                taxAmount,
                expectedPaymentDate: expectedPaymentResult?.display,
                expectedPaymentDateRaw: expectedPaymentResult?.rawDate,
                status: shiftStatus,
                paymentStatus: paymentStatus
              });

              predictedTotal += netValue;
              taxesTotal += taxAmount;

              if (paymentStatus === "received") {
                paymentsList.push({
                  date: expectedPaymentResult?.rawDate || shiftDate,
                  amount: netValue,
                  hospital: shift.hospital,
                  shiftId: shiftId
                });
              }
            }
          });
        }
      } catch (e) {
        console.error("Error parsing sporadic shifts:", e);
      }
    }

    // Sort shifts by date
    shifts.sort((a, b) => a.date.getTime() - b.date.getTime());
    paymentsList.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate received and pending based on payment status
    const receivedTotal = shifts
      .filter(s => s.paymentStatus === "received")
      .reduce((sum, s) => sum + s.netValue, 0);
    
    // Calculate taxes paid (only on received payments)
    const taxesPaidTotal = shifts
      .filter(s => s.paymentStatus === "received")
      .reduce((sum, s) => sum + s.taxAmount, 0);
    
    const pendingTotal = predictedTotal - receivedTotal;

    setMonthlyShifts(shifts);
    setConfirmedPayments(paymentsList);
    setTotalPredicted(predictedTotal);
    setTotalReceived(receivedTotal);
    setTotalPending(pendingTotal);
    setTotalTaxes(taxesTotal);
    setTaxesPaid(taxesPaidTotal);
  };

  const handleMarkPaymentReceived = (shiftId: string) => {
    const newPayments = { ...paymentStatuses, [shiftId]: "received" as const };
    setPaymentStatuses(newPayments);
    localStorage.setItem("plantonmed_payment_statuses", JSON.stringify(newPayments));
    loadData();
  };

  const handleMarkPaymentPending = (shiftId: string) => {
    const newPayments = { ...paymentStatuses, [shiftId]: "pending" as const };
    setPaymentStatuses(newPayments);
    localStorage.setItem("plantonmed_payment_statuses", JSON.stringify(newPayments));
    loadData();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  // Show all shifts with payments expected in this month (not filtered by completion status)
  const shiftsToPayThisMonth = monthlyShifts;

  const receivedPercentage = totalPredicted > 0 ? (totalReceived / totalPredicted) * 100 : 0;
  const pendingPercentage = totalPredicted > 0 ? (totalPending / totalPredicted) * 100 : 0;

  const monthName = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Detalhes Financeiros</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Month Navigator */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold text-foreground capitalize">{monthName}</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Financial Summary KPIs */}
        <motion.div 
          className="bg-card rounded-2xl border border-border p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Resumo financeiro de {format(currentMonth, "MMMM", { locale: ptBR })}
            </h2>
          </div>

          {/* Progress Chart */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                />
                {/* Pending arc (yellow) - full remaining */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="hsl(45, 93%, 47%)"
                  strokeWidth="12"
                  strokeDasharray={`${(pendingPercentage / 100) * 264} 264`}
                  strokeDashoffset={`${-((receivedPercentage / 100) * 264)}`}
                  strokeLinecap="round"
                />
                {/* Received arc (green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth="12"
                  strokeDasharray={`${(receivedPercentage / 100) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{receivedPercentage.toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground">recebido</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">Recebido</span>
                <span className="text-sm font-medium text-foreground ml-auto">{receivedPercentage.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">A receber</span>
                <span className="text-sm font-medium text-foreground ml-auto">{pendingPercentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="space-y-3">
            {/* Total Previsto - Full Width */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Total previsto</p>
              <p className="text-3xl font-bold text-foreground">R$ {formatCurrency(totalPredicted)}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Recebido */}
              <div className="p-4 bg-emerald-500/10 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Recebido no mês</p>
                <p className="text-xl font-bold text-emerald-600">R$ {formatCurrency(totalReceived)}</p>
              </div>
              
              {/* Impostos pagos */}
              <div className="p-4 bg-red-500/10 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Impostos/taxas pagos</p>
                <p className="text-xl font-bold text-red-600">R$ {formatCurrency(taxesPaid)}</p>
              </div>
              
              {/* A receber */}
              <div className="p-4 bg-amber-500/10 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">A receber (previsto)</p>
                <p className="text-xl font-bold text-amber-600">R$ {formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Shifts To Pay This Month */}
        <motion.div 
          className="bg-card rounded-2xl border border-border p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Plantões a serem pagos neste mês</h2>
          </div>

          {shiftsToPayThisMonth.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-2">
                Nenhum pagamento previsto para este mês.
              </p>
              <p className="text-sm text-muted-foreground">
                Cadastre seus plantões para ver as previsões.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/calendar")}
              >
                Ver agenda completa
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {shiftsToPayThisMonth.map((shift) => (
                <div 
                  key={shift.id}
                  className={`p-4 rounded-xl border ${
                    shift.type === "fixed" 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-orange-500/5 border-orange-500/20"
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        shift.type === "fixed" ? "bg-primary" : "bg-orange-500"
                      }`} />
                      <span className="font-semibold text-foreground text-sm">
                        {shift.hospital}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {shift.type === "fixed" ? "Fixo" : "Avulso"}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      R$ {formatCurrency(shift.netValue)}
                    </span>
                  </div>

                  {/* Info Row - Compact */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Plantão realizado em {format(shift.date, "d 'de' MMMM", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Previsão de recebimento: {shift.expectedPaymentDate || "—"}
                    </span>
                  </div>

                  {/* Payment Overdue Warning */}
                  {shift.paymentStatus !== "received" && (() => {
                    const delayDays = getPaymentDelayDays(shift.expectedPaymentDateRaw);
                    if (delayDays && delayDays > 0) {
                      return (
                        <div className="flex items-center gap-2 text-red-600 bg-red-500/10 rounded-lg px-3 py-2 mb-3 text-xs font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Pagamento atrasado ({delayDays} {delayDays === 1 ? "dia" : "dias"})</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Action Row */}
                  <div className="flex items-center gap-2">
                    {shift.paymentStatus === "received" ? (
                      <>
                        <Button 
                          size="sm" 
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                          disabled
                        >
                          <Check className="w-3 h-3" />
                          Recebido
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 text-xs text-muted-foreground"
                          onClick={() => handleMarkPaymentPending(shift.id)}
                        >
                          Desfazer
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                        onClick={() => handleMarkPaymentReceived(shift.id)}
                      >
                        <Check className="w-3 h-3" />
                        Sim, recebi
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </main>
    </div>
  );
};

export default FinancialDetails;
