<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/* ──────────────────────────────────────────────────────────────
   DB HELPERS
────────────────────────────────────────────────────────────── */

function inkrush_create_push_tables() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    $subs = $wpdb->prefix . 'inkrush_push_subs';
    $log  = $wpdb->prefix . 'inkrush_push_log';

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    dbDelta( "CREATE TABLE {$subs} (
        id         bigint(20)   NOT NULL AUTO_INCREMENT,
        user_id    bigint(20)   NOT NULL,
        endpoint   text         NOT NULL,
        p256dh     varchar(255) NOT NULL,
        auth       varchar(255) NOT NULL,
        created_at datetime     NOT NULL,
        PRIMARY KEY (id),
        KEY user_id (user_id)
    ) {$charset};" );

    dbDelta( "CREATE TABLE {$log} (
        id         bigint(20)   NOT NULL AUTO_INCREMENT,
        type       varchar(50)  NOT NULL DEFAULT 'broadcast',
        title      varchar(255) NOT NULL,
        body       text,
        sent_count int          NOT NULL DEFAULT 0,
        created_at datetime     NOT NULL,
        PRIMARY KEY (id)
    ) {$charset};" );
}

/* ──────────────────────────────────────────────────────────────
   VAPID KEY MANAGEMENT
────────────────────────────────────────────────────────────── */

function inkrush_get_vapid_keys() {
    $pub  = get_option( 'inkrush_vapid_public',  '' );
    $priv = get_option( 'inkrush_vapid_private', '' );

    if ( $pub && $priv ) return [ 'public' => $pub, 'private' => $priv ];

    // First run — generate and store
    if ( ! class_exists( '\Minishlink\WebPush\VAPID' ) ) return null;

    try {
        $keys = \Minishlink\WebPush\VAPID::createVapidKeys();
        update_option( 'inkrush_vapid_public',  $keys['publicKey'] );
        update_option( 'inkrush_vapid_private', $keys['privateKey'] );
        return [ 'public' => $keys['publicKey'], 'private' => $keys['privateKey'] ];
    } catch ( \Throwable $e ) {
        return null;
    }
}

/* ──────────────────────────────────────────────────────────────
   SEND HELPERS
────────────────────────────────────────────────────────────── */

/**
 * Send a Web Push to all subscriptions of a given user.
 * Returns the number of notifications successfully queued/sent.
 */
function inkrush_send_push_to_user( $user_id, $title, $body, $url = '/', $icon = '' ) {
    global $wpdb;

    if ( ! class_exists( '\Minishlink\WebPush\WebPush' ) ) return 0;

    $keys = inkrush_get_vapid_keys();
    if ( ! $keys ) return 0;

    if ( ! $icon ) {
        $icon = INKRUSH_URL . 'plugin-assets/icon-192.png';
    }

    $table = $wpdb->prefix . 'inkrush_push_subs';
    $rows  = $wpdb->get_results( $wpdb->prepare(
        "SELECT endpoint, p256dh, auth FROM {$table} WHERE user_id = %d",
        (int) $user_id
    ) );
    if ( ! $rows ) return 0;

    try {
        $webPush = new \Minishlink\WebPush\WebPush( [
            'VAPID' => [
                'subject'    => get_option( 'admin_email' ),
                'publicKey'  => $keys['public'],
                'privateKey' => $keys['private'],
            ],
        ] );

        $payload = wp_json_encode( compact( 'title', 'body', 'url', 'icon' ) );
        $sent    = 0;

        foreach ( $rows as $row ) {
            $sub = \Minishlink\WebPush\Subscription::create( [
                'endpoint' => $row->endpoint,
                'keys'     => [ 'p256dh' => $row->p256dh, 'auth' => $row->auth ],
            ] );
            $webPush->queueNotification( $sub, $payload );
        }

        foreach ( $webPush->flush() as $report ) {
            if ( $report->isSuccess() ) {
                $sent++;
            } elseif ( $report->isSubscriptionExpired() ) {
                // Clean stale endpoint
                $wpdb->delete( $table, [ 'endpoint' => $report->getRequest()->getUri()->__toString() ] );
            }
        }

        return $sent;
    } catch ( \Throwable $e ) {
        return 0;
    }
}

