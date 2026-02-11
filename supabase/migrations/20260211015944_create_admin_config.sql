-- Create admin_config table
CREATE TABLE IF NOT EXISTS public.admin_config (
    id BIGINT PRIMARY KEY DEFAULT 1,
    api_url TEXT NOT NULL DEFAULT 'https://agenciapopular.com/api/v2', -- Renamed from provider_url to match frontend
    api_key TEXT,
    margin_percent NUMERIC DEFAULT 200, -- Renamed from profit_margin to match frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT admin_config_id_check CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow full access to authenticated users" ON public.admin_config
FOR ALL USING (auth.role() = 'authenticated');

-- Insert default config
INSERT INTO public.admin_config (id, api_url, margin_percent)
VALUES (1, 'https://agenciapopular.com/api/v2', 200)
ON CONFLICT (id) DO NOTHING;
