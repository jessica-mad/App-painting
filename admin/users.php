<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/* ──────────────────────────────────────────────────────────────
   PROGRESIÓN DE USUARIOS
   User meta usada:
     inkrush_challenges_completed  (int)
     inkrush_inspires_received     (int)
     inkrush_streak                (int)
     inkrush_level                 (int 1-5)
────────────────────────────────────────────────────────────── */

/* Obtener configuración de niveles (editable desde admin settings) */
function inkrush_get_level_config() {
    return get_option( 'inkrush_level_config', [
        1 => [ 'name' => 'Nuevo Artista',     'min_challenges' => 0,  'min_inspires' => 0,  'color' => '#E8E8E8', 'emoji' => '🌱' ],
        2 => [ 'name' => 'Artista Activo',    'min_challenges' => 5,  'min_inspires' => 0,  'color' => '#C8F0FF', 'emoji' => '🎨' ],
        3 => [ 'name' => 'Creador Constante', 'min_challenges' => 10, 'min_inspires' => 0,  'color' => '#EFE8FF', 'emoji' => '⭐' ],
        4 => [ 'name' => 'Inspirador',        'min_challenges' => 20, 'min_inspires' => 25, 'color' => '#FFE066', 'emoji' => '✨' ],
        5 => [ 'name' => 'Maestro del Reto',  'min_challenges' => 30, 'min_inspires' => 0,  'color' => '#FF9966', 'emoji' => '🏆' ],
    ] );
}

/* Calcular nivel actual de un usuario */
function inkrush_calculate_level( $user_id ) {
    $challenges = (int) get_user_meta( $user_id, 'inkrush_challenges_completed', true );
    $inspires   = (int) get_user_meta( $user_id, 'inkrush_inspires_received', true );
    $config     = inkrush_get_level_config();

    $level = 1;
    foreach ( $config as $lvl => $cfg ) {
        if ( $challenges >= $cfg['min_challenges'] && $inspires >= $cfg['min_inspires'] ) {
            $level = $lvl;
        }
    }
    return $level;
}

/* Actualizar nivel de un usuario (llamar tras completar reto, recibir inspiración, etc.) */
function inkrush_update_user_level( $user_id ) {
    $new_level = inkrush_calculate_level( $user_id );
    $old_level = (int) get_user_meta( $user_id, 'inkrush_level', true );

    if ( $new_level !== $old_level ) {
        update_user_meta( $user_id, 'inkrush_level', $new_level );
        do_action( 'inkrush_level_up', $user_id, $old_level, $new_level );
    }

    return $new_level;
}

/* ──────────────────────────────────────────────────────────────
   PÁGINA ADMIN DE USUARIOS
────────────────────────────────────────────────────────────── */

