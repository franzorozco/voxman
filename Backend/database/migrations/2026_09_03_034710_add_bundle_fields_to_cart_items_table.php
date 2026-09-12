<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega soporte de conjuntos (bundles) a cart_items:
     *
     * - override_price:   Precio preferencial del conjunto que el cliente paga
     *                     (calculado proporcionalmente al precio total del bundle).
     *                     Si es null, se usa el precio de product_variants.
     *
     * - original_price:   Precio normal del item según product_variants en el momento
     *                     de la compra. Se guarda para referencia histórica y para que
     *                     el dashboard pueda mostrar el ahorro del cliente.
     *
     * - bundle_group_id:  Identificador compartido entre todos los items del mismo
     *                     conjunto en el mismo pedido. Formato: "{bundle_id}_{timestamp}".
     *                     Permite agrupar visualmente los items de un conjunto y
     *                     distinguirlos de ítems individuales en el dashboard.
     */
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            if (!Schema::hasColumn('cart_items', 'override_price')) {
                $table->decimal('override_price', 10, 2)->nullable()->after('quantity');
            }
            if (!Schema::hasColumn('cart_items', 'original_price')) {
                $table->decimal('original_price', 10, 2)->nullable()->after('override_price');
            }
            if (!Schema::hasColumn('cart_items', 'bundle_group_id')) {
                $table->string('bundle_group_id', 191)->nullable()->after('original_price')->index('idx_cart_items_bundle_group');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $toDrop = [];
            if (Schema::hasColumn('cart_items', 'bundle_group_id')) {
                $toDrop[] = 'bundle_group_id';
            }
            if (Schema::hasColumn('cart_items', 'original_price')) {
                $toDrop[] = 'original_price';
            }
            if (Schema::hasColumn('cart_items', 'override_price')) {
                $toDrop[] = 'override_price';
            }
            if (!empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });
    }
};
