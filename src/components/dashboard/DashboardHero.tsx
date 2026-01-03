import { motion } from "framer-motion";

interface DashboardHeroProps {
  userName: string;
  predictedAmount: string;
}

const DashboardHero = ({ userName, predictedAmount }: DashboardHeroProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-xl md:text-2xl font-bold mb-2">
        {getGreeting()}, Dr. {userName}.
      </h1>
      <p className="text-lg md:text-xl opacity-90">
        Você deve receber <span className="font-bold text-2xl md:text-3xl">R$ {predictedAmount}</span> este mês
      </p>
      <p className="text-sm opacity-75 mt-2">
        Com base nos seus plantões fixos e avulsos já cadastrados.
      </p>
    </motion.div>
  );
};

export default DashboardHero;
