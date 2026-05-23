<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Tracks disponibles en el Pomodoro — deben coincidir con MUSIC_TRACKS en parameters.js
 */
function inkrush_music_tracks() {
    return [
        [ 'id' => 'lofi',   'icon' => '🌙', 'title' => 'Midnight Lofi',    'mood' => 'Beat suave infinito' ],
        [ 'id' => 'rain',   'icon' => '🌧️', 'title' => 'Rain Studio',       'mood' => 'Lluvia relajante' ],
        [ 'id' => 'coffee', 'icon' => '☕',  'title' => 'Coffee Shop',        'mood' => 'Cafetería creativa' ],
        [ 'id' => 'forest', 'icon' => '🌲', 'title' => 'Forest Sketching',  'mood' => 'Bosque tranquilo' ],
        [ 'id' => 'piano',  'icon' => '🎹', 'title' => 'Soft Piano',         'mood' => 'Piano relajante' ],
        [ 'id' => 'analog', 'icon' => '📼', 'title' => 'Analog Chill',       'mood' => 'Cinta vintage' ],
        [ 'id' => 'synth',  'icon' => '🪐', 'title' => 'Synth Chill',        'mood' => 'Espacial suave' ],
        [ 'id' => 'night',  'icon' => '🕯️', 'title' => 'Night Studio',       'mood' => 'Estudio nocturno' ],
    ];
}

/**
 * Encola los scripts del media picker de WordPress solo en esta página
 */
add_action( 'admin_enqueue_scripts', function( $hook ) {
    if ( $hook !== 'inkrush_page_inkrush-music' ) return;

    // Cargar scripts del media picker solo si la función existe y el uploader está disponible
    if ( function_exists( 'wp_enqueue_media' ) ) {
        try {
            wp_enqueue_media();
        } catch ( \Throwable $e ) {
            // Si wp_enqueue_media() falla, el picker no estará disponible
            // pero la página sigue funcionando (el JS tiene fallback)
        }
    }

    wp_enqueue_script(
        'inkrush-music-admin',
        INKRUSH_URL . 'admin/music-admin.js',
        [ 'jquery' ],
        INKRUSH_VERSION,
        true
    );
} );

