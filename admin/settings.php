<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function inkrush_page_settings() {
    $message = '';

    if ( isset( $_POST['inkrush_save_settings'] ) && check_admin_referer( 'inkrush_settings' ) ) {
        update_option( 'inkrush_active_season',    sanitize_text_field( $_POST['active_season'] ) );
        update_option( 'inkrush_rolls_per_day',    (int) $_POST['rolls_per_day'] );
        update_option( 'inkrush_max_params',       (int) $_POST['max_params'] );
        $message = '✅ Configuración guardada.';
    }

    $seasons   = [ '', 'Primavera', 'Verano', 'Otoño', 'Invierno', 'Halloween', 'Navidad', 'San Valentín' ];
    $cur_season = get_option( 'inkrush_active_season', '' );
    $rolls      = get_option( 'inkrush_rolls_per_day', 3 );
    $max_params = get_option( 'inkrush_max_params', 3 );
    $page_id    = get_option( 'inkrush_page_id' );
    $page_url   = $page_id ? get_permalink( $page_id ) : '';
    ?>
    <div class="wrap">
        <h1>⚙️ InkRush — Configuración general</h1>

        <?php if ( $message ) : ?>
            <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $message ); ?></p></div>
        <?php endif; ?>

        <!-- URL de la app -->
        <div style="background:#DFFF23;border:3px solid #111;border-radius:12px;padding:16px 20px;margin:20px 0;max-width:600px;">
            <strong>🔗 URL de la app InkRush:</strong><br>
            <?php if ( $page_url ) : ?>
                <a href="<?php echo esc_url( $page_url ); ?>" target="_blank" style="font-weight:700;">
                    <?php echo esc_url( $page_url ); ?>
                </a><br>
                <small>Shortcode disponible: <code>[inkrush_app]</code> — pégalo en cualquier página.</small>
            <?php else : ?>
                <span style="color:red;font-weight:700;">La página no se creó automáticamente.</span><br>
                <small>Crea una página nueva en WordPress y añade el shortcode <code>[inkrush_app]</code> en el contenido.</small>
            <?php endif; ?>
        </div>

        <form method="post" style="max-width:600px;">
            <?php wp_nonce_field( 'inkrush_settings' ); ?>
            <table class="form-table">
                <tr>
                    <th><label for="active_season">🌿 Temporada / Evento activo</label></th>
                    <td>
                        <select name="active_season" id="active_season"
                            style="height:36px;border:2px solid #111;border-radius:8px;font-weight:700;min-width:200px;padding:0 10px;">
                            <?php foreach ( $seasons as $s ) : ?>
                                <option value="<?php echo esc_attr( $s ); ?>" <?php selected( $cur_season, $s ); ?>>
                                    <?php echo $s ?: '— Sin temporada especial —'; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description">
                            Las variables etiquetadas con esta temporada aparecen con mayor probabilidad en el Randometro.
                            Cámbialo cuando empiece Navidad, Halloween, etc.
                        </p>
                    </td>
                </tr>
                <tr>
                    <th><label for="rolls_per_day">🎲 Intentos diarios del Randometro</label></th>
                    <td>
                        <input type="number" name="rolls_per_day" id="rolls_per_day"
                            value="<?php echo intval( $rolls ); ?>" min="1" max="20"
                            style="width:80px;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 10px;">
                        <p class="description">Cuántas veces puede el usuario generar una idea nueva al día. Por defecto: 3.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="max_params">📊 Parámetros simultáneos</label></th>
                    <td>
                        <input type="number" name="max_params" id="max_params"
                            value="<?php echo intval( $max_params ); ?>" min="1" max="5"
                            style="width:80px;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 10px;">
                        <p class="description">Cuántos parámetros puede combinar a la vez. Por defecto: 3.</p>
                    </td>
                </tr>
            </table>

            <p class="submit">
                <input type="submit" name="inkrush_save_settings" class="button-primary"
                    value="💾 Guardar configuración"
                    style="background:#DFFF23;border-color:#111;color:#111;font-weight:900;">
            </p>
        </form>

        <!-- Info del plugin -->
        <div style="border:2px solid #111;border-radius:12px;padding:16px;max-width:600px;background:#111;color:#fff;margin-top:24px;">
            <p style="font-weight:900;margin:0 0 8px;">🔌 Endpoints REST disponibles</p>
            <code style="display:block;background:#222;padding:8px;border-radius:6px;font-size:12px;line-height:1.8;">
                GET  <?php echo esc_url( rest_url( 'inkrush/v1/parameters' ) ); ?><br>
                GET  <?php echo esc_url( rest_url( 'inkrush/v1/parameters?category=Lugares' ) ); ?><br>
                GET  <?php echo esc_url( rest_url( 'inkrush/v1/parameters?rarity=Legendario' ) ); ?><br>
                POST <?php echo esc_url( rest_url( 'inkrush/v1/parameters' ) ); ?>  (admin)<br>
                GET  <?php echo esc_url( rest_url( 'inkrush/v1/season' ) ); ?><br>
                POST <?php echo esc_url( rest_url( 'inkrush/v1/challenge/complete' ) ); ?>  (auth)
            </code>
        </div>
    </div>
    <?php
}