function inkrush_page_users() {
    /* Reset intentos diarios de un usuario */
    if ( isset( $_POST['inkrush_reset_rolls'] ) ) {
        $uid = (int) $_POST['reset_rolls_uid'];
        if ( check_admin_referer( 'inkrush_reset_rolls_' . $uid ) ) {
            $key = 'inkrush_daily_rolls_' . date('Y-m-d');
            delete_user_meta( $uid, $key );
            $message = '🎲 Intentos diarios reseteados para el usuario #' . $uid . '.';
        }
    }

    $message    = isset( $message ) ? $message : '';
    $level_config = inkrush_get_level_config();

    /* Guardar configuración de niveles */
    if ( isset( $_POST['inkrush_save_levels'] ) && check_admin_referer( 'inkrush_levels' ) ) {
        $new_config = [];
        for ( $i = 1; $i <= 5; $i++ ) {
            $new_config[ $i ] = [
                'name'           => sanitize_text_field( $_POST["lvl_{$i}_name"] ),
                'min_challenges' => (int) $_POST["lvl_{$i}_challenges"],
                'min_inspires'   => (int) $_POST["lvl_{$i}_inspires"],
                'color'          => sanitize_hex_color( $_POST["lvl_{$i}_color"] ),
                'emoji'          => sanitize_text_field( $_POST["lvl_{$i}_emoji"] ),
            ];
        }
        update_option( 'inkrush_level_config', $new_config );
        $level_config = $new_config;
        $message = '✅ Configuración de niveles guardada.';
    }

    /* Editar datos de usuario individual */
    if ( isset( $_POST['inkrush_edit_user'] ) && check_admin_referer( 'inkrush_edit_user' ) ) {
        $uid = (int) $_POST['edit_user_id'];
        update_user_meta( $uid, 'inkrush_challenges_completed', (int) $_POST['challenges'] );
        update_user_meta( $uid, 'inkrush_inspires_received',    (int) $_POST['inspires'] );
        update_user_meta( $uid, 'inkrush_streak',               (int) $_POST['streak'] );
        inkrush_update_user_level( $uid );
        $message = '✅ Usuario actualizado y nivel recalculado.';
    }

    /* Recalcular todos los niveles */
    if ( isset( $_POST['inkrush_recalc_all'] ) && check_admin_referer( 'inkrush_recalc' ) ) {
        $users = get_users( [ 'role' => 'ilustrador', 'fields' => 'ID' ] );
        foreach ( $users as $uid ) inkrush_update_user_level( $uid );
        $message = '🔄 Niveles recalculados para ' . count( $users ) . ' usuarios.';
    }

    /* Lista de ilustradores */
    $ilustradores = get_users( [ 'role' => 'ilustrador', 'number' => 50 ] );
    ?>
    <div class="wrap">
        <h1>👥 InkRush — Usuarios y Progresión</h1>

        <?php if ( $message ) : ?>
            <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $message ); ?></p></div>
        <?php endif; ?>

        <!-- ── Configuración de niveles ── -->
        <div style="border:2px solid #111;border-radius:12px;padding:20px;margin-bottom:24px;background:#FFFDF3;">
            <h2 style="margin-top:0;">⚙️ Configuración de niveles</h2>
            <p style="color:#666;font-size:13px;">Define qué requisitos necesita un usuario para avanzar de nivel. Los niveles se recalculan automáticamente cuando un usuario completa un reto.</p>
            <form method="post">
                <?php wp_nonce_field( 'inkrush_levels' ); ?>
                <table class="wp-list-table widefat" style="border:2px solid #111;">
                    <thead>
                        <tr>
                            <th style="width:50px;">Nivel</th>
                            <th>Nombre</th>
                            <th style="width:60px;">Emoji</th>
                            <th>Retos mín.</th>
                            <th>Inspiraciones mín.</th>
                            <th style="width:100px;">Color</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $level_config as $lvl => $cfg ) : ?>
                        <tr style="background:<?php echo esc_attr( $cfg['color'] ); ?>30;">
                            <td style="font-weight:900;font-size:18px;"><?php echo intval( $lvl ); ?></td>
                            <td>
                                <input type="text" name="lvl_<?php echo $lvl; ?>_name"
                                    value="<?php echo esc_attr( $cfg['name'] ); ?>"
                                    style="width:100%;border:2px solid #111;border-radius:6px;padding:4px 8px;font-weight:700;">
                            </td>
                            <td>
                                <input type="text" name="lvl_<?php echo $lvl; ?>_emoji"
                                    value="<?php echo esc_attr( $cfg['emoji'] ); ?>"
                                    style="width:50px;border:2px solid #111;border-radius:6px;padding:4px;text-align:center;font-size:18px;">
                            </td>
                            <td>
                                <input type="number" name="lvl_<?php echo $lvl; ?>_challenges" min="0"
                                    value="<?php echo intval( $cfg['min_challenges'] ); ?>"
                                    style="width:70px;border:2px solid #111;border-radius:6px;padding:4px 8px;font-weight:700;">
                                <span style="font-size:12px;color:#666;">retos</span>
                            </td>
                            <td>
                                <input type="number" name="lvl_<?php echo $lvl; ?>_inspires" min="0"
                                    value="<?php echo intval( $cfg['min_inspires'] ); ?>"
                                    style="width:70px;border:2px solid #111;border-radius:6px;padding:4px 8px;font-weight:700;">
                                <span style="font-size:12px;color:#666;">✨</span>
                            </td>
                            <td>
                                <input type="color" name="lvl_<?php echo $lvl; ?>_color"
                                    value="<?php echo esc_attr( $cfg['color'] ); ?>"
                                    style="width:60px;height:36px;border:2px solid #111;border-radius:6px;cursor:pointer;">
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <div style="margin-top:12px;display:flex;gap:12px;align-items:center;">
                    <input type="submit" name="inkrush_save_levels" class="button button-primary"
                        value="💾 Guardar configuración de niveles"
                        style="background:#DFFF23;border-color:#111;color:#111;font-weight:900;">
                </div>
            </form>

            <!-- Recalcular todos -->
            <form method="post" style="margin-top:12px;">
                <?php wp_nonce_field( 'inkrush_recalc' ); ?>
                <input type="submit" name="inkrush_recalc_all" class="button"
                    value="🔄 Recalcular niveles de todos los usuarios"
                    onclick="return confirm('¿Recalcular niveles de todos los ilustradores?');">
                <span style="font-size:12px;color:#666;margin-left:8px;">Útil después de cambiar los umbrales de nivel.</span>
            </form>
        </div>

        <!-- ── Lista de usuarios ── -->
        <h2>📋 Ilustradores registrados (<?php echo count( $ilustradores ); ?>)</h2>
        <table class="wp-list-table widefat fixed striped" style="border:2px solid #111;">
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th style="width:100px;">Nivel</th>
                    <th style="width:90px;">Retos</th>
                    <th style="width:100px;">Inspiraciones</th>
                    <th style="width:80px;">Racha</th>
                    <th style="width:130px;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php if ( empty( $ilustradores ) ) : ?>
                    <tr><td colspan="6" style="text-align:center;padding:24px;color:#888;">Aún no hay ilustradores registrados.</td></tr>
                <?php endif; ?>
                <?php foreach ( $ilustradores as $user ) :
                    $challenges = (int) get_user_meta( $user->ID, 'inkrush_challenges_completed', true );
                    $inspires   = (int) get_user_meta( $user->ID, 'inkrush_inspires_received', true );
                    $streak     = (int) get_user_meta( $user->ID, 'inkrush_streak', true );
                    $lvl        = (int) get_user_meta( $user->ID, 'inkrush_level', true ) ?: 1;
                    $lvl_cfg    = $level_config[ $lvl ] ?? $level_config[1];
                    $is_editing = ( isset( $_GET['edit_user'] ) && (int) $_GET['edit_user'] === $user->ID );
                ?>
                <tr>
                    <td>
                        <strong><?php echo esc_html( $user->display_name ); ?></strong><br>
                        <span style="font-size:12px;color:#888;"><?php echo esc_html( $user->user_email ); ?></span>
                    </td>
                    <td>
                        <span style="background:<?php echo esc_attr( $lvl_cfg['color'] ); ?>;border:2px solid #111;border-radius:20px;padding:2px 10px;font-weight:900;font-size:12px;white-space:nowrap;">
                            <?php echo esc_html( $lvl_cfg['emoji'] . ' ' . $lvl_cfg['name'] ); ?>
                        </span>
                    </td>
                    <td style="text-align:center;font-weight:900;"><?php echo $challenges; ?></td>
                    <td style="text-align:center;font-weight:900;"><?php echo $inspires; ?> ✨</td>
                    <td style="text-align:center;font-weight:900;"><?php echo $streak; ?> 🔥</td>
                    <td>
                        <a href="<?php echo esc_url( admin_url( 'admin.php?page=inkrush-users&edit_user=' . $user->ID ) ); ?>"
                            class="button button-small">✏️ Editar</a>
                        <form method="post" style="display:inline;margin-left:4px;">
                            <?php wp_nonce_field( 'inkrush_reset_rolls_' . $user->ID ); ?>
                            <input type="hidden" name="reset_rolls_uid" value="<?php echo $user->ID; ?>">
                            <button type="submit" name="inkrush_reset_rolls" class="button button-small"
                                style="background:#DFFF23;border-color:#111;font-weight:900;"
                                onclick="return confirm('¿Resetear intentos diarios de <?php echo esc_js($user->display_name); ?>?');">
                                🎲 Reset intentos
                            </button>
                        </form>
                    </td>
                </tr>
                <?php if ( $is_editing ) : ?>
                <tr style="background:#FFFDF3;">
                    <td colspan="6">
                        <form method="post" style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap;padding:12px 0;">
                            <?php wp_nonce_field( 'inkrush_edit_user' ); ?>
                            <input type="hidden" name="edit_user_id" value="<?php echo $user->ID; ?>">
                            <div>
                                <label style="font-weight:700;display:block;font-size:12px;">Retos completados</label>
                                <input type="number" name="challenges" min="0" value="<?php echo $challenges; ?>"
                                    style="width:80px;border:2px solid #111;border-radius:8px;padding:4px 8px;font-weight:700;">
                            </div>
                            <div>
                                <label style="font-weight:700;display:block;font-size:12px;">Inspiraciones recibidas</label>
                                <input type="number" name="inspires" min="0" value="<?php echo $inspires; ?>"
                                    style="width:80px;border:2px solid #111;border-radius:8px;padding:4px 8px;font-weight:700;">
                            </div>
                            <div>
                                <label style="font-weight:700;display:block;font-size:12px;">Racha (días)</label>
                                <input type="number" name="streak" min="0" value="<?php echo $streak; ?>"
                                    style="width:70px;border:2px solid #111;border-radius:8px;padding:4px 8px;font-weight:700;">
                            </div>
                            <div>
                                <label style="font-size:12px;display:block;color:#888;">Nivel calculado automáticamente al guardar</label>
                                <input type="submit" name="inkrush_edit_user" class="button button-primary"
                                    value="💾 Guardar y recalcular nivel"
                                    style="background:#DFFF23;border-color:#111;color:#111;font-weight:900;">
                            </div>
                            <a href="<?php echo esc_url( admin_url( 'admin.php?page=inkrush-users' ) ); ?>" class="button">Cancelar</a>
                        </form>
                    </td>
                </tr>
                <?php endif; ?>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php
}