/**
 * Send a broadcast push to ALL subscribed users (or a subset).
 */
function inkrush_broadcast_push( $title, $body, $url = '/', $user_ids = [] ) {
    global $wpdb;

    if ( ! class_exists( '\Minishlink\WebPush\WebPush' ) ) return 0;

    $keys = inkrush_get_vapid_keys();
    if ( ! $keys ) return 0;

    $icon  = INKRUSH_URL . 'plugin-assets/icon-192.png';
    $table = $wpdb->prefix . 'inkrush_push_subs';

    if ( $user_ids ) {
        $ids  = implode( ',', array_map( 'intval', $user_ids ) );
        $rows = $wpdb->get_results( "SELECT endpoint, p256dh, auth FROM {$table} WHERE user_id IN ({$ids})" );
    } else {
        $rows = $wpdb->get_results( "SELECT endpoint, p256dh, auth FROM {$table}" );
    }
    if ( ! $rows ) return 0;

    try {
        $webPush = new \Minishlink\WebPush\WebPush( [
            'VAPID' => [
                'subject'    => get_option( 'admin_email' ),
                'publicKey'  => $keys['public'],
                'privateKey' => $keys['private'],
            ],
        ] );

        $payload = wp_json_encode( compact( 'title', 'body', 'url', 'icon' ) );
        $sent    = 0;

        foreach ( $rows as $row ) {
            $sub = \Minishlink\WebPush\Subscription::create( [
                'endpoint' => $row->endpoint,
                'keys'     => [ 'p256dh' => $row->p256dh, 'auth' => $row->auth ],
            ] );
            $webPush->queueNotification( $sub, $payload );
        }

        foreach ( $webPush->flush() as $report ) {
            if ( $report->isSuccess() ) {
                $sent++;
            } elseif ( $report->isSubscriptionExpired() ) {
                $wpdb->delete( $table, [ 'endpoint' => $report->getRequest()->getUri()->__toString() ] );
            }
        }

        return $sent;
    } catch ( \Throwable $e ) {
        return 0;
    }
}

/* ──────────────────────────────────────────────────────────────
   WP CRON — Musai hour + streak warning
────────────────────────────────────────────────────────────── */

add_action( 'inkrush_push_cron', 'inkrush_push_cron_handler' );

function inkrush_push_cron_handler() {
    $triggers = get_option( 'inkrush_push_triggers', inkrush_default_triggers() );
    $tz       = wp_timezone();
    $now      = new DateTime( 'now', $tz );
    $today    = $now->format( 'Y-m-d' );
    $cur_hour = $now->format( 'H' );

    // Only run triggers that are enabled
    $do_musai  = ! empty( $triggers['musai_hour'] );
    $do_streak = ! empty( $triggers['streak_warning'] );

    if ( ! $do_musai && ! $do_streak ) return;

    $streak_hours_before = (int) get_option( 'inkrush_streak_warn_hours', 3 );
    $streak_hour         = str_pad( 24 - $streak_hours_before, 2, '0', STR_PAD_LEFT );

    // Get all users with push subscriptions
    global $wpdb;
    $table = $wpdb->prefix . 'inkrush_push_subs';
    $uids  = $wpdb->get_col( "SELECT DISTINCT user_id FROM {$table}" );
    if ( ! $uids ) return;

    $app_url = get_option( 'inkrush_page_id' ) ? get_permalink( get_option( 'inkrush_page_id' ) ) : home_url( '/inkrush-app/' );

    foreach ( $uids as $uid ) {
        $uid       = (int) $uid;
        $last_done = get_user_meta( $uid, 'inkrush_last_challenge_date', true );
        $done_today = ( $last_done === $today );

        // Musai hour reminder
        if ( $do_musai && ! $done_today ) {
            $musai_hour = get_user_meta( $uid, 'inkrush_musai_hour', true );
            if ( $musai_hour ) {
                $set_hour = substr( $musai_hour, 0, 2 );
                if ( $set_hour === $cur_hour ) {
                    // Check we haven't already sent today
                    $sent_key = 'inkrush_musai_sent_' . $today;
                    if ( ! get_user_meta( $uid, $sent_key, true ) ) {
                        $user = get_userdata( $uid );
                        $name = $user ? explode( ' ', $user->display_name )[0] : '';
                        inkrush_send_push_to_user(
                            $uid,
                            '🎨 Es tu hora Musai',
                            ( $name ? "{$name}, " : '' ) . '¿listo para el reto de hoy?',
                            $app_url
                        );
                        update_user_meta( $uid, $sent_key, 1 );
                    }
                }
            }
        }

        // Streak warning
        if ( $do_streak && ! $done_today && $cur_hour === $streak_hour ) {
            $streak = (int) get_user_meta( $uid, 'inkrush_streak', true );
            if ( $streak > 0 ) {
                $sent_key = 'inkrush_streak_warn_' . $today;
                if ( ! get_user_meta( $uid, $sent_key, true ) ) {
                    inkrush_send_push_to_user(
                        $uid,
                        '🔥 ¡Tu racha peligra!',
                        "Tu racha de {$streak} día" . ( $streak > 1 ? 's' : '' ) . " termina a medianoche — ¡no la pierdas!",
                        $app_url
                    );
                    update_user_meta( $uid, $sent_key, 1 );
                }
            }
        }
    }
}

