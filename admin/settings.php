<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function inkrush_page_settings() {
    $message = '';

    if ( isset( $_POST['inkrush_save_settings'] ) && check_admin_referer( 'inkrush_settings' ) ) {
        update_option( 'inkrush_active_season',    sanitize_text_field( $_POST['active_season'] ) );
        update_option( 'inkrush_rolls_per_day',    (int) $_POST['rolls_per_day'] );
        update_option( 'inkrush_max_params',       (int) $_POST['max_params'] );
        update_option( 'inkrush_profile_base',     sanitize_title( $_POST['profile_base'] ?? 'artista' ) );
        flush_rewrite_rules();
        if ( isset( $_POST['anthropic_api_key'] ) ) {
            $key = sanitize_text_field( $_POST['anthropic_api_key'] );
            if ( $key !== '••••••••' && $key !== '' ) {
                update_option( 'inkrush_anthropic_key', $key );
            } elseif ( $key === '' ) {
                delete_option( 'inkrush_anthropic_key' );
            }
        }
        if ( isset( $_POST['recaptcha_site_key'] ) ) {
            update_option( 'inkrush_recaptcha_site_key', sanitize_text_field( $_POST['recaptcha_site_key'] ) );
        }
        if ( isset( $_POST['recaptcha_secret_key'] ) ) {
            $sec = sanitize_text_field( $_POST['recaptcha_secret_key'] );
            if ( $sec !== '••••••••' && $sec !== '' ) {
                update_option( 'inkrush_recaptcha_secret_key', $sec );
            } elseif ( $sec === '' ) {
                delete_option( 'inkrush_recaptcha_secret_key' );
            }
        }
        $message = '✅ Configuración guardada.';
    }

    $seasons        = [ '', 'Primavera', 'Verano', 'Otoño', 'Invierno', 'Halloween', 'Navidad', 'San Valentín' ];
    $cur_season     = get_option( 'inkrush_active_season', '' );
    $rolls          = get_option( 'inkrush_rolls_per_day', 3 );
    $max_params     = get_option( 'inkrush_max_params', 3 );
    $has_anthropic  = ! empty( get_option( 'inkrush_anthropic_key', '' ) );
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
                    <th><label for="profile_base">🔗 URL base de perfiles</label></th>
                    <td>
                        <input type="text" name="profile_base" id="profile_base"
                            value="<?php echo esc_attr( get_option( 'inkrush_profile_base', 'artista' ) ); ?>"
                            placeholder="artista"
                            style="width:180px;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 10px;">
                        <p class="description">
                            Prefijo para las URLs de perfil. Con <code>artista</code> quedaría:
                            <strong><?php echo esc_url( home_url( '/artista/tuhandle' ) ); ?></strong><br>
                            <strong style="color:darkorange;">⚠️ Tras cambiar esto, ve a Ajustes → Enlaces permanentes y pulsa Guardar para actualizar las reglas.</strong>
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
                <tr>
                    <th><label for="recaptcha_site_key">🔒 reCAPTCHA — Site Key (pública)</label></th>
                    <td>
                        <input type="text" name="recaptcha_site_key" id="recaptcha_site_key"
                            value="<?php echo esc_attr( get_option( 'inkrush_recaptcha_site_key', '' ) ); ?>"
                            placeholder="6Lc..."
                            style="width:320px;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 10px;font-family:monospace;">
                        <p class="description">
                            La Site Key de Google reCAPTCHA v2 (la checkbox "No soy un robot").
                            Consíguela en <a href="https://www.google.com/recaptcha/admin" target="_blank">google.com/recaptcha/admin</a>.
                            Si está vacía, el CAPTCHA no aparecerá en el registro.
                        </p>
                    </td>
                </tr>
                <tr>
                    <th><label for="recaptcha_secret_key">🔒 reCAPTCHA — Secret Key (privada)</label></th>
                    <td>
                        <input type="password" name="recaptcha_secret_key" id="recaptcha_secret_key"
                            value="<?php echo get_option( 'inkrush_recaptcha_secret_key', '' ) ? '••••••••' : ''; ?>"
                            placeholder="6Lc..."
                            style="width:320px;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 10px;font-family:monospace;">
                        <p class="description">
                            La Secret Key de Google reCAPTCHA v2. Nunca la compartas ni la pongas en el frontend.
                            <?php if ( get_option( 'inkrush_recaptcha_secret_key', '' ) ) : ?>
                                <strong style="color:green;">✅ Configurada.</strong>
                            <?php else : ?>
                                <strong style="color:darkorange;">⚠️ No configurada — el CAPTCHA no se validará en el servidor.</strong>
                            <?php endif; ?>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th><label for="anthropic_api_key">🤖 Clave API de Anthropic</label></th>
                    <td>
                        <input type="password" name="anthropic_api_key" id="anthropic_api_key"
                            value="<?php echo $has_anthropic ? '••••••••' : ''; ?>"
                            placeholder="sk-ant-..."
                            style="width:320px;height:36px;border:2px solid #111;border-radius:8px;font-weight:700;padding:0 10px;font-family:monospace;">
                        <p class="description">
                            Necesaria para la lluvia de palabras clave IA durante el Pomodoro.
                            <?php if ( $has_anthropic ) : ?>
                                <strong style="color:green;">✅ Clave configurada.</strong>
                            <?php else : ?>
                                <strong style="color:darkorange;">⚠️ No configurada — la lluvia de ideas estará desactivada.</strong>
                            <?php endif; ?>
                        </p>
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