function inkrush_page_music() {
    $message = '';
    $error   = '';

    // Migrar dominio en todas las URLs
    if ( isset( $_POST['inkrush_migrate_domain'] ) && check_admin_referer( 'inkrush_music' ) ) {
        $old = esc_url_raw( trim( $_POST['old_domain'] ?? '' ) );
        $new = esc_url_raw( trim( $_POST['new_domain'] ?? '' ) );
        $old = rtrim( $old, '/' );
        $new = rtrim( $new, '/' );
        if ( ! $old || ! $new ) {
            $error = '❌ Debes rellenar ambos dominios.';
        } else {
            $saved   = get_option( 'inkrush_music_srcs', [] );
            $changed = 0;
            foreach ( $saved as $id => $url ) {
                if ( $url && strpos( $url, $old ) !== false ) {
                    $saved[ $id ] = str_replace( $old, $new, $url );
                    $changed++;
                }
            }
            update_option( 'inkrush_music_srcs', $saved );
            $message = $changed
                ? "✅ {$changed} URL" . ( $changed > 1 ? 's reemplazadas' : ' reemplazada' ) . " correctamente."
                : '⚠️ No se encontró el dominio antiguo en ninguna URL.';
        }
    }

    // Guardar formulario
    if ( isset( $_POST['inkrush_save_music'] ) && check_admin_referer( 'inkrush_music' ) ) {
        $tracks  = inkrush_music_tracks();
        $saved   = [];

        foreach ( $tracks as $track ) {
            $id  = $track['id'];
            $raw = isset( $_POST[ 'music_url_' . $id ] ) ? trim( $_POST[ 'music_url_' . $id ] ) : '';
            $url = $raw ? esc_url_raw( $raw ) : '';
            if ( $raw && ! $url ) {
                $error = '❌ La URL del track "' . esc_html( $track['title'] ) . '" no es válida. Usa una URL completa (https://...).';
            }
            $saved[ $id ] = $url;
        }

        update_option( 'inkrush_music_srcs', $saved );
        if ( ! $error ) {
            $message = '✅ URLs de música guardadas correctamente.';
        }
    }

    $tracks  = inkrush_music_tracks();
    $saved   = (array) get_option( 'inkrush_music_srcs', [] );
    $configured = count( array_filter( $saved ) );
    ?>
    <div class="wrap">
        <h1>🎵 Musai — Música del Pomodoro</h1>
        <p style="color:#555;margin-bottom:20px;max-width:640px;">
            Configura qué archivo de audio suena cuando el usuario elige cada ambiente musical en el timer Pomodoro.
            Pega una URL directa a un archivo <code>.mp3</code> / <code>.ogg</code>, o usa el selector de la Biblioteca de medios.
        </p>

        <?php if ( $message ) : ?>
            <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $message ); ?></p></div>
        <?php endif; ?>
        <?php if ( $error ) : ?>
            <div class="notice notice-error is-dismissible"><p><?php echo esc_html( $error ); ?></p></div>
        <?php endif; ?>

        <!-- Migrador de dominio -->
        <details style="max-width:760px;margin-bottom:20px;border:2px solid #111;border-radius:10px;overflow:hidden;">
            <summary style="background:#111;color:#DFFF23;padding:10px 16px;font-weight:900;cursor:pointer;list-style:none;">
                🔄 Migrar dominio en todas las URLs de música
            </summary>
            <div style="padding:16px;background:#FFFDF3;">
                <p style="font-size:12px;color:#555;margin:0 0 12px;">
                    Si migraste el sitio a otro dominio, reemplaza automáticamente el dominio viejo en todas las URLs guardadas.
                    Incluye el protocolo: <code>https://dominio-viejo.com</code>
                </p>
                <form method="post" style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;">
                    <?php wp_nonce_field( 'inkrush_music' ); ?>
                    <div>
                        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Dominio antiguo</label>
                        <input type="text" name="old_domain" placeholder="https://dominio-viejo.com"
                            style="height:34px;width:240px;border:2px solid #111;border-radius:7px;padding:0 10px;font-family:monospace;font-size:12px;">
                    </div>
                    <div style="font-size:18px;padding-bottom:6px;">→</div>
                    <div>
                        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Dominio nuevo</label>
                        <input type="text" name="new_domain" placeholder="https://dominio-nuevo.com"
                            style="height:34px;width:240px;border:2px solid #111;border-radius:7px;padding:0 10px;font-family:monospace;font-size:12px;">
                    </div>
                    <input type="submit" name="inkrush_migrate_domain" value="🔄 Reemplazar"
                        style="height:34px;padding:0 18px;background:#DFFF23;border:2px solid #111;border-radius:7px;font-weight:900;font-size:13px;cursor:pointer;">
                </form>
            </div>
        </details>

        <!-- Resumen -->
        <div style="display:inline-flex;align-items:center;gap:12px;background:<?php echo $configured === count( $tracks ) ? '#C9F2D6' : '#FFE9A8'; ?>;border:2px solid #111;border-radius:10px;padding:10px 18px;margin-bottom:24px;">
            <span style="font-size:22px;">🎵</span>
            <div>
                <strong><?php echo $configured; ?>/<?php echo count( $tracks ); ?> tracks configurados</strong><br>
                <small style="color:#555;">Los tracks sin URL no aparecerán en la app</small>
            </div>
        </div>

        <form method="post" style="max-width:760px;">
            <?php wp_nonce_field( 'inkrush_music' ); ?>

            <table class="widefat fixed" style="border:2px solid #111;border-radius:12px;overflow:hidden;border-collapse:separate;">
                <thead>
                    <tr style="background:#111;color:#DFFF23;">
                        <th style="width:52px;padding:10px 14px;font-weight:800;">Amb.</th>
                        <th style="padding:10px 14px;font-weight:800;">Nombre</th>
                        <th style="padding:10px 14px;font-weight:800;">URL del archivo de audio</th>
                        <th style="width:110px;padding:10px 14px;font-weight:800;text-align:center;">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ( $tracks as $i => $track ) :
                        $id       = $track['id'];
                        $url      = $saved[ $id ] ?? '';
                        $has_url  = ! empty( $url );
                        $bg       = $i % 2 === 0 ? '#FFFDF3' : '#F8F4E9';
                    ?>
                    <tr style="background:<?php echo $bg; ?>;">
                        <!-- Icono -->
                        <td style="padding:12px 14px;text-align:center;font-size:22px;vertical-align:top;padding-top:16px;">
                            <?php echo $track['icon']; ?>
                        </td>

                        <!-- Nombre + mood -->
                        <td style="padding:12px 14px;vertical-align:top;">
                            <strong style="font-size:13px;display:block;"><?php echo esc_html( $track['title'] ); ?></strong>
                            <small style="color:#888;"><?php echo esc_html( $track['mood'] ); ?></small>
                        </td>

                        <!-- Input URL + media picker -->
                        <td style="padding:12px 14px;vertical-align:top;">
                            <div style="display:flex;gap:8px;align-items:center;">
                                <input
                                    type="text"
                                    id="music_url_<?php echo esc_attr( $id ); ?>"
                                    name="music_url_<?php echo esc_attr( $id ); ?>"
                                    value="<?php echo esc_attr( $url ); ?>"
                                    placeholder="https://... · mp3, ogg"
                                    class="inkrush-music-url"
                                    style="flex:1;height:34px;border:2px solid #111;border-radius:7px;padding:0 10px;font-family:monospace;font-size:12px;"
                                >
                                <button
                                    type="button"
                                    class="button inkrush-media-pick"
                                    data-target="music_url_<?php echo esc_attr( $id ); ?>"
                                    style="height:34px;white-space:nowrap;border:2px solid #111;border-radius:7px;font-weight:700;"
                                    title="Seleccionar desde la Biblioteca de medios"
                                >
                                    📁 Biblioteca
                                </button>
                                <?php if ( $has_url ) : ?>
                                    <button
                                        type="button"
                                        class="inkrush-preview-btn"
                                        data-url="<?php echo esc_attr( $url ); ?>"
                                        style="height:34px;padding:0 10px;border:2px solid #111;border-radius:7px;background:#DFFF23;font-weight:700;cursor:pointer;"
                                        title="Preescuchar"
                                    >▶</button>
                                <?php endif; ?>
                            </div>
                            <?php if ( $has_url ) : ?>
                                <small style="color:#888;font-family:monospace;word-break:break-all;display:block;margin-top:4px;">
                                    <?php echo esc_html( $url ); ?>
                                </small>
                            <?php endif; ?>
                        </td>

                        <!-- Estado -->
                        <td style="padding:12px 14px;text-align:center;vertical-align:top;padding-top:16px;">
                            <?php if ( $has_url ) : ?>
                                <span style="background:#C9F2D6;border:1.5px solid #111;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:800;">✓ OK</span>
                            <?php else : ?>
                                <span style="background:#F0EDE0;border:1.5px solid #aaa;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;color:#999;">Sin URL</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>

            <div style="margin-top:20px;display:flex;align-items:center;gap:16px;">
                <input
                    type="submit"
                    name="inkrush_save_music"
                    class="button-primary"
                    value="💾 Guardar configuración de música"
                    style="background:#DFFF23;border-color:#111;color:#111;font-weight:900;height:40px;font-size:14px;"
                >
                <span style="color:#888;font-size:12px;">Los cambios se aplican en la app inmediatamente tras guardar.</span>
            </div>
        </form>

        <!-- Nota técnica -->
        <div style="margin-top:32px;border:2px solid #111;border-radius:12px;padding:16px 20px;max-width:760px;background:#111;color:#fff;">
            <p style="font-weight:900;margin:0 0 10px;color:#DFFF23;">💡 Dónde subir los archivos de audio</p>
            <ul style="margin:0;padding-left:18px;line-height:2;font-size:13px;color:rgba(255,255,255,.75);">
                <li><strong style="color:#fff;">Opción A (recomendado):</strong> Sube el <code>.mp3</code> desde <em>Medios → Añadir nuevo</em> y copia la URL.</li>
                <li><strong style="color:#fff;">Opción B:</strong> Usa el botón <em>📁 Biblioteca</em> de cada fila para seleccionar directamente.</li>
                <li><strong style="color:#fff;">Opción C:</strong> Pega cualquier URL pública a un archivo de audio compatible con HTML5.</li>
            </ul>
            <p style="color:rgba(255,255,255,.5);font-size:11px;margin:10px 0 0;font-family:monospace;">
                Formatos soportados: MP3, OGG, AAC, WAV — el navegador del usuario decide qué puede reproducir.
            </p>
        </div>

        <!-- Reproductor oculto para preview -->
        <audio id="inkrush-preview-player" style="display:none;"></audio>
    </div>

    <script>
    // Preview de audio inline (sin depender del .js externo)
    document.querySelectorAll('.inkrush-preview-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var player = document.getElementById('inkrush-preview-player');
            var url    = this.dataset.url;
            if (player.src === url && !player.paused) {
                player.pause();
                this.textContent = '▶';
            } else {
                player.src = url;
                player.play();
                this.textContent = '⏸';
                document.querySelectorAll('.inkrush-preview-btn').forEach(function(b) {
                    if (b !== btn) b.textContent = '▶';
                });
            }
        });
    });
    </script>
    <?php
}
