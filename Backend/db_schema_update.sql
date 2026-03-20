-- Add cliente_id column to carrito table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'carrito' 
        AND column_name = 'cliente_id'
    ) THEN
        ALTER TABLE public.carrito 
        ADD COLUMN cliente_id INTEGER NULL,
        ADD CONSTRAINT fk_cliente 
        FOREIGN KEY (cliente_id) 
        REFERENCES public.usuarios(id) 
        ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_carrito_cliente_id 
        ON public.carrito USING btree (cliente_id);
    END IF;
END $$;