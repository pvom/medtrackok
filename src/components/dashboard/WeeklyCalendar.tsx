import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Check, X } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Shift {
  id: string;
  hospital: string;
  startTime: string;
  endTime: string;
  color: string;
  date: Date;
  type: "fixed" | "sporadic";
  status?: "pending" | "completed" | "missed";
}

interface WeeklyCalendarProps {
  shifts: Shift[];
  onViewFullCalendar: () => void;
  onAddSporadicShift: () => void;
  onMarkShiftCompleted: (shiftId: string) => void;
  onMarkShiftMissed: (shiftId: string) => void;
  onResetShiftStatus?: (shiftId: string) => void;
}

const HOSPITAL_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
];

const WeeklyCalendar = ({ 
  shifts, 
  onViewFullCalendar, 
  onAddSporadicShift,
  onMarkShiftCompleted,
  onMarkShiftMissed,
  onResetShiftStatus
}: WeeklyCalendarProps) => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDayAbbrev = (date: Date) => {
    return format(date, "EEE", { locale: ptBR }).substring(0, 3).toUpperCase();
  };

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => isSameDay(shift.date, date));
  };

  const todayShifts = shifts.filter(shift => isToday(shift.date));

  return (
    <motion.div 
      className="bg-card rounded-2xl border border-border p-5 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Calendário Inteligente de Plantões
        </h2>
      </div>

      {/* Mini weekly calendar */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={index} 
              className={`text-center p-2 rounded-lg ${
                isCurrentDay 
                  ? "bg-primary/10 border border-primary/30" 
                  : "hover:bg-muted/50"
              }`}
            >
              <p className={`text-xs font-medium mb-1 ${
                isCurrentDay ? "text-primary" : "text-muted-foreground"
              }`}>
                {getDayAbbrev(day)}
              </p>
              <p className={`text-sm font-semibold mb-1 ${
                isCurrentDay ? "text-primary" : "text-foreground"
              }`}>
                {format(day, "d")}
              </p>
              <div className="flex flex-col gap-0.5">
                {dayShifts.slice(0, 2).map((shift, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full ${shift.color}`}
                    title={`${shift.hospital} — ${shift.startTime}–${shift.endTime}`}
                  />
                ))}
                {dayShifts.length > 2 && (
                  <p className="text-[10px] text-muted-foreground">+{dayShifts.length - 2}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shift legend */}
      {shifts.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from(new Set(shifts.map(s => s.hospital))).slice(0, 4).map((hospital, i) => (
            <div key={hospital} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${HOSPITAL_COLORS[i % HOSPITAL_COLORS.length]}`} />
              <span className="text-sm text-muted-foreground">{hospital}</span>
            </div>
          ))}
        </div>
      )}

      {/* Today section */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Hoje
        </h3>
        
        {todayShifts.length > 0 ? (
          <div className="space-y-3">
            {todayShifts.map((shift) => (
              <div 
                key={shift.id}
                className="bg-muted/50 rounded-xl p-4"
              >
                <p className="text-foreground font-medium mb-2">
                  Você tem um plantão no {shift.hospital} ({shift.startTime}–{shift.endTime})
                </p>
                {shift.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkShiftCompleted(shift.id)}
                      className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <Check className="w-4 h-4" />
                      Realizado
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkShiftMissed(shift.id)}
                      className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                      Não realizei
                    </Button>
                  </div>
                )}
                {shift.status === "completed" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-4 h-4" /> Realizado
                    </span>
                    {onResetShiftStatus && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onResetShiftStatus(shift.id)}
                        className="h-6 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Desfazer
                      </Button>
                    )}
                  </div>
                )}
                {shift.status === "missed" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-destructive font-medium flex items-center gap-1">
                      <X className="w-4 h-4" /> Não realizado
                    </span>
                    {onResetShiftStatus && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onResetShiftStatus(shift.id)}
                        className="h-6 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Desfazer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhum plantão agendado para hoje.
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onAddSporadicShift}
          className="gap-2 flex-1"
        >
          <Plus className="w-4 h-4" />
          Adicionar plantão avulso esta semana
        </Button>
        <Button
          variant="ghost"
          onClick={onViewFullCalendar}
          className="gap-2 text-primary"
        >
          <Calendar className="w-4 h-4" />
          Veja aqui sua agenda completa
        </Button>
      </div>
    </motion.div>
  );
};

export default WeeklyCalendar;
export { HOSPITAL_COLORS };
export type { Shift };
