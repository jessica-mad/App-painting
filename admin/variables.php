<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/* ──────────────────────────────────────────────────────────────
   VARIABLES — almacenamiento en wp_options como JSON
   Clave: inkrush_variables
   Estructura: [ { id, category, value, rarity, season }, ... ]
────────────────────────────────────────────────────────────── */

function inkrush_get_variables() {
    return get_option( 'inkrush_variables', [] );
}

function inkrush_save_variables( array $vars ) {
    update_option( 'inkrush_variables', $vars );
}

/* Variables por defecto al activar el plugin */
function inkrush_seed_default_variables() {
    if ( get_option( 'inkrush_variables_seeded' ) ) return;

    $defaults = [
        // Lugares
        ['id'=>inkrush_uid(),'category'=>'Lugares','value'=>'bosque oscuro','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Lugares','value'=>'cafetería pequeña','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Lugares','value'=>'biblioteca infinita','rarity'=>'Raro','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Lugares','value'=>'ciudad cyberpunk','rarity'=>'Épico','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Lugares','value'=>'dimensión surrealista','rarity'=>'Legendario','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Lugares','value'=>'campo de cerezos','rarity'=>'Épico','season'=>'Primavera'],
        ['id'=>inkrush_uid(),'category'=>'Lugares','value'=>'mansión embrujada','rarity'=>'Épico','season'=>'Halloween'],
        ['id'=>inkrush_uid(),'category'=>'Lugares','value'=>'aldea navideña','rarity'=>'Raro','season'=>'Navidad'],
        // Emociones
        ['id'=>inkrush_uid(),'category'=>'Emociones','value'=>'melancolía','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Emociones','value'=>'nostalgia','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Emociones','value'=>'euforia','rarity'=>'Raro','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Emociones','value'=>'caos interno','rarity'=>'Épico','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Emociones','value'=>'dualidad interior','rarity'=>'Legendario','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Emociones','value'=>'amor primaveral','rarity'=>'Raro','season'=>'Primavera'],
        // Personajes
        ['id'=>inkrush_uid(),'category'=>'Personajes','value'=>'bruja','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Personajes','value'=>'detective','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Personajes','value'=>'vampiro elegante','rarity'=>'Raro','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Personajes','value'=>'viajero temporal','rarity'=>'Épico','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Personajes','value'=>'dios antiguo','rarity'=>'Legendario','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Personajes','value'=>'duende navideño','rarity'=>'Raro','season'=>'Navidad'],
        // Animales
        ['id'=>inkrush_uid(),'category'=>'Animales','value'=>'cuervo','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Animales','value'=>'zorro','rarity'=>'Raro','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Animales','value'=>'ciervo espiritual','rarity'=>'Épico','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Animales','value'=>'fénix','rarity'=>'Legendario','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Animales','value'=>'mariposa de cerezo','rarity'=>'Raro','season'=>'Primavera'],
        // Objetos
        ['id'=>inkrush_uid(),'category'=>'Objetos','value'=>'reloj roto','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Objetos','value'=>'espejo infinito','rarity'=>'Raro','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Objetos','value'=>'libro prohibido','rarity'=>'Épico','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Objetos','value'=>'cristal dimensional','rarity'=>'Legendario','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Objetos','value'=>'calabaza tallada','rarity'=>'Raro','season'=>'Halloween'],
        // Acciones
        ['id'=>inkrush_uid(),'category'=>'Acciones','value'=>'escapando','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Acciones','value'=>'flotando','rarity'=>'Raro','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Acciones','value'=>'atravesando dimensiones','rarity'=>'Legendario','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Acciones','value'=>'floreciendo','rarity'=>'Raro','season'=>'Primavera'],
        // Eventos
        ['id'=>inkrush_uid(),'category'=>'Eventos','value'=>'carnaval','rarity'=>'Común','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Eventos','value'=>'eclipse solar','rarity'=>'Raro','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Eventos','value'=>'apertura de portal','rarity'=>'Épico','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Eventos','value'=>'fin del mundo','rarity'=>'Legendario','season'=>''],
        ['id'=>inkrush_uid(),'category'=>'Eventos','value'=>'noche de brujas','rarity'=>'Épico','season'=>'Halloween'],
        ['id'=>inkrush_uid(),'category'=>'Eventos','value'=>'nochebuena mágica','rarity'=>'Épico','season'=>'Navidad'],
    ];

    inkrush_save_variables( $defaults );
    update_option( 'inkrush_variables_seeded', true );
}