function inkrush_default_triggers() {
    return [
        'like'           => 1,
        'inspire'        => 1,
        'try'            => 1,
        'follow'         => 1,
        'comment'        => 1,
        'new_post'       => 1,
        'musai_hour'     => 1,
        'streak_warning' => 1,
    ];
}

/**
 * Called from inkrush_push_notification() in api.php after DB insert.
 * Sends a web push only if the corresponding trigger is enabled.
 */
function inkrush_maybe_send_social_push( $user_id, $from_user_id, $type, $post_id = null ) {
    $triggers = get_option( 'inkrush_push_triggers', inkrush_default_triggers() );
    if ( empty( $triggers[ $type ] ) ) return;

    $from = get_userdata( $from_user_id );
    $name = $from ? $from->display_name : 'Alguien';
    $app_url = get_option( 'inkrush_page_id' ) ? get_permalink( get_option( 'inkrush_page_id' ) ) : home_url( '/' );

    switch ( $type ) {
        case 'like':
            $title = '💛 Nuevo like';
            $body  = "{$name} le dio like a tu obra";
            break;
        case 'inspire':
            $title = '✨ Te inspiraron';
            $body  = "{$name} se inspiró con tu obra";
            break;
        case 'try':
            $title = '🎨 Alguien lo intentó';
            $body  = "{$name} intentó tu reto";
            break;
        case 'follow':
            $title = '👥 Nuevo seguidor';
            $body  = "{$name} ahora te sigue";
            break;
        case 'comment':
            $title = '💬 Nuevo comentario';
            $body  = "{$name} comentó tu obra";
            break;
        case 'new_post':
            $title = '🖼 Nueva obra';
            $body  = "{$name} publicó una nueva obra";
            break;
        default:
            return;
    }

    inkrush_send_push_to_user( $user_id, $title, $body, $app_url );
}

/* ──────────────────────────────────────────────────────────────
   ADMIN PAGE
────────────────────────────────────────────────────────────── */

