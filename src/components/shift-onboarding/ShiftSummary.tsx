import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface ShiftSummaryData {
  hospital: string;
  sector?: string;
  duration: string;
  recurrence: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  paymentMethod: string;
  grossValue?: string;
  discountRate?: string;
  cooperativa?: string;
}

interface ShiftSummaryProps {
  data: ShiftSummaryData;
  onEdit: () => void;
}

const DURATION_LABELS: Record<string, string> = {
  "diurno-6h": "Plantão diurno — 6h",
  "diurno-12h": "Plantão diurno — 12h",
  "noturno-12h": "Plantão noturno — 12h",
};

const RECURRENCE_LABELS: Record<string, string> = {
  "semanal": "Toda semana",
  "quinzenal": "A cada 15 dias",
  "mensal": "1x por mês",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  "cooperativa": "Cooperativa",
  "pf": "Pessoa Física (RPA / autônomo)",
  "pj": "PJ (CNPJ próprio / Nota Fiscal)",
  "clt": "Contratado CLT",
};

const calculateMonthlyShifts = (recurrence: string, daysPerWeek: number): number => {
  switch (recurrence) {
    case "semanal":
      return daysPerWeek * 4;
    case "quinzenal":
      return daysPerWeek * 2;
    case "mensal":
      return daysPerWeek;
    default:
      return daysPerWeek * 4;
  }
};

const ShiftSummary = ({ data, onEdit }: ShiftSummaryProps) => {
  const monthlyShifts = calculateMonthlyShifts(data.recurrence, data.daysOfWeek.length);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground text-lg">Resumo do Plantão</h3>
      <p className="text-muted-foreground text-sm">
        Aqui está o resumo do plantão que você acabou de cadastrar:
      </p>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Local</span>
            <p className="font-medium text-foreground">{data.hospital}</p>
          </div>
          
          {data.sector && (
            <div>
              <span className="text-muted-foreground">Setor</span>
              <p className="font-medium text-foreground">{data.sector}</p>
            </div>
          )}
          
          <div>
            <span className="text-muted-foreground">Frequência</span>
            <p className="font-medium text-foreground">{RECURRENCE_LABELS[data.recurrence] || data.recurrence}</p>
          </div>
          
          <div>
            <span className="text-muted-foreground">Média de plantões/mês</span>
            <p className="font-medium text-foreground">{monthlyShifts} plantões</p>
          </div>
          
          <div>
            <span className="text-muted-foreground">Duração</span>
            <p className="font-medium text-foreground">{DURATION_LABELS[data.duration] || data.duration}</p>
          </div>
          
          <div>
            <span className="text-muted-foreground">Horário</span>
            <p className="font-medium text-foreground">{data.startTime} às {data.endTime}</p>
          </div>
          
          <div>
            <span className="text-muted-foreground">Dias da semana</span>
            <p className="font-medium text-foreground">{data.daysOfWeek.map(d => d.substring(0, 3)).join(", ")}</p>
          </div>
          
          <div>
            <span className="text-muted-foreground">Forma de recebimento</span>
            <p className="font-medium text-foreground">
              {data.paymentMethod === "cooperativa" && data.cooperativa 
                ? data.cooperativa 
                : PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod}
            </p>
          </div>
          
          {data.grossValue && (
            <div>
              <span className="text-muted-foreground">Valor bruto</span>
              <p className="font-medium text-foreground">R$ {data.grossValue}</p>
            </div>
          )}
          
          {data.discountRate && (
            <div>
              <span className="text-muted-foreground">Descontos</span>
              <p className="font-medium text-foreground">{data.discountRate}%</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onEdit}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Pencil className="w-3 h-3" />
          Algo está errado? Editar este plantão
        </button>
      </div>
    </div>
  );
};

export default ShiftSummary;
