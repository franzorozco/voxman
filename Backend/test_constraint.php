var_dump(DB::select("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'chk_delivery_code_required'"));