function inkrush_page_push() {
    global $wpdb;
    $message = '';
    $error   = '';

    // Handle broadcast send
    if ( isset( $_POST['inkrush_push_send'] ) && check_admin_referer( 'inkrush_push' ) ) {
        $title = sanitize_text_field( $_POST['push_title'] ?? '' );
        $body  = sanitize_textarea_field( $_POST['push_body'] ?? '' );
        $url   = esc_url_raw( $_POST['push_url'] ?? '/' );
        if ( ! $title ) {
            $error = 'El título no puede estar vacío.';
        } else {
            $sent = inkrush_broadcast_push( $title, $body, $url );
            $wpdb->insert( $wpdb->prefix . 'inkrush_push_log', [
                'type'       => 'broadcast',
                'title'      => $title,
                'body'       => $body,
                'sent_count' => $sent,
                'created_at' => current_time( 'mysql', true ),
            ], [ '%s','%s','%s','%d','%s' ] );
            $message = "✅ Notificación enviada a {$sent} dispositivo" . ( $sent !== 1 ? 's' : '' ) . '.';
        }
    }

    // Handle trigger + streak settings
    if ( isset( $_POST['inkrush_push_settings'] ) && check_admin_referer( 'inkrush_push' ) ) {
        $trigger_keys = array_keys( inkrush_default_triggers() );
        $triggers = [];
        foreach ( $trigger_keys as $k ) {
            $triggers[ $k ] = isset( $_POST[ 'trigger_' . $k ] ) ? 1 : 0;
        }
        update_option( 'inkrush_push_triggers', $triggers );
        update_option( 'inkrush_streak_warn_hours', max( 1, min( 12, (int) ( $_POST['streak_warn_hours'] ?? 3 ) ) ) );
        $message = '✅ Configuración guardada.';
    }

    $subs_count   = (int) $wpdb->get_var( "SELECT COUNT(DISTINCT user_id) FROM {$wpdb->prefix}inkrush_push_subs" );
    $devs_count   = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}inkrush_push_subs" );
    $triggers     = get_option( 'inkrush_push_triggers', inkrush_default_triggers() );
    $streak_hours = (int) get_option( 'inkrush_streak_warn_hours', 3 );
    $log_rows     = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}inkrush_push_log ORDER BY created_at DESC LIMIT 20" );
    $keys         = inkrush_get_vapid_keys();

    $trigger_labels = [
        'like'           => '💛 Likes',
        'inspire'        => '✨ Inspiraciones',
        'try'            => '🎨 Intentos',
        'follow'         => '👥 Nuevos seguidores',
        'comment'        => '💬 Comentarios',
        'new_post'       => '🖼 Subidas de seguidos',
        'musai_hour'     => '🕐 Hora Musai (recordatorio diario)',
        'streak_warning' => '🔥 Alerta de racha',
    ];
    ?>
    <div class="wrap">
        <h1>📣 Musai — Notificaciones Push</h1>

        <?php if ( $message ) : ?>
            <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $message ); ?></p></div>
        <?php endif; ?>
        <?php if ( $error ) : ?>
            <div class="notice notice-error is-dismissible"><p><?php echo esc_html( $error ); ?></p></div>
        <?php endif; ?>

        <?php if ( ! $keys ) : ?>
            <div class="notice notice-warning"><p>⚠️ No se pudieron generar las claves VAPID. Comprueba que la extensión <strong>OpenSSL</strong> de PHP está activa y que la librería Composer está instalada (<code>vendor/autoload.php</code>).</p></div>
        <?php endif; ?>

        <!-- Stats -->
        <div style="display:flex;gap:16px;margin:20px 0;flex-wrap:wrap;">
            <?php foreach ( [
                [ '👥', $subs_count, 'usuarios suscritos' ],
                [ '📱', $devs_count, 'dispositivos totales' ],
            ] as [$ico, $n, $lbl] ) : ?>
            <div style="background:#111;color:#fff;border:2px solid #111;border-radius:12px;padding:14px 22px;display:flex;align-items:center;gap:14px;">
                <span style="font-size:28px;"><?php echo $ico; ?></span>
                <div>
                    <strong style="font-size:28px;color:#DFFF23;"><?php echo $n; ?></strong><br>
                    <small style="color:rgba(255,255,255,.6);font-size:12px;"><?php echo esc_html( $lbl ); ?></small>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:900px;">

            <!-- Broadcast form -->
            <div style="border:2px solid #111;border-radius:12px;overflow:hidden;">
                <div style="background:#111;color:#DFFF23;padding:12px 18px;font-weight:900;">📤 Enviar notificación manual</div>
                <div style="padding:18px;">
                    <form method="post">
                        <?php wp_nonce_field( 'inkrush_push' ); ?>
                        <label style="font-weight:800;font-size:12px;display:block;margin-bottom:4px;">Título *</label>
                        <input type="text" name="push_title" required
                            style="width:100%;height:36px;border:2px solid #111;border-radius:8px;padding:0 10px;font-weight:700;font-size:13px;margin-bottom:12px;">

                        <label style="font-weight:800;font-size:12px;display:block;margin-bottom:4px;">Mensaje</label>
                        <textarea name="push_body" rows="3"
                            style="width:100%;border:2px solid #111;border-radius:8px;padding:8px 10px;font-size:13px;resize:none;margin-bottom:12px;"></textarea>

                        <label style="font-weight:800;font-size:12px;display:block;margin-bottom:4px;">URL al abrir</label>
                        <input type="text" name="push_url" value="/"
                            style="width:100%;height:36px;border:2px solid #111;border-radius:8px;padding:0 10px;font-family:monospace;font-size:12px;margin-bottom:16px;">

                        <input type="submit" name="inkrush_push_send" value="📤 Enviar a todos"
                            style="background:#DFFF23;border:2px solid #111;border-radius:8px;height:40px;padding:0 20px;font-weight:900;font-size:13px;cursor:pointer;">
                    </form>
                </div>
            </div>

            <!-- Settings form -->
            <div style="border:2px solid #111;border-radius:12px;overflow:hidden;">
                <div style="background:#111;color:#DFFF23;padding:12px 18px;font-weight:900;">⚙️ Configuración de triggers</div>
                <div style="padding:18px;">
                    <form method="post">
                        <?php wp_nonce_field( 'inkrush_push' ); ?>
                        <?php foreach ( $trigger_labels as $key => $label ) : ?>
                        <label style="display:flex;align-items:center;gap:10px;margin-bottom:10px;font-weight:700;font-size:13px;cursor:pointer;">
                            <input type="checkbox" name="trigger_<?php echo esc_attr( $key ); ?>"
                                <?php checked( ! empty( $triggers[ $key ] ) ); ?>
                                style="width:16px;height:16px;accent-color:#111;">
                            <?php echo esc_html( $label ); ?>
                        </label>
                        <?php endforeach; ?>

                        <div style="border-top:2px solid #eee;margin:14px 0 12px;"></div>
                        <label style="font-weight:800;font-size:12px;display:block;margin-bottom:6px;">🔥 Alerta de racha: avisar con</label>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                            <input type="number" name="streak_warn_hours" value="<?php echo $streak_hours; ?>" min="1" max="12"
                                style="width:70px;height:36px;border:2px solid #111;border-radius:8px;padding:0 10px;font-weight:700;text-align:center;">
                            <span style="font-weight:700;font-size:13px;">horas de antelación</span>
                        </div>

                        <input type="submit" name="inkrush_push_settings" value="💾 Guardar configuración"
                            style="background:#DFFF23;border:2px solid #111;border-radius:8px;height:40px;padding:0 20px;font-weight:900;font-size:13px;cursor:pointer;">
                    </form>
                </div>
            </div>
        </div>

        <!-- Log -->
        <div style="max-width:900px;margin-top:24px;border:2px solid #111;border-radius:12px;overflow:hidden;">
            <div style="background:#111;color:#DFFF23;padding:12px 18px;font-weight:900;">📋 Historial reciente</div>
            <?php if ( $log_rows ) : ?>
            <table class="widefat" style="border:none;">
                <thead>
                    <tr style="background:#f9f9f9;">
                        <th style="padding:8px 14px;">Fecha</th>
                        <th style="padding:8px 14px;">Tipo</th>
                        <th style="padding:8px 14px;">Título</th>
                        <th style="padding:8px 14px;text-align:right;">Enviados</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ( $log_rows as $row ) : ?>
                    <tr>
                        <td style="padding:8px 14px;font-size:12px;color:#888;"><?php echo esc_html( wp_date( 'd M H:i', strtotime( $row->created_at ) ) ); ?></td>
                        <td style="padding:8px 14px;font-size:12px;font-weight:700;"><?php echo esc_html( $row->type ); ?></td>
                        <td style="padding:8px 14px;font-size:13px;font-weight:700;"><?php echo esc_html( $row->title ); ?></td>
                        <td style="padding:8px 14px;font-size:13px;font-weight:900;text-align:right;">
                            <span style="background:#C9F2D6;border:1.5px solid #111;border-radius:999px;padding:2px 10px;"><?php echo (int) $row->sent_count; ?></span>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php else : ?>
            <p style="padding:16px 18px;color:#888;font-size:13px;">Aún no se han enviado notificaciones.</p>
            <?php endif; ?>
        </div>
    </div>
    <?php
}