function inkrush_uid() {
    return substr( md5( uniqid( rand(), true ) ), 0, 8 );
}

/* ──────────────────────────────────────────────────────────────
   PÁGINA ADMIN DE VARIABLES
────────────────────────────────────────────────────────────── */

function inkrush_page_variables() {
    $vars    = inkrush_get_variables();
    $message = '';

    $categories = ['Lugares','Emociones','Personajes','Objetos','Animales','Acciones','Eventos'];
    $rarities   = ['Común','Raro','Épico','Legendario'];
    $seasons    = ['','Primavera','Verano','Otoño','Invierno','Halloween','Navidad','San Valentín'];

    /* Nombres Musai — la clave BD no cambia, solo la etiqueta visible */
    $rarity_labels = [
        'Común'      => 'Susurro',
        'Raro'       => 'Visión',
        'Épico'      => 'Éxtasis',
        'Legendario' => '✦ Epifanía',
    ];

    /* ── Procesar acciones ── */
    if ( isset( $_POST['inkrush_var_action'] ) && check_admin_referer( 'inkrush_vars' ) ) {
        $action = sanitize_text_field( $_POST['inkrush_var_action'] );

        if ( $action === 'add' ) {
            $new = [
                'id'       => inkrush_uid(),
                'category' => sanitize_text_field( $_POST['var_category'] ),
                'value'    => sanitize_text_field( strtolower( $_POST['var_value'] ) ),
                'value_en' => sanitize_text_field( strtolower( $_POST['var_value_en'] ?? '' ) ),
                'rarity'   => sanitize_text_field( $_POST['var_rarity'] ),
                'season'   => sanitize_text_field( $_POST['var_season'] ),
            ];
            if ( $new['value'] && $new['category'] ) {
                $vars[] = $new;
                inkrush_save_variables( $vars );
                $message = '✅ Variable añadida.';
            }

        } elseif ( $action === 'delete' ) {
            $del_id = sanitize_text_field( $_POST['var_id'] );
            $vars   = array_values( array_filter( $vars, fn( $v ) => $v['id'] !== $del_id ) );
            inkrush_save_variables( $vars );
            $message = '🗑️ Variable eliminada.';

        } elseif ( $action === 'edit' ) {
            $edit_id = sanitize_text_field( $_POST['var_id'] );
            foreach ( $vars as &$v ) {
                if ( $v['id'] === $edit_id ) {
                    $v['category'] = sanitize_text_field( $_POST['var_category'] );
                    $v['value']    = sanitize_text_field( strtolower( $_POST['var_value'] ) );
                    $v['value_en'] = sanitize_text_field( strtolower( $_POST['var_value_en'] ?? '' ) );
                    $v['rarity']   = sanitize_text_field( $_POST['var_rarity'] );
                    $v['season']   = sanitize_text_field( $_POST['var_season'] );
                    break;
                }
            }
            unset( $v );
            inkrush_save_variables( $vars );
            $message = '✏️ Variable actualizada.';

        } elseif ( $action === 'import_json' && ! empty( $_POST['json_data'] ) ) {
            $imported = json_decode( stripslashes( $_POST['json_data'] ), true );
            if ( is_array( $imported ) ) {
                foreach ( $imported as $item ) {
                    $item['id'] = inkrush_uid();
                    $vars[] = [
                        'id'       => $item['id'],
                        'category' => sanitize_text_field( $item['category'] ?? '' ),
                        'value'    => sanitize_text_field( strtolower( $item['value'] ?? '' ) ),
                        'value_en' => sanitize_text_field( strtolower( $item['value_en'] ?? '' ) ),
                        'rarity'   => sanitize_text_field( $item['rarity'] ?? 'Común' ),
                        'season'   => sanitize_text_field( $item['season'] ?? '' ),
                    ];
                }
                inkrush_save_variables( $vars );
                $message = '📥 ' . count( $imported ) . ' variables importadas.';
            } else {
                $message = '❌ JSON inválido.';
            }
        }
    }

    /* ── Filtros de visualización ── */
    $filter_cat    = isset( $_GET['filter_cat'] )    ? sanitize_text_field( $_GET['filter_cat'] )    : '';
    $filter_rarity = isset( $_GET['filter_rarity'] ) ? sanitize_text_field( $_GET['filter_rarity'] ) : '';
    $filter_season = isset( $_GET['filter_season'] ) ? sanitize_text_field( $_GET['filter_season'] ) : '';

    $visible = array_filter( $vars, function( $v ) use ( $filter_cat, $filter_rarity, $filter_season ) {
        if ( $filter_cat    && $v['category'] !== $filter_cat )    return false;
        if ( $filter_rarity && $v['rarity']   !== $filter_rarity ) return false;
        if ( $filter_season !== '' ) {
            if ( $filter_season === '__none__' && $v['season'] !== '' ) return false;
            if ( $filter_season !== '__none__' && $v['season'] !== $filter_season ) return false;
        }
        return true;
    } );

    /* ── Colores de rareza ── */
    $rarity_colors = [
        'Común'     => '#E8E8E8',
        'Raro'      => '#C8F0FF',
        'Épico'     => '#EFE8FF',
        'Legendario'=> '#FFE066',
    ];

    /* Cuento por rareza */
    $counts = array_count_values( array_column( $vars, 'rarity' ) );

    /* ── Edición inline ── */
    $editing_id = isset( $_GET['edit_id'] ) ? sanitize_text_field( $_GET['edit_id'] ) : '';
    $editing    = null;
    foreach ( $vars as $v ) {
        if ( $v['id'] === $editing_id ) { $editing = $v; break; }
    }
    ?>
    <div class="wrap">
        <h1>🎨 Musai — Variables de dibujo</h1>

        <?php if ( $message ) : ?>
            <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $message ); ?></p></div>
        <?php endif; ?>

        <?php
        $missing_en = count( array_filter( $vars, fn( $v ) => empty( $v['value_en'] ) ) );
        ?>
        <!-- Estadísticas rápidas -->
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin:16px 0;align-items:center;">
            <div style="background:#DFFF23;border:2px solid #111;border-radius:10px;padding:12px 20px;font-weight:900;">
                Total: <?php echo count( $vars ); ?>
            </div>
            <?php foreach ( $rarities as $r ) : ?>
                <div style="background:<?php echo esc_attr( $rarity_colors[ $r ] ); ?>;border:2px solid #111;border-radius:10px;padding:12px 16px;font-weight:900;">
                    <?php echo esc_html( $rarity_labels[ $r ] ?? $r ); ?>: <?php echo intval( $counts[ $r ] ?? 0 ); ?>
                </div>
            <?php endforeach; ?>
            <div style="background:<?php echo $missing_en > 0 ? '#FFE8A0' : '#D4F5D4'; ?>;border:2px solid #111;border-radius:10px;padding:12px 16px;font-weight:900;">
                🇬🇧 Sin EN: <?php echo $missing_en; ?>
            </div>
            <?php if ( $missing_en > 0 ) : ?>
                <button id="inkrush-auto-translate" type="button"
                    style="background:#111;color:#DFFF23;border:2px solid #111;border-radius:10px;padding:12px 18px;font-weight:900;cursor:pointer;">
                    🌐 Auto-traducir todo al inglés (<?php echo $missing_en; ?>)
                </button>
                <span id="inkrush-translate-status" style="font-weight:700;font-size:13px;color:#555;display:none;"></span>
            <?php endif; ?>
        </div>
        <script>
        (function() {
            var btn = document.getElementById('inkrush-auto-translate');
            if (!btn) return;
            btn.addEventListener('click', function() {
                btn.disabled = true;
                btn.textContent = '⏳ Traduciendo...';
                var status = document.getElementById('inkrush-translate-status');
                if (status) { status.style.display = 'inline'; status.textContent = 'Contactando con la IA...'; }
                fetch('<?php echo esc_url( rest_url( 'inkrush/v1/parameters/translate-missing' ) ); ?>', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': '<?php echo wp_create_nonce( 'wp_rest' ); ?>',
                    },
                    body: JSON.stringify({}),
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.translated !== undefined) {
                        if (status) status.textContent = '✅ ' + data.translated + ' variable(s) traducidas. Recargando...';
                        setTimeout(function() { location.reload(); }, 1500);
                    } else {
                        btn.disabled = false;
                        btn.textContent = '🌐 Auto-traducir todo al inglés';
                        if (status) status.textContent = '❌ Error: ' + (data.message || JSON.stringify(data));
                    }
                })
                .catch(function(e) {
                    btn.disabled = false;
                    btn.textContent = '🌐 Auto-traducir todo al inglés';
                    if (status) status.textContent = '❌ Error de red: ' + e.message;
                });
            });
        })();
        </script>

        <!-- ── Formulario añadir / editar ── -->
        <div style="background:#f9f9f9;border:2px solid #111;border-radius:12px;padding:20px;max-width:700px;margin-bottom:24px;">
            <h3 style="margin-top:0;"><?php echo $editing ? '✏️ Editar variable' : '➕ Nueva variable'; ?></h3>
            <form method="post">
                <?php wp_nonce_field( 'inkrush_vars' ); ?>
                <input type="hidden" name="inkrush_var_action" value="<?php echo $editing ? 'edit' : 'add'; ?>">
                <?php if ( $editing ) : ?>
                    <input type="hidden" name="var_id" value="<?php echo esc_attr( $editing['id'] ); ?>">
                <?php endif; ?>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div>
                        <label style="font-weight:700;display:block;margin-bottom:4px;">Parámetro / Categoría</label>
                        <select name="var_category" required style="width:100%;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 8px;">
                            <option value="">— Elegir —</option>
                            <?php foreach ( $categories as $c ) : ?>
                                <option value="<?php echo esc_attr( $c ); ?>" <?php selected( $editing['category'] ?? '', $c ); ?>>
                                    <?php echo esc_html( $c ); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label style="font-weight:700;display:block;margin-bottom:4px;">Rareza</label>
                        <select name="var_rarity" style="width:100%;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 8px;">
                            <?php foreach ( $rarities as $r ) : ?>
                                <option value="<?php echo esc_attr( $r ); ?>" <?php selected( $editing['rarity'] ?? 'Común', $r ); ?>
                                    style="background:<?php echo esc_attr( $rarity_colors[ $r ] ); ?>">
                                    <?php echo esc_html( $rarity_labels[ $r ] ?? $r ); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label style="font-weight:700;display:block;margin-bottom:4px;">🇪🇸 Valor (Español)</label>
                        <input type="text" name="var_value" required placeholder="ej: bosque encantado"
                            value="<?php echo esc_attr( $editing['value'] ?? '' ); ?>"
                            style="width:100%;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 10px;">
                    </div>
                    <div>
                        <label style="font-weight:700;display:block;margin-bottom:4px;">🇬🇧 Valor (English)</label>
                        <input type="text" name="var_value_en" placeholder="e.g. enchanted forest"
                            value="<?php echo esc_attr( $editing['value_en'] ?? '' ); ?>"
                            style="width:100%;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 10px;">
                    </div>
                    <div>
                        <label style="font-weight:700;display:block;margin-bottom:4px;">Temporada / Evento (opcional)</label>
                        <select name="var_season" style="width:100%;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 8px;">
                            <?php foreach ( $seasons as $s ) : ?>
                                <option value="<?php echo esc_attr( $s ); ?>" <?php selected( $editing['season'] ?? '', $s ); ?>>
                                    <?php echo $s ? esc_html( $s ) : '— Sin temporada —'; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div style="margin-top:16px;display:flex;gap:8px;">
                    <input type="submit" class="button button-primary" value="<?php echo $editing ? 'Guardar cambios' : 'Añadir variable'; ?>"
                        style="background:#DFFF23;border-color:#111;color:#111;font-weight:900;">
                    <?php if ( $editing ) : ?>
                        <a href="<?php echo esc_url( admin_url( 'admin.php?page=inkrush-variables' ) ); ?>" class="button">Cancelar</a>
                    <?php endif; ?>
                </div>
            </form>
        </div>

        <!-- ── Filtros ── -->
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;align-items:flex-end;">
            <form method="get" style="display:contents;">
                <input type="hidden" name="page" value="inkrush-variables">
                <div>
                    <label style="font-weight:700;display:block;font-size:12px;">Parámetro</label>
                    <select name="filter_cat" onchange="this.form.submit()" style="height:32px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 8px;">
                        <option value="">Todos</option>
                        <?php foreach ( $categories as $c ) : ?>
                            <option value="<?php echo esc_attr( $c ); ?>" <?php selected( $filter_cat, $c ); ?>><?php echo esc_html( $c ); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label style="font-weight:700;display:block;font-size:12px;">Rareza</label>
                    <select name="filter_rarity" onchange="this.form.submit()" style="height:32px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 8px;">
                        <option value="">Todas</option>
                        <?php foreach ( $rarities as $r ) : ?>
                            <option value="<?php echo esc_attr( $r ); ?>" <?php selected( $filter_rarity, $r ); ?>><?php echo esc_html( $rarity_labels[ $r ] ?? $r ); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label style="font-weight:700;display:block;font-size:12px;">Temporada</label>
                    <select name="filter_season" onchange="this.form.submit()" style="height:32px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 8px;">
                        <option value="">Todas</option>
                        <option value="__none__" <?php selected( $filter_season, '__none__' ); ?>>Sin temporada</option>
                        <?php foreach ( array_slice( $seasons, 1 ) as $s ) : ?>
                            <option value="<?php echo esc_attr( $s ); ?>" <?php selected( $filter_season, $s ); ?>><?php echo esc_html( $s ); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <?php if ( $filter_cat || $filter_rarity || $filter_season ) : ?>
                    <a href="<?php echo esc_url( admin_url( 'admin.php?page=inkrush-variables' ) ); ?>" class="button">Limpiar filtros</a>
                <?php endif; ?>
            </form>
            <span style="margin-left:auto;font-weight:700;color:#666;"><?php echo count( $visible ); ?> resultado(s)</span>
        </div>

        <!-- ── Tabla de variables ── -->
        <table class="wp-list-table widefat fixed striped" style="border:2px solid #111;">
            <thead>
                <tr>
                    <th style="width:120px;font-weight:900;">Parámetro</th>
                    <th style="font-weight:900;">🇪🇸 Español</th>
                    <th style="font-weight:900;">🇬🇧 English</th>
                    <th style="width:100px;font-weight:900;">Rareza</th>
                    <th style="width:100px;font-weight:900;">Temporada</th>
                    <th style="width:160px;font-weight:900;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ( $visible as $v ) :
                    $bg     = $rarity_colors[ $v['rarity'] ] ?? '#fff';
                    $has_en = ! empty( $v['value_en'] );
                ?>
                <tr style="background:<?php echo esc_attr( $bg ); ?>20;">
                    <td style="font-weight:700;"><?php echo esc_html( $v['category'] ); ?></td>
                    <td style="font-weight:600;text-transform:capitalize;"><?php echo esc_html( $v['value'] ); ?></td>
                    <td style="font-weight:600;text-transform:capitalize;">
                        <?php if ( $has_en ) : ?>
                            <?php echo esc_html( $v['value_en'] ); ?>
                        <?php else : ?>
                            <span style="color:#bbb;font-style:italic;font-size:12px;">sin traducción</span>
                            <button type="button"
                                class="button button-small inkrush-translate-row"
                                data-id="<?php echo esc_attr( $v['id'] ); ?>"
                                style="margin-left:6px;font-size:11px;">
                                🌐
                            </button>
                        <?php endif; ?>
                    </td>
                    <td>
                        <span style="background:<?php echo esc_attr( $bg ); ?>;border:2px solid #111;border-radius:20px;padding:2px 10px;font-weight:900;font-size:12px;">
                            <?php echo esc_html( $v['rarity'] ); ?>
                        </span>
                    </td>
                    <td style="font-size:12px;font-weight:600;color:#666;">
                        <?php echo $v['season'] ? esc_html( '🌿 ' . $v['season'] ) : '—'; ?>
                    </td>
                    <td>
                        <a href="<?php echo esc_url( admin_url( 'admin.php?page=inkrush-variables&edit_id=' . $v['id'] ) ); ?>"
                            class="button button-small" style="margin-right:4px;">✏️ Editar</a>
                        <form method="post" style="display:inline;" onsubmit="return confirm('¿Eliminar esta variable?');">
                            <?php wp_nonce_field( 'inkrush_vars' ); ?>
                            <input type="hidden" name="inkrush_var_action" value="delete">
                            <input type="hidden" name="var_id" value="<?php echo esc_attr( $v['id'] ); ?>">
                            <input type="submit" class="button button-small" value="🗑️" style="color:red;">
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if ( empty( $visible ) ) : ?>
                    <tr><td colspan="6" style="text-align:center;padding:24px;color:#888;font-weight:700;">No hay variables con estos filtros.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
        <script>
        (function() {
            document.querySelectorAll('.inkrush-translate-row').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id   = btn.getAttribute('data-id');
                    var cell = btn.closest('td');
                    btn.disabled = true;
                    btn.textContent = '⏳';
                    fetch('<?php echo esc_url( rest_url( 'inkrush/v1/parameters/' ) ); ?>' + id + '/translate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': '<?php echo wp_create_nonce( 'wp_rest' ); ?>',
                        },
                        body: JSON.stringify({}),
                    })
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        if (data.value_en) {
                            cell.innerHTML = '<span style="font-weight:600;text-transform:capitalize;">' + data.value_en + '</span>';
                        } else {
                            btn.disabled = false;
                            btn.textContent = '🌐';
                            alert('Error: ' + (data.message || JSON.stringify(data)));
                        }
                    })
                    .catch(function(e) {
                        btn.disabled = false;
                        btn.textContent = '🌐';
                        alert('Error de red: ' + e.message);
                    });
                });
            });
        })();
        </script>

        <!-- ── Importar JSON ── -->
        <details style="margin-top:24px;border:2px solid #111;border-radius:12px;padding:16px;max-width:700px;">
            <summary style="font-weight:900;cursor:pointer;">📥 Importar variables en bloque (JSON)</summary>
            <p style="font-size:13px;color:#666;margin:8px 0;">Pega un array JSON con campos: category, value, rarity, season</p>
            <form method="post">
                <?php wp_nonce_field( 'inkrush_vars' ); ?>
                <input type="hidden" name="inkrush_var_action" value="import_json">
                <textarea name="json_data" rows="6" placeholder='[{"category":"Lugares","value":"lago misterioso","rarity":"Raro","season":""}]'
                    style="width:100%;border:2px solid #111;border-radius:8px;padding:8px;font-family:monospace;font-size:13px;"></textarea>
                <input type="submit" class="button button-primary" value="Importar" style="margin-top:8px;">
            </form>
        </details>

        <!-- ── Exportar JSON ── -->
        <details style="margin-top:12px;border:2px solid #111;border-radius:12px;padding:16px;max-width:700px;">
            <summary style="font-weight:900;cursor:pointer;">📤 Exportar todas las variables (JSON)</summary>
            <textarea rows="8" readonly style="width:100%;border:2px solid #111;border-radius:8px;padding:8px;font-family:monospace;font-size:12px;margin-top:8px;"
                onclick="this.select()"><?php echo esc_textarea( json_encode( $vars, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) ); ?></textarea>
        </details>
    </div>
    <?php
}
