-- Create enums for shift and profile types
CREATE TYPE public.activity_type AS ENUM ('exclusivista', 'outras_atividades_medicas', 'fora_medicina');
CREATE TYPE public.income_stability AS ENUM ('estavel', 'variavel');
CREATE TYPE public.shift_type AS ENUM ('fixed', 'sporadic', 'hybrid');
CREATE TYPE public.payment_method AS ENUM ('cooperativa', 'rpa', 'pj', 'clt');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  activity_type public.activity_type,
  other_medical_activities TEXT[],
  income_stability public.income_stability,
  financial_priorities TEXT[],
  current_control_method TEXT,
  tax_knowledge TEXT,
  monthly_income_goal NUMERIC,
  help_needs TEXT[],
  shift_routine_type public.shift_type,
  profile_onboarding_completed BOOLEAN DEFAULT false,
  shift_onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shifts table
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_type public.shift_type NOT NULL,
  hospital TEXT NOT NULL,
  sector TEXT,
  duration_hours NUMERIC,
  recurrence_pattern TEXT,
  days_of_week TEXT[],
  start_time TIME,
  end_time TIME,
  payment_method public.payment_method,
  cooperative_name TEXT,
  work_period_closing TEXT,
  payment_delay_days INTEGER,
  payment_period TEXT,
  gross_value NUMERIC,
  net_value NUMERIC,
  discount_percentage NUMERIC,
  payment_timing TEXT,
  average_monthly_count INTEGER,
  shift_date DATE,
  is_realized BOOLEAN DEFAULT false,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Shifts RLS policies
CREATE POLICY "Users can view their own shifts"
  ON public.shifts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shifts"
  ON public.shifts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shifts"
  ON public.shifts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shifts"
  ON public.shifts FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();