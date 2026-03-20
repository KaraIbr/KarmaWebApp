create table public.ventas (
  id serial not null,
  cliente_id integer null,
  usuario_id integer null,
  fecha timestamp with time zone null default now(),
  total numeric(10, 2) not null default 0,
  descuento numeric(10, 2) null default 0,
  constraint ventas_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_ventas_fecha on public.ventas using btree (fecha) TABLESPACE pg_default;

create table public.usuarios (
  id serial not null,
  nombre character varying(50) not null,
  correo character varying(100) not null,
  contraseña text not null,
  role character varying null,
  last_login timestamp with time zone null,
  constraint usuarios_pkey primary key (id),
  constraint usuarios_correo_key unique (correo)
) TABLESPACE pg_default;

create view public.resumen_pagos as
select
  v.id as venta_id,
  v.total as total_venta,
  v.descuento as descuento_venta,
  COALESCE(sum(p.monto), 0::numeric) as total_pagado,
  v.total - COALESCE(sum(p.monto), 0::numeric) as saldo_pendiente,
  case
    when COALESCE(sum(p.monto), 0::numeric) >= v.total then 'PAGADO'::text
    when COALESCE(sum(p.monto), 0::numeric) > 0::numeric then 'PARCIAL'::text
    else 'PENDIENTE'::text
  end as estado_pago
from
  ventas v
  left join pagos p on v.id = p.venta_id
  and p.estado::text = 'confirmado'::text
group by
  v.id,
  v.total,
  v.descuento;

  create table public.productos (
  id serial not null,
  nombre character varying(20) not null,
  stock integer not null,
  precio real not null,
  categoria character varying(10) not null,
  color text not null,
  codigo_barras character varying(100) null,
  sku character varying(100) null,
  constraint productos_pkey primary key (id),
  constraint productos_categoria_check check (
    (
      (categoria)::text = any (
        array[
          ('Hombre'::character varying)::text,
          ('Mujer'::character varying)::text,
          ('Niño'::character varying)::text
        ]
      )
    )
  ),
  constraint productos_nombre_check check (
    (
      (nombre)::text = any (
        array[
          ('Pulsera'::character varying)::text,
          ('Collar'::character varying)::text,
          ('Aretes'::character varying)::text,
          ('Tobillera'::character varying)::text
        ]
      )
    )
  ),
  constraint productos_stock_check check (
    (
      (stock >= 0)
      and (stock <= 100)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_productos_codigo_barras on public.productos using btree (codigo_barras) TABLESPACE pg_default;

create index IF not exists idx_productos_sku on public.productos using btree (sku) TABLESPACE pg_default;

create table public.pagos (
  id serial not null,
  venta_id integer not null,
  metodo_pago character varying(50) not null,
  monto numeric(10, 2) not null,
  fecha timestamp with time zone null default now(),
  referencia character varying(255) null,
  estado character varying(20) null default 'confirmado'::character varying,
  datos_adicionales jsonb null,
  usuario_id integer null,
  constraint pagos_pkey primary key (id),
  constraint fk_venta foreign KEY (venta_id) references ventas (id) on delete CASCADE,
  constraint pagos_usuario_id_fkey foreign KEY (usuario_id) references usuarios (id)
) TABLESPACE pg_default;

create index IF not exists idx_pagos_venta on public.pagos using btree (venta_id) TABLESPACE pg_default;

create index IF not exists idx_pagos_venta_id on public.pagos using btree (venta_id) TABLESPACE pg_default;

create index IF not exists idx_pagos_metodo on public.pagos using btree (metodo_pago) TABLESPACE pg_default;

create index IF not exists idx_pagos_fecha on public.pagos using btree (fecha) TABLESPACE pg_default;

create table public.carrito (
  id serial not null,
  producto_id integer not null,
  cantidad integer not null default 1,
  constraint carrito_pkey primary key (id),
  constraint fk_producto foreign KEY (producto_id) references productos (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_carrito_producto_id on public.carrito using btree (producto_id) TABLESPACE pg_default;