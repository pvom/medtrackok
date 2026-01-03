import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import medtrackLogo from "@/assets/medtrack-logo.png";
import { useAuth } from "@/hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    password: "",
    acceptTerms: false,
    acceptPrivacy: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.whatsapp || !formData.password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      toast.error("Por favor, aceite os termos de uso e política de privacidade");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, formData.name);

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          toast.error("Este email já está cadastrado. Faça login.");
        } else if (error.message.includes("Password")) {
          toast.error("A senha deve ter pelo menos 6 caracteres");
        } else {
          toast.error("Erro ao criar conta: " + error.message);
        }
        return;
      }

      // Salvar whatsapp temporariamente para uso posterior
      localStorage.setItem("plantonmed_temp_phone", formData.whatsapp);
      
      toast.success("Cadastro realizado com sucesso!");
      navigate("/onboarding/perfil");
    } catch (err) {
      toast.error("Erro inesperado ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const formatWhatsapp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value.slice(0, 15);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <img src={medtrackLogo} alt="MedTrack" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold">MedTrack</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            Organize sua vida financeira como plantonista
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Controle múltiplas fontes de renda, tenha previsibilidade e tome decisões financeiras mais inteligentes.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col">
        <header className="p-6 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="lg:hidden flex items-center gap-2">
            <img src={medtrackLogo} alt="MedTrack" className="h-8 w-8 object-contain" />
            <span className="font-semibold">MedTrack</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Crie sua conta</h2>
              <p className="text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/auth" className="text-primary hover:underline font-medium">
                  Fazer login
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsapp(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha forte"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground font-normal cursor-pointer">
                    Li e aceito os{" "}
                    <a href="#" className="text-primary hover:underline">Termos de Uso</a>
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="privacy"
                    checked={formData.acceptPrivacy}
                    onCheckedChange={(checked) => setFormData({ ...formData, acceptPrivacy: checked as boolean })}
                    className="mt-0.5"
                  />
                  <Label htmlFor="privacy" className="text-sm text-muted-foreground font-normal cursor-pointer">
                    Estou ciente da{" "}
                    <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={!formData.acceptTerms || !formData.acceptPrivacy || isLoading}
              >
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
