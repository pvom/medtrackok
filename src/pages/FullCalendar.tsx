import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  ChevronLeft,
  Check,
  X,
  Calendar
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday,
  addMonths,
  subMonths,
  getDay,
  isSameDay,
  isSameMonth,
  parse
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { HOSPITAL_COLORS, type Shift } from "@/components/dashboard/WeeklyCalendar";
import AddShiftModal from "@/components/add-shift/AddShiftModal";

interface ShiftData {
  shiftType: string;
  fixedShifts: Array<{
    id: string;
    hospital: string;
    sector: string;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    grossValue: string;
    discountRate: string;
  }>;
}

interface SporadicData {
  averageShiftsPerMonth: string;
  averageNetValue: string;
  paymentPeriod: string;
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

const FullCalendar = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [shiftStatuses, setShiftStatuses] = useState<Record<string, "pending" | "completed" | "missed">>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalInitialDate, setAddModalInitialDate] = useState<Date | undefined>();

  useEffect(() => {
    loadAllShifts();
  }, [currentMonth]);

  const loadAllShifts = () => {
    const shiftsData = localStorage.getItem("plantonmed_shifts");
    const sporadicShiftsData = localStorage.getItem("plantonmed_sporadic_shifts");
    const statusesData = localStorage.getItem("plantonmed_shift_statuses");
    
    if (statusesData) {
      setShiftStatuses(JSON.parse(statusesData));
    }

    const generatedShifts: Shift[] = [];
    const hospitalColorMap: Record<string, string> = {};
    let colorIndex = 0;

    // Load fixed shifts
    if (shiftsData) {
      const data: ShiftData = JSON.parse(shiftsData);
      
      if (data.fixedShifts) {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        data.fixedShifts.forEach((fixedShift) => {
          if (!hospitalColorMap[fixedShift.hospital]) {
            hospitalColorMap[fixedShift.hospital] = HOSPITAL_COLORS[colorIndex % HOSPITAL_COLORS.length];
            colorIndex++;
          }

          daysInMonth.forEach((day) => {
            const dayOfWeek = getDay(day);
            const matchingDay = fixedShift.daysOfWeek.find(d => DAY_MAP[d] === dayOfWeek);
            
            if (matchingDay) {
              const shiftId = `${fixedShift.id}-${format(day, 'yyyy-MM-dd')}`;
              generatedShifts.push({
                id: shiftId,
                hospital: fixedShift.hospital,
                startTime: fixedShift.startTime,
                endTime: fixedShift.endTime,
                color: hospitalColorMap[fixedShift.hospital],
                date: day,
                type: "fixed",
                status: shiftStatuses[shiftId] || "pending"
              });
            }
          });
        });
      }
    }

    // Load sporadic shifts (individual ones from AddShiftModal)
    if (sporadicShiftsData) {
      try {
        const sporadicShifts = JSON.parse(sporadicShiftsData);
        
        if (Array.isArray(sporadicShifts)) {
          sporadicShifts.forEach((shift: any) => {
            if (!hospitalColorMap[shift.hospital]) {
              hospitalColorMap[shift.hospital] = HOSPITAL_COLORS[colorIndex % HOSPITAL_COLORS.length];
              colorIndex++;
            }

            const shiftDate = parse(shift.date, "yyyy-MM-dd", new Date());
            
            if (isSameMonth(shiftDate, currentMonth)) {
              const shiftId = `sporadic-${shift.id}`;
              generatedShifts.push({
                id: shiftId,
                hospital: shift.hospital,
                startTime: shift.startTime,
                endTime: shift.endTime,
                color: hospitalColorMap[shift.hospital],
                date: shiftDate,
                type: "sporadic" as const,
                status: shiftStatuses[shiftId] || "pending",
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing sporadic shifts:", e);
      }
    }

    setShifts(generatedShifts);
  };

  const handleOpenAddModal = (initialDate?: Date) => {
    setAddModalInitialDate(initialDate);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddModalInitialDate(undefined);
  };

  const handleShiftAdded = () => {
    loadAllShifts();
  };

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => isSameDay(shift.date, date));
  };

  const calculateShiftHours = (startTime: string, endTime: string): number => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let hours = endH - startH + (endM - startM) / 60;
    if (hours <= 0) hours += 24; // overnight shift
    return hours;
  };

  const calculateMonthStats = () => {
    const fixedShifts = shifts.filter(s => s.type === "fixed");
    const sporadicShifts = shifts.filter(s => s.type === "sporadic");
    
    // Previstos (todos os plantões cadastrados)
    const previstoTotal = shifts.length;
    const previstoFixos = fixedShifts.length;
    const previstoAvulsos = sporadicShifts.length;
    const previstoHoras = shifts.reduce((acc, shift) => {
      return acc + calculateShiftHours(shift.startTime, shift.endTime);
    }, 0);

    // Realizados (apenas os marcados como completed)
    const completedShifts = shifts.filter(s => shiftStatuses[s.id] === "completed");
    const completedFixos = completedShifts.filter(s => s.type === "fixed");
    const completedAvulsos = completedShifts.filter(s => s.type === "sporadic");
    
    const realizadoTotal = completedShifts.length;
    const realizadoFixos = completedFixos.length;
    const realizadoAvulsos = completedAvulsos.length;
    const realizadoHoras = completedShifts.reduce((acc, shift) => {
      return acc + calculateShiftHours(shift.startTime, shift.endTime);
    }, 0);

    return {
      previsto: {
        total: previstoTotal,
        fixos: previstoFixos,
        avulsos: previstoAvulsos,
        horas: Math.round(previstoHoras)
      },
      realizado: {
        total: realizadoTotal,
        fixos: realizadoFixos,
        avulsos: realizadoAvulsos,
        horas: Math.round(realizadoHoras)
      }
    };
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleMarkCompleted = (shiftId: string) => {
    const newStatuses = { ...shiftStatuses, [shiftId]: "completed" as const };
    setShiftStatuses(newStatuses);
    localStorage.setItem("plantonmed_shift_statuses", JSON.stringify(newStatuses));
    loadAllShifts();
  };

  const handleMarkMissed = (shiftId: string) => {
    const newStatuses = { ...shiftStatuses, [shiftId]: "missed" as const };
    setShiftStatuses(newStatuses);
    localStorage.setItem("plantonmed_shift_statuses", JSON.stringify(newStatuses));
    loadAllShifts();
  };

  const handleResetStatus = (shiftId: string) => {
    const newStatuses = { ...shiftStatuses };
    delete newStatuses[shiftId];
    setShiftStatuses(newStatuses);
    localStorage.setItem("plantonmed_shift_statuses", JSON.stringify(newStatuses));
    loadAllShifts();
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week the month starts on (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = getDay(monthStart);
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  
  const stats = calculateMonthStats();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center h-14">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="mr-3"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Sua Agenda Completa</h1>
        </div>
      </header>

      <main className="container py-4 max-w-lg mx-auto">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="gap-1 px-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{format(subMonths(currentMonth, 1), "MMM", { locale: ptBR })}</span>
          </Button>
          <h2 className="text-lg font-bold text-foreground capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleNextMonth} className="gap-1 px-2">
            <span className="hidden sm:inline">{format(addMonths(currentMonth, 1), "MMM", { locale: ptBR })}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <motion.div 
          className="bg-card rounded-xl border border-border p-3 mb-4 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["S", "T", "Q", "Q", "S", "S", "D"].map((day, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for days before the month starts */}
            {Array.from({ length: adjustedStartDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            
            {daysInMonth.map((day) => {
              const dayShifts = getShiftsForDay(day);
              const isCurrentDay = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`h-10 rounded-md text-center transition-all relative flex flex-col items-center justify-center ${
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : isCurrentDay 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <span className="text-xs font-medium">
                    {format(day, "d")}
                  </span>
                  {dayShifts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayShifts.slice(0, 3).map((shift, i) => (
                        <div 
                          key={i} 
                          className={`w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground/70" : shift.color}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Legend or Empty State */}
        {shifts.length > 0 ? (
          <div className="flex flex-wrap gap-3 mb-4 px-1">
            {Array.from(new Set(shifts.map(s => s.hospital))).slice(0, 4).map((hospital, i) => (
              <div key={hospital} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${HOSPITAL_COLORS[i % HOSPITAL_COLORS.length]}`} />
                <span className="text-xs text-muted-foreground">{hospital}</span>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="bg-card rounded-xl border border-border p-6 mb-4 shadow-sm text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sua agenda ainda não tem plantões cadastrados.
            </p>
            <Button variant="hero" size="sm" className="gap-2" onClick={() => handleOpenAddModal()}>
              <Plus className="w-4 h-4" />
              Adicione seu primeiro plantão do mês
            </Button>
          </motion.div>
        )}

        {/* Selected Day Detail Card */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-card rounded-xl border border-border p-4 mb-4 shadow-sm"
            >
              <h3 className="text-sm font-bold text-foreground mb-3 capitalize">
                {format(selectedDate, "d 'de' MMMM — EEEE", { locale: ptBR })}
              </h3>
              
              {getShiftsForDay(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getShiftsForDay(selectedDate).map((shift) => (
                    <div key={shift.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${shift.color}`} />
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {shift.type === "fixed" ? "Fixo" : "Avulso"}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {shift.hospital}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {shift.startTime}–{shift.endTime}
                      </p>
                      
                      {shiftStatuses[shift.id] !== "completed" && shiftStatuses[shift.id] !== "missed" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkCompleted(shift.id)}
                            className="h-7 gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Check className="w-3 h-3" />
                            Realizado
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkMissed(shift.id)}
                            className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-3 h-3" />
                            Não realizei
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${shiftStatuses[shift.id] === "completed" ? "text-emerald-600" : "text-destructive"}`}>
                            {shiftStatuses[shift.id] === "completed" ? "✓ Realizado" : "✗ Não realizado"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResetStatus(shift.id)}
                            className="h-6 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Desfazer
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum plantão neste dia.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Month Stats */}
        <motion.div 
          className="bg-card rounded-xl border border-border p-4 mb-4 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Resumo do mês</h3>
          
          {/* Plantões Previstos */}
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Plantões Previstos</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center bg-muted/50 rounded-lg py-2">
                <p className="text-lg font-bold text-foreground">{stats.previsto.total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="text-center bg-muted/50 rounded-lg py-2">
                <p className="text-lg font-bold text-foreground">{stats.previsto.fixos}</p>
                <p className="text-[10px] text-muted-foreground">Fixos</p>
              </div>
              <div className="text-center bg-muted/50 rounded-lg py-2">
                <p className="text-lg font-bold text-foreground">{stats.previsto.avulsos}</p>
                <p className="text-[10px] text-muted-foreground">Avulsos</p>
              </div>
              <div className="text-center bg-muted/50 rounded-lg py-2">
                <p className="text-lg font-bold text-foreground">{stats.previsto.horas}h</p>
                <p className="text-[10px] text-muted-foreground">Horas</p>
              </div>
            </div>
          </div>

          {/* Plantões Realizados */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Plantões Realizados</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-lg py-2">
                <p className="text-lg font-bold text-emerald-600">{stats.realizado.total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-lg py-2">
                <p className="text-lg font-bold text-emerald-600">{stats.realizado.fixos}</p>
                <p className="text-[10px] text-muted-foreground">Fixos</p>
              </div>
              <div className="text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-lg py-2">
                <p className="text-lg font-bold text-emerald-600">{stats.realizado.avulsos}</p>
                <p className="text-[10px] text-muted-foreground">Avulsos</p>
              </div>
              <div className="text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-lg py-2">
                <p className="text-lg font-bold text-emerald-600">{stats.realizado.horas}h</p>
                <p className="text-[10px] text-muted-foreground">Horas</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Add Shift Button */}
        <Button variant="hero" className="w-full gap-2" size="sm" onClick={() => handleOpenAddModal()}>
          <Plus className="w-4 h-4" />
          Adicionar plantão
        </Button>
      </main>

      {/* Add Shift Modal */}
      <AddShiftModal 
        open={showAddModal}
        onClose={handleCloseAddModal}
        onComplete={handleShiftAdded}
        initialDate={addModalInitialDate}
      />
    </div>
  );
};

export default FullCalendar;
