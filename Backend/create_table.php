<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    DB::statement('
        CREATE TABLE IF NOT EXISTS public.pos_customer_profiles (
            id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
            customer_id uuid NOT NULL,
            first_name character varying(100) NOT NULL,
            last_name_paternal character varying(100),
            last_name_maternal character varying(100),
            phone character varying(20),
            created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp without time zone,
            deleted_at timestamp without time zone,
            CONSTRAINT pos_customer_profiles_pkey PRIMARY KEY (id),
            CONSTRAINT pos_customer_profiles_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
        );
    ');
    echo "TABLE CREATED\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
