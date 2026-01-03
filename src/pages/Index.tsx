import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Calendar, 
  PieChart, 
  Shield, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import medtrackLogo from "@/assets/medtrack-logo.png";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: "Previsibilidade de Renda",
      description: "Saiba exatamente quanto vai receber e quando, mesmo com múltiplos plantões."
    },
    {
      icon: Calendar,
      title: "Gestão de Plantões",
      description: "Organize plantões fixos e avulsos, controle datas e valores em um só lugar."
    },
    {
      icon: PieChart,
      title: "Análise de Rentabilidade",
      description: "Compare quanto rende cada hospital, setor ou tipo de plantão."
    },
    {
      icon: Shield,
      title: "Controle de Impostos",
      description: "Acompanhe ISS, IR e taxas de cooperativa automaticamente."
    }
  ];

  const benefits = [
    "Organize múltiplas fontes de renda",
    "Calcule quanto precisa trabalhar para atingir sua meta",
    "Planeje férias sem perder previsibilidade",
    "Tenha clareza sobre seus ganhos líquidos"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src={medtrackLogo} alt="MedTrack" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-foreground">MedTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button variant="hero" onClick={() => navigate("/cadastro")}>
              Cadastre-se
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light text-primary text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img src={medtrackLogo} alt="" className="w-4 h-4 object-contain" />
              Feito para médicos plantonistas
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Organize sua renda e tenha{" "}
              <span className="gradient-text">previsibilidade financeira</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Múltiplos plantões, valores variáveis, datas diferentes? 
              O MedTrack organiza tudo e te mostra exatamente quanto você vai receber.
            </p>

            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => navigate("/cadastro")}
            >
              Começar grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Benefits Strip */}
      <section className="py-8 bg-primary">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-2 text-primary-foreground"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm md:text-base font-medium">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para{" "}
              <span className="gradient-text">controlar suas finanças</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desenvolvido especialmente para a realidade do médico plantonista
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pronto para organizar sua vida financeira?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Junte-se a milhares de médicos plantonistas que já controlam seus ganhos
            </p>
            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => navigate("/cadastro")}
            >
              Criar conta gratuita
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={medtrackLogo} alt="MedTrack" className="h-8 w-8 object-contain" />
              <span className="font-semibold text-foreground">MedTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 MedTrack. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
