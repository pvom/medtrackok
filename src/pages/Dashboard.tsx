import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp,
  Bell,
  LogOut,
  Wallet,
  ArrowRight,
  Plus,
  Pencil,
  X,
  Check
} from "lucide-react";
import medtrackLogo from "@/assets/medtrack-logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardHero from "@/components/dashboard/DashboardHero";
import WeeklyCalendar, { type Shift, HOSPITAL_COLORS } from "@/components/dashboard/WeeklyCalendar";
import AddShiftModal from "@/components/add-shift/AddShiftModal";
import { 
  startOfWeek, 
  addDays, 
  getDay,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth
} from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Médico");
  const [monthlyGoal, setMonthlyGoal] = useState("0");
  const [predictedAmount, setPredictedAmount] = useState("0,00");
  const [receivedAmount, setReceivedAmount] = useState("0,00");
  const [pendingAmount, setPendingAmount] = useState("0,00");
  const [averageShiftValue, setAverageShiftValue] = useState(0);
  const [totalShiftsCount, setTotalShiftsCount] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftStatuses, setShiftStatuses] = useState<Record<string, "pending" | "completed" | "missed">>({});
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [addShiftStartWithSporadic, setAddShiftStartWithSporadic] = useState(true);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [editGoalValue, setEditGoalValue] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("plantonmed_user");
    const profileData = localStorage.getItem("plantonmed_profile");
    const statusesData = localStorage.getItem("plantonmed_shift_statuses");
    
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name.split(" ")[0]);
    }
    
    if (profileData) {
      const profile = JSON.parse(profileData);
      setMonthlyGoal(profile.monthlyGoal || "0");
    }

    if (statusesData) {
      setShiftStatuses(JSON.parse(statusesData));
    }

    loadShifts();
  }, []);

  const loadShifts = () => {
    const shiftsData = localStorage.getItem("plantonmed_shifts");
    const sporadicEstimateData = localStorage.getItem("plantonmed_sporadic_estimate");
    const sporadicShiftsData = localStorage.getItem("plantonmed_sporadic_shifts");
    const statusesData = localStorage.getItem("plantonmed_shift_statuses");
    
    const statuses = statusesData ? JSON.parse(statusesData) : {};
    let totalMonthlyEarnings = 0;
    const generatedShifts: Shift[] = [];
    const hospitalColorMap: Record<string, string> = {};
    let colorIndex = 0;

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // For monthly financial calculation
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Track shift values for financial calculations
    interface ShiftWithValue {
      id: string;
      netValue: number;
    }
    const monthlyShiftsWithValues: ShiftWithValue[] = [];

    // Load fixed shifts
    if (shiftsData) {
      const data: ShiftData = JSON.parse(shiftsData);

      if (data.fixedShifts) {
        data.fixedShifts.forEach((fixedShift) => {
          // Assign color to hospital if not already assigned
          if (!hospitalColorMap[fixedShift.hospital]) {
            hospitalColorMap[fixedShift.hospital] = HOSPITAL_COLORS[colorIndex % HOSPITAL_COLORS.length];
            colorIndex++;
          }

          // Calculate net value for this shift
          const gross = parseFloat(fixedShift.grossValue?.replace(/\./g, '').replace(',', '.') || '0');
          const discount = parseFloat(fixedShift.discountRate || '0');
          const net = gross * (1 - discount / 100);

          // Generate shifts for current week (for calendar display)
          weekDays.forEach((day) => {
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
                status: statuses[shiftId] || "pending"
              });
            }
          });

          // Generate shifts for entire month (for financial calculation)
          daysInMonth.forEach((day) => {
            const dayOfWeek = getDay(day);
            const matchingDay = fixedShift.daysOfWeek.find(d => DAY_MAP[d] === dayOfWeek);
            
            if (matchingDay) {
              const shiftId = `${fixedShift.id}-${format(day, 'yyyy-MM-dd')}`;
              monthlyShiftsWithValues.push({
                id: shiftId,
                netValue: net
              });
              totalMonthlyEarnings += net;
            }
          });
        });
      }
    }

    // Load individual sporadic shifts (from AddShiftModal)
    if (sporadicShiftsData) {
      try {
        const sporadicShifts = JSON.parse(sporadicShiftsData);
        if (Array.isArray(sporadicShifts)) {
          sporadicShifts.forEach((shift: any) => {
            const [year, month, day] = shift.date.split('-').map(Number);
            const shiftDate = new Date(year, month - 1, day);
            
            // Calculate net value
            let netValue = 0;
            if (shift.paymentMethod === "cooperativa" && shift.cooperativaData) {
              const gross = parseFloat(shift.cooperativaData.grossValue?.replace(/\./g, '').replace(',', '.') || '0');
              const taxRate = parseFloat(shift.cooperativaData.customTaxRate || shift.cooperativaData.taxRate || '0');
              netValue = gross * (1 - taxRate / 100);
            } else if (shift.directPaymentData) {
              const gross = parseFloat(shift.directPaymentData.grossValue?.replace(/\./g, '').replace(',', '.') || '0');
              const discountRate = parseFloat(shift.directPaymentData.customDiscountRate || shift.directPaymentData.discountRate || '0');
              netValue = gross * (1 - discountRate / 100);
            }

            // Add to weekly calendar if in current week
            const isInWeek = weekDays.some(d => format(d, 'yyyy-MM-dd') === shift.date);
            
            if (isInWeek) {
              if (!hospitalColorMap[shift.hospital]) {
                hospitalColorMap[shift.hospital] = HOSPITAL_COLORS[colorIndex % HOSPITAL_COLORS.length];
                colorIndex++;
              }

              const shiftId = `sporadic-${shift.id}`;
              generatedShifts.push({
                id: shiftId,
                hospital: shift.hospital,
                startTime: shift.startTime,
                endTime: shift.endTime,
                color: hospitalColorMap[shift.hospital],
                date: shiftDate,
                type: "sporadic",
                status: statuses[shiftId] || "pending"
              });
            }

            // Add to monthly calculation if in current month
            if (isSameMonth(shiftDate, today)) {
              const shiftId = `sporadic-${shift.id}`;
              monthlyShiftsWithValues.push({
                id: shiftId,
                netValue
              });
              totalMonthlyEarnings += netValue;
            }
          });
        }
      } catch (e) {
        console.error("Error parsing sporadic shifts:", e);
      }
    }

    // Add sporadic estimate earnings (from onboarding)
    if (sporadicEstimateData) {
      try {
        const sporadic: SporadicData = JSON.parse(sporadicEstimateData);
        const avgValue = parseFloat(sporadic.averageNetValue?.replace(/\./g, '').replace(',', '.') || '0');
        const avgShifts = parseInt(sporadic.averageShiftsPerMonth || '0');
        totalMonthlyEarnings += avgValue * avgShifts;
      } catch (e) {
        console.error("Error parsing sporadic estimate:", e);
      }
    }

    // Calculate received amount (only shifts marked as completed)
    let received = 0;
    monthlyShiftsWithValues.forEach((shift) => {
      if (statuses[shift.id] === "completed") {
        received += shift.netValue;
      }
    });

    const pending = totalMonthlyEarnings - received;

    // Calculate average shift value
    const shiftCount = monthlyShiftsWithValues.length;
    const avgValue = shiftCount > 0 ? totalMonthlyEarnings / shiftCount : 0;

    setShifts(generatedShifts);
    setPredictedAmount(totalMonthlyEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setReceivedAmount(received.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setPendingAmount(pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setAverageShiftValue(avgValue);
    setTotalShiftsCount(shiftCount);
  };

  const handleLogout = () => {
    localStorage.removeItem("plantonmed_user");
    localStorage.removeItem("plantonmed_profile");
    localStorage.removeItem("plantonmed_shifts");
    localStorage.removeItem("plantonmed_sporadic_shifts");
    localStorage.removeItem("plantonmed_shift_statuses");
    navigate("/");
  };

  const handleMarkShiftCompleted = (shiftId: string) => {
    const newStatuses = { ...shiftStatuses, [shiftId]: "completed" as const };
    setShiftStatuses(newStatuses);
    localStorage.setItem("plantonmed_shift_statuses", JSON.stringify(newStatuses));
    
    // Update shifts state
    setShifts(prev => prev.map(s => 
      s.id === shiftId ? { ...s, status: "completed" } : s
    ));
  };

  const handleMarkShiftMissed = (shiftId: string) => {
    const newStatuses = { ...shiftStatuses, [shiftId]: "missed" as const };
    setShiftStatuses(newStatuses);
    localStorage.setItem("plantonmed_shift_statuses", JSON.stringify(newStatuses));
    
    // Update shifts state
    setShifts(prev => prev.map(s => 
      s.id === shiftId ? { ...s, status: "missed" } : s
    ));
  };

  const handleResetShiftStatus = (shiftId: string) => {
    const newStatuses = { ...shiftStatuses };
    delete newStatuses[shiftId];
    setShiftStatuses(newStatuses);
    localStorage.setItem("plantonmed_shift_statuses", JSON.stringify(newStatuses));
    
    // Update shifts state
    setShifts(prev => prev.map(s => 
      s.id === shiftId ? { ...s, status: "pending" } : s
    ));
    
    // Reload to update financial calculations
    loadShifts();
  };

  const handleAddSporadicShift = () => {
    setAddShiftStartWithSporadic(true);
    setShowAddShiftModal(true);
  };

  const handleAddNewShift = () => {
    setAddShiftStartWithSporadic(false);
    setShowAddShiftModal(true);
  };

  const handleShiftAdded = () => {
    loadShifts();
  };

  const handleOpenEditGoal = () => {
    setEditGoalValue(monthlyGoal);
    setShowEditGoalModal(true);
  };

  const handleSaveGoal = () => {
    const profileData = localStorage.getItem("plantonmed_profile");
    const profile = profileData ? JSON.parse(profileData) : {};
    profile.monthlyGoal = editGoalValue;
    localStorage.setItem("plantonmed_profile", JSON.stringify(profile));
    setMonthlyGoal(editGoalValue);
    setShowEditGoalModal(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src={medtrackLogo} alt="MedTrack" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-foreground">MedTrack</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Hero Section */}
        <DashboardHero 
          userName={userName} 
          predictedAmount={predictedAmount}
        />

        {/* Weekly Calendar */}
        <WeeklyCalendar
          shifts={shifts}
          onViewFullCalendar={() => navigate("/calendar")}
          onAddSporadicShift={handleAddSporadicShift}
          onMarkShiftCompleted={handleMarkShiftCompleted}
          onMarkShiftMissed={handleMarkShiftMissed}
          onResetShiftStatus={handleResetShiftStatus}
        />

        {/* Add Shift Modal */}
        <AddShiftModal
          open={showAddShiftModal}
          onClose={() => setShowAddShiftModal(false)}
          onComplete={handleShiftAdded}
          startWithSporadic={addShiftStartWithSporadic}
        />

        {/* Visão Financeira do Mês */}
        {(() => {
          const predicted = parseFloat(predictedAmount.replace(/\./g, '').replace(',', '.')) || 0;
          const received = parseFloat(receivedAmount.replace(/\./g, '').replace(',', '.')) || 0;
          const pending = parseFloat(pendingAmount.replace(/\./g, '').replace(',', '.')) || 0;

          const chartData = [
            { name: "Recebido", value: received, color: "hsl(142, 71%, 45%)" },
            { name: "A receber", value: pending > 0 ? pending : 0, color: "hsl(221, 83%, 53%)" }
          ].filter(d => d.value > 0);

          // If no data, show placeholder
          if (chartData.length === 0) {
            chartData.push({ name: "Previsto", value: 1, color: "hsl(var(--muted))" });
          }

          return (
            <motion.div 
              className="bg-card rounded-2xl border border-border p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Visão Financeira do Mês</h2>
              </div>

              <div className="flex items-center gap-6">
                {/* Chart */}
                <div className="w-28 h-28 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* KPIs */}
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Total previsto</p>
                    <p className="text-2xl font-bold text-foreground">R$ {predictedAmount}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Recebido</p>
                      <p className="text-lg font-bold text-emerald-600">R$ {receivedAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">A receber</p>
                      <p className="text-lg font-bold text-primary">R$ {pendingAmount}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-6 gap-2"
                onClick={() => navigate("/financeiro")}
              >
                Abrir detalhes financeiros
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          );
        })()}

        {/* Meta Financeira */}
        <motion.div 
          className="bg-card rounded-2xl border border-border p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Meta Financeira</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleOpenEditGoal}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>

          {(() => {
            const received = parseFloat(receivedAmount.replace(/\./g, '').replace(',', '.')) || 0;
            const goal = parseFloat(monthlyGoal.replace(/\./g, '').replace(',', '.')) || 0;
            
            // Empty state: no goal defined
            if (goal === 0) {
              return (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium mb-2">
                    Defina sua meta financeira para acompanhar seu progresso no mês.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/onboarding/perfil")}
                  >
                    Definir meta
                  </Button>
                </div>
              );
            }

            const percentage = Math.min((received / goal) * 100, 100);
            const missing = Math.max(goal - received, 0);
            const shiftsNeeded = averageShiftValue > 0 ? Math.ceil(missing / averageShiftValue) : 0;
            const goalReached = received >= goal;
            
            return (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Sua meta mensal: <span className="font-semibold text-foreground">R$ {monthlyGoal}/mês</span>
                </p>

                {/* Progress Bar */}
                <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-2">
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-sm mb-6">
                  <span className="text-muted-foreground">{percentage.toFixed(0)}% alcançado</span>
                  <span className="text-primary font-medium">R$ {receivedAmount}</span>
                </div>

                {/* Goal reached or missing */}
                {goalReached ? (
                  <div className="p-4 bg-emerald-500/10 rounded-xl text-center">
                    <p className="text-lg font-bold text-emerald-600">🎉 Meta alcançada!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Você atingiu sua meta financeira deste mês.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-amber-500/10 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Falta para bater a meta</p>
                      <p className="text-xl font-bold text-amber-600">
                        R$ {missing.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Plantões necessários</p>
                      <p className="text-xl font-bold text-primary">
                        {shiftsNeeded} {shiftsNeeded === 1 ? 'plantão' : 'plantões'}
                      </p>
                      {averageShiftValue > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          (média de R$ {averageShiftValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/plantão)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button 
            variant="outline" 
            className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-card border-border hover:bg-muted/50"
            onClick={handleAddNewShift}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-foreground">Cadastrar Novo Plantão</span>
          </Button>
        </motion.div>

        {/* Edit Goal Modal */}
        <Dialog open={showEditGoalModal} onOpenChange={setShowEditGoalModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Meta Financeira</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Qual sua meta de renda líquida mensal?
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    type="text"
                    placeholder="15.000"
                    value={editGoalValue}
                    onChange={(e) => setEditGoalValue(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditGoalModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveGoal}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Dashboard;
