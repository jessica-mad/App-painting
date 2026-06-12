<?php
/**
 * Plugin Name: InkRush App
 * Plugin URI:  https://inkrush.app
 * Description: App de retos creativos para ilustradores. Shortcode: [inkrush_app]
 * Version:     1.3.0
 * Author:      InkRush
 * License:     GPL-2.0+
 * Text Domain: inkrush-app
 * GitHub Plugin URI: jessica-mad/App-painting
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'INKRUSH_VERSION', '1.3.0' );
define( 'INKRUSH_DIR',     plugin_dir_path( __FILE__ ) );
define( 'INKRUSH_URL',     plugin_dir_url( __FILE__ ) );

if ( file_exists( INKRUSH_DIR . 'vendor/autoload.php' ) ) {
    require_once INKRUSH_DIR . 'vendor/autoload.php';
}

require_once INKRUSH_DIR . 'admin/variables.php';
require_once INKRUSH_DIR . 'admin/users.php';
require_once INKRUSH_DIR . 'admin/settings.php';
require_once INKRUSH_DIR . 'admin/music.php';
require_once INKRUSH_DIR . 'admin/reports.php';
require_once INKRUSH_DIR . 'admin/push.php';
require_once INKRUSH_DIR . 'admin/analytics.php';
require_once INKRUSH_DIR . 'admin/api.php';

/* ──────────────────────────────────────────────────────────────
   1. ACTIVACIÓN
────────────────────────────────────────────────────────────── */

register_activation_hook( __FILE__, 'inkrush_activate' );
function inkrush_activate() {
    inkrush_register_roles();
    inkrush_register_cpt();
    inkrush_create_page();
    inkrush_seed_default_variables();
    inkrush_create_notifications_table();
    inkrush_create_tries_table();
    inkrush_create_push_tables();
    inkrush_get_vapid_keys(); // generate VAPID keys on first activation
    if ( ! wp_next_scheduled( 'inkrush_push_cron' ) ) {
        wp_schedule_event( time(), 'hourly', 'inkrush_push_cron' );
    }
    flush_rewrite_rules();
}

/* Create (or upgrade) custom tables on init if schema version is outdated */
add_action( 'init', function () {
    $v = (int) get_option( 'inkrush_db_schema_v', 0 );
    if ( $v < 1 ) { inkrush_create_notifications_table(); }
    if ( $v < 2 ) { inkrush_create_tries_table(); }
    if ( $v < 3 ) {
        inkrush_create_push_tables();
        update_option( 'inkrush_db_schema_v', 3 );
        add_action( 'shutdown', 'flush_rewrite_rules' ); // flush once after upgrade
    }
    if ( $v < 4 ) {
        inkrush_create_analytics_table();
        update_option( 'inkrush_db_schema_v', 4 );
    }
} );

function inkrush_create_notifications_table() {
    global $wpdb;
    $table   = $wpdb->prefix . 'inkrush_notifications';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE {$table} (
        id          bigint(20)   NOT NULL AUTO_INCREMENT,
        user_id     bigint(20)   NOT NULL,
        from_user_id bigint(20)  NOT NULL DEFAULT 0,
        type        varchar(20)  NOT NULL,
        post_id     bigint(20)   DEFAULT NULL,
        excerpt     varchar(255) DEFAULT NULL,
        is_read     tinyint(1)   NOT NULL DEFAULT 0,
        created_at  datetime     NOT NULL,
        PRIMARY KEY (id),
        KEY user_read (user_id, is_read),
        KEY created (created_at)
    ) {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

function inkrush_create_tries_table() {
    global $wpdb;
    $table   = $wpdb->prefix . 'inkrush_tries_log';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE {$table} (
        id         bigint(20) NOT NULL AUTO_INCREMENT,
        user_id    bigint(20) NOT NULL,
        variables  text       DEFAULT NULL,
        try_date   date       NOT NULL,
        created_at datetime   NOT NULL,
        PRIMARY KEY (id),
        KEY user_date (user_id, try_date),
        KEY try_date  (try_date)
    ) {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

register_deactivation_hook( __FILE__, function() {
    remove_role( 'ilustrador' );
    wp_clear_scheduled_hook( 'inkrush_push_cron' );
    flush_rewrite_rules();
} );

/* Service Worker served from site root via rewrite */
add_action( 'init', function () {
    add_rewrite_rule( '^push-sw\.js$', 'index.php?inkrush_push_sw=1', 'top' );

    // Flush rewrite rules once whenever the SW rule hasn't been registered yet
    if ( ! get_option( 'inkrush_sw_rewrite_flushed' ) ) {
        flush_rewrite_rules( false );
        update_option( 'inkrush_sw_rewrite_flushed', INKRUSH_VERSION );
    }
} );
add_filter( 'query_vars', function ( $vars ) {
    $vars[] = 'inkrush_push_sw';
    return $vars;
} );
// Prevent WordPress canonical redirect from intercepting /push-sw.js
// (SW registration blocks any redirect, even transparent 301s)
add_filter( 'redirect_canonical', function( $redirect_url ) {
    if ( get_query_var( 'inkrush_push_sw' ) ) return false;
    return $redirect_url;
} );
add_action( 'template_redirect', function () {
    if ( ! get_query_var( 'inkrush_push_sw' ) ) return;
    $file = INKRUSH_DIR . 'push-sw.js';
    if ( ! file_exists( $file ) ) {
        status_header( 404 );
        exit;
    }
    header( 'Content-Type: application/javascript; charset=utf-8' );
    header( 'Service-Worker-Allowed: /' );
    header( 'Cache-Control: no-cache' );
    readfile( $file );
    exit;
} );

/* ──────────────────────────────────────────────────────────────
   2. CUSTOM POST TYPE — inkrush_artwork
────────────────────────────────────────────────────────────── */

add_action( 'init', 'inkrush_register_cpt' );


function inkrush_register_cpt() {
    register_post_type( 'inkrush_artwork', [
        'labels' => [
            'name'          => 'Obras InkRush',
            'singular_name' => 'Obra',
            'add_new_item'  => 'Añadir obra',
            'edit_item'     => 'Editar obra',
        ],
        'public'        => false,
        'show_ui'       => true,
        'show_in_menu'  => 'inkrush',
        'show_in_rest'  => false,   // usamos nuestra propia REST API
        'supports'      => [ 'title', 'thumbnail', 'author', 'custom-fields' ],
        'menu_icon'     => 'dashicons-art',
        'capability_type' => 'post',
        'map_meta_cap'  => true,
    ] );

    register_post_type( 'inkrush_bug', [
        'labels' => [
            'name'          => 'Bug Reports',
            'singular_name' => 'Bug Report',
            'add_new_item'  => 'Añadir reporte',
            'edit_item'     => 'Ver reporte',
        ],
        'public'          => false,
        'show_ui'         => true,
        'show_in_menu'    => 'inkrush',
        'show_in_rest'    => false,
        'supports'        => [ 'title', 'editor', 'excerpt', 'author', 'custom-fields' ],
        'capability_type' => 'post',
        'map_meta_cap'    => true,
    ] );
}

// Columna miniatura en el listado de obras
add_filter( 'manage_inkrush_artwork_posts_columns', function( $cols ) {
    return array_merge( [ 'inkrush_thumb' => '' ], $cols );
} );
add_action( 'manage_inkrush_artwork_posts_custom_column', function( $col, $post_id ) {
    if ( $col !== 'inkrush_thumb' ) return;
    $url = get_the_post_thumbnail_url( $post_id, 'thumbnail' );
    if ( $url ) {
        echo '<img src="' . esc_url( $url ) . '" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">';
    } else {
        echo '<div style="width:50px;height:50px;border-radius:4px;background:#eee;"></div>';
    }
}, 10, 2 );
add_action( 'admin_head', function() {
    $screen = get_current_screen();
    if ( $screen && $screen->post_type === 'inkrush_artwork' && $screen->base === 'edit' ) {
        echo '<style>.column-inkrush_thumb{width:60px;}</style>';
    }
} );

/* ──────────────────────────────────────────────────────────────
   3. ROLES
────────────────────────────────────────────────────────────── */

function inkrush_register_roles() {
    if ( get_role( 'ilustrador' ) ) return;
    $sub  = get_role( 'subscriber' );
    $caps = $sub ? $sub->capabilities : [ 'read' => true ];
    add_role( 'ilustrador', 'Ilustrador', array_merge( $caps, [
        'inkrush_generate_challenge' => true,
        'inkrush_upload_artwork'     => true,
        'inkrush_react_to_posts'     => true,
    ] ) );
}

add_action( 'user_register', function( $uid ) {
    ( new WP_User( $uid ) )->set_role( 'ilustrador' );
} );

/* ──────────────────────────────────────────────────────────────
   4. SHORTCODE [inkrush_app]
────────────────────────────────────────────────────────────── */

add_shortcode( 'inkrush_app', function() {
    wp_enqueue_style(  'inkrush-app', INKRUSH_URL . 'plugin-assets/app.css', [], INKRUSH_VERSION );
    wp_enqueue_script( 'inkrush-app', INKRUSH_URL . 'plugin-assets/app.js',  [], INKRUSH_VERSION, true );

    $user_id = get_current_user_id();
    $user    = $user_id ? get_userdata( $user_id ) : null;

    /* Auto-generate a clean handle for users who don't have one yet */
    if ( $user_id && empty( get_user_meta( $user_id, 'inkrush_handle', true ) ) ) {
        $name = $user->display_name ?: $user->user_login;
        $slug = strtolower( $name );
        $slug = function_exists( 'iconv' ) ? iconv( 'UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug ) : $slug;
        $slug = preg_replace( '/[^a-z0-9]+/', '_', $slug );
        $slug = trim( preg_replace( '/_{2,}/', '_', $slug ), '_' );
        $slug = substr( $slug ?: 'artista', 0, 18 );
        $handle = $slug;
        $i = 2;
        while ( ! empty( get_users( [ 'meta_key' => 'inkrush_handle', 'meta_value' => $handle, 'number' => 1, 'fields' => 'ID', 'exclude' => [ $user_id ] ] ) ) ) {
            $handle = substr( $slug, 0, 15 ) . '_' . $i++;
        }
        update_user_meta( $user_id, 'inkrush_handle', $handle );
    }

    wp_localize_script( 'inkrush-app', 'InkRushConfig', [
        'apiUrl'       => esc_url( rest_url( 'inkrush/v1' ) ),
        'nonce'        => wp_create_nonce( 'wp_rest' ),
        'loginUrl'     => wp_login_url(),
        'activeSeason' => get_option( 'inkrush_active_season', '' ),
        'rolls'        => (int) get_option( 'inkrush_rolls_per_day', 3 ),

        // Datos del usuario actual
        'userId'       => $user_id,
        'userName'     => $user ? $user->user_login : '',
        'displayName'  => $user ? $user->display_name : '',
        'userAvatar'   => $user_id ? get_avatar_url( $user_id, [ 'size' => 96 ] ) : '',
        'userBio'      => $user_id ? ( get_user_meta( $user_id, 'inkrush_bio', true ) ?: '' ) : '',
        'userEmail'    => $user ? $user->user_email : '',
        'avatarUrl'    => $user_id ? ( get_user_meta( $user_id, 'inkrush_avatar_url', true ) ?: '' ) : '',
        'socials'      => $user_id ? ( get_user_meta( $user_id, 'inkrush_socials', true ) ?: [ 'instagram' => '', 'tiktok' => '', 'pinterest' => '' ] ) : [ 'instagram' => '', 'tiktok' => '', 'pinterest' => '' ],
        'challenges'   => $user_id ? (int) get_user_meta( $user_id, 'inkrush_challenges_completed', true ) : 0,
        'streak'       => $user_id ? (int) get_user_meta( $user_id, 'inkrush_streak', true ) : 0,
        'totalLikes'   => $user_id ? (int) get_user_meta( $user_id, 'inkrush_total_likes', true ) : 0,
        'totalInspires'=> $user_id ? (int) get_user_meta( $user_id, 'inkrush_inspires_received', true ) : 0,
        'followers'    => $user_id ? (int) get_user_meta( $user_id, 'inkrush_followers_count', true ) : 0,
        'following'    => $user_id ? (int) get_user_meta( $user_id, 'inkrush_following_count', true ) : 0,
        'userHandle'   => $user_id ? ( get_user_meta( $user_id, 'inkrush_handle', true ) ?: $user->user_login ) : '',
        'profileUserId' => (int) get_query_var( 'inkrush_user' )
            ? (function() {
                $handle = sanitize_text_field( get_query_var( 'inkrush_user' ) );
                $users  = get_users( [ 'meta_key' => 'inkrush_handle', 'meta_value' => $handle, 'number' => 1, 'fields' => 'ID' ] );
                return ! empty( $users ) ? (int) $users[0] : 0;
              })()
            : 0,
        'levelConfig'  => inkrush_get_level_config(),
        'logoutUrl'        => wp_logout_url( get_permalink() ?: home_url('/inkrush-app/') ),
        'registerUrl'      => wp_registration_url(),
        'isAdmin'          => current_user_can('manage_options'),
        'rollsUsedToday'   => $user_id ? (int) get_user_meta( $user_id, 'inkrush_daily_rolls_' . date('Y-m-d'), true ) : 0,
        'musicSrcs'        => (object) get_option( 'inkrush_music_srcs', [] ),
        'triesLimit'     => $user_id ? inkrush_get_tries_limit( $user_id ) : 3,
        'triesUsedToday' => $user_id ? inkrush_count_tries_today( $user_id ) : 0,
        'recaptchaSiteKey'   => get_option( 'inkrush_recaptcha_site_key', '' ),
        'vapidPublicKey'     => ( function_exists('inkrush_get_vapid_keys') ? ( inkrush_get_vapid_keys()['public'] ?? '' ) : '' ),
        'pushSwUrl'          => home_url( '/push-sw.js' ),
        'slotFlow'           => get_option( 'inkrush_slot_flow', 'classic' ),
    ] );

    // Enqueue reCAPTCHA script only when a site key is configured
    $site_key = get_option( 'inkrush_recaptcha_site_key', '' );
    if ( $site_key ) {
        wp_enqueue_script( 'google-recaptcha', 'https://www.google.com/recaptcha/api.js?render=explicit&onload=inkrushRecaptchaReady', [], null, true );
    }

    return '<div id="inkrush-root" style="min-height:100vh;background:#FFFDF3;"></div>';
} );

/* ──────────────────────────────────────────────────────────────
   5. PÁGINA AUTOMÁTICA
────────────────────────────────────────────────────────────── */

function inkrush_create_page() {
    if ( get_page_by_path( 'inkrush-app' ) ) return;
    $pid = wp_insert_post( [
        'post_title'   => 'InkRush',
        'post_name'    => 'inkrush-app',
        'post_content' => '[inkrush_app]',
        'post_status'  => 'publish',
        'post_type'    => 'page',
    ] );
    if ( $pid && ! is_wp_error( $pid ) ) {
        update_option( 'inkrush_page_id', $pid );
        update_post_meta( $pid, '_wp_page_template', 'inkrush-fullscreen' );
    }
}

add_filter( 'template_include', function( $tpl ) {
    if ( ! is_page() ) return $tpl;
    if ( get_post_meta( get_the_ID(), '_wp_page_template', true ) !== 'inkrush-fullscreen' ) return $tpl;
    $custom = INKRUSH_DIR . 'templates/fullscreen.php';
    return file_exists( $custom ) ? $custom : $tpl;
} );

/* ──────────────────────────────────────────────────────────────
   6. MENÚ ADMIN
────────────────────────────────────────────────────────────── */

add_action( 'admin_menu', function() {
    add_menu_page(
        'InkRush', 'InkRush 🎨', 'manage_options',
        'inkrush', 'inkrush_page_settings', 'dashicons-art', 30
    );
    add_submenu_page( 'inkrush', 'Configuración', 'Configuración', 'manage_options', 'inkrush',           'inkrush_page_settings' );
    add_submenu_page( 'inkrush', 'Variables',     'Variables',     'manage_options', 'inkrush-variables', 'inkrush_page_variables' );
    add_submenu_page( 'inkrush', 'Usuarios',      'Usuarios',      'manage_options', 'inkrush-users',     'inkrush_page_users' );
    add_submenu_page( 'inkrush', 'Música Pomodoro', '🎵 Música',         'manage_options', 'inkrush-music',  'inkrush_page_music' );
    add_submenu_page( 'inkrush', 'Notificaciones Push', '📣 Push',       'manage_options', 'inkrush-push',  'inkrush_page_push' );
    add_submenu_page( 'inkrush', 'Reportes',        '🚨 Reportes',       'manage_options', 'inkrush-reports', 'inkrush_page_reports' );
    add_submenu_page( 'inkrush', 'Analytics',       '📊 Analytics',      'manage_options', 'inkrush-analytics', 'inkrush_page_analytics' );
} );

/* ──────────────────────────────────────────────────────────────
   7. METABOX para obras en el admin de WP
────────────────────────────────────────────────────────────── */

add_action( 'add_meta_boxes', function() {
    add_meta_box(
        'inkrush_artwork_image', 'Imagen de la obra', 'inkrush_artwork_image_metabox',
        'inkrush_artwork', 'side', 'high'
    );
    add_meta_box(
        'inkrush_artwork_meta', 'Datos de la obra', 'inkrush_artwork_metabox',
        'inkrush_artwork', 'normal', 'default'
    );
} );

function inkrush_artwork_image_metabox( $post ) {
    $thumb_id  = get_post_thumbnail_id( $post->ID );
    $thumb_url = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'medium' ) : '';
    ?>
    <div id="inkrush-image-preview" style="text-align:center;margin-bottom:10px;">
        <?php if ( $thumb_url ) : ?>
            <img src="<?php echo esc_url( $thumb_url ); ?>"
                 style="max-width:100%;height:auto;border-radius:6px;border:1px solid #ddd;"
                 alt="Imagen de la obra">
        <?php else : ?>
            <div style="background:#f0f0f0;border:2px dashed #ccc;border-radius:6px;padding:32px 16px;color:#aaa;font-size:13px;">
                Sin imagen todavía
            </div>
        <?php endif; ?>
    </div>
    <div style="text-align:center;">
        <?php if ( $thumb_id ) : ?>
            <a href="<?php echo esc_url( get_edit_post_link( $thumb_id ) ); ?>"
               target="_blank"
               style="font-size:12px;color:#2271b1;">
                Ver en la biblioteca
            </a>
            &nbsp;·&nbsp;
        <?php endif; ?>
        <a href="#"
           id="inkrush-set-image"
           style="font-size:12px;color:#2271b1;">
            <?php echo $thumb_id ? 'Cambiar imagen' : 'Seleccionar imagen'; ?>
        </a>
        <?php if ( $thumb_id ) : ?>
            &nbsp;·&nbsp;
            <a href="#"
               id="inkrush-remove-image"
               style="font-size:12px;color:#b32d2e;">
                Quitar
            </a>
        <?php endif; ?>
    </div>
    <input type="hidden" id="inkrush-thumbnail-id" name="_thumbnail_id" value="<?php echo esc_attr( $thumb_id ?: -1 ); ?>">
    <script>
    (function($){
        var frame;
        $('#inkrush-set-image').on('click', function(e){
            e.preventDefault();
            if ( frame ) { frame.open(); return; }
            frame = wp.media({
                title: 'Seleccionar imagen de la obra',
                button: { text: 'Usar esta imagen' },
                multiple: false
            });
            frame.on('select', function(){
                var att = frame.state().get('selection').first().toJSON();
                $('#inkrush-thumbnail-id').val(att.id);
                var url = att.sizes && att.sizes.medium ? att.sizes.medium.url : att.url;
                $('#inkrush-image-preview').html('<img src="' + url + '" style="max-width:100%;height:auto;border-radius:6px;border:1px solid #ddd;" alt="Imagen de la obra">');
                $('#inkrush-set-image').text('Cambiar imagen');
                if ( !$('#inkrush-remove-image').length ) {
                    $('#inkrush-set-image').after(' &nbsp;·&nbsp; <a href="#" id="inkrush-remove-image" style="font-size:12px;color:#b32d2e;">Quitar</a>');
                    $('#inkrush-remove-image').on('click', removeImage);
                }
            });
            frame.open();
        });

        function removeImage(e){
            e.preventDefault();
            $('#inkrush-thumbnail-id').val(-1);
            $('#inkrush-image-preview').html('<div style="background:#f0f0f0;border:2px dashed #ccc;border-radius:6px;padding:32px 16px;color:#aaa;font-size:13px;">Sin imagen todavía</div>');
            $('#inkrush-set-image').text('Seleccionar imagen');
            $(this).remove();
        }

        $('#inkrush-remove-image').on('click', removeImage);
    }(jQuery));
    </script>
    <?php
}

function inkrush_artwork_metabox( $post ) {
    $fields = [
        'inkrush_technique'   => 'Técnica',
        'inkrush_variables'   => 'Variables (JSON)',
        'inkrush_params'      => 'Parámetros (JSON)',
        'inkrush_rarity'      => 'Rareza',
        'inkrush_likes'       => 'Likes',
        'inkrush_inspires'    => 'Inspiraciones',
        'inkrush_tries'       => 'Lo intentaré',
    ];
    foreach ( $fields as $key => $label ) {
        $val = get_post_meta( $post->ID, $key, true );
        echo '<p><strong>' . esc_html( $label ) . ':</strong> ';
        echo '<input name="' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '" style="width:60%;border:1px solid #ccc;padding:4px 8px;border-radius:4px;">';
        echo '</p>';
    }
    wp_nonce_field( 'inkrush_artwork_meta', 'inkrush_meta_nonce' );
}

add_action( 'save_post_inkrush_artwork', function( $post_id ) {
    if ( ! isset( $_POST['inkrush_meta_nonce'] ) ) return;
    if ( ! wp_verify_nonce( $_POST['inkrush_meta_nonce'], 'inkrush_artwork_meta' ) ) return;
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;

    $fields = [ 'inkrush_technique','inkrush_variables','inkrush_params','inkrush_rarity','inkrush_likes','inkrush_inspires','inkrush_tries' ];
    foreach ( $fields as $f ) {
        if ( isset( $_POST[ $f ] ) ) {
            update_post_meta( $post_id, $f, sanitize_text_field( $_POST[ $f ] ) );
        }
    }

    // Sync featured image from our custom meta box
    if ( isset( $_POST['_thumbnail_id'] ) ) {
        $thumb_id = intval( $_POST['_thumbnail_id'] );
        if ( $thumb_id > 0 ) {
            set_post_thumbnail( $post_id, $thumb_id );
        } else {
            delete_post_thumbnail( $post_id );
        }
    }
} );

/* ──────────────────────────────────────────────────────────────
   6. PERFIL DE USUARIO EN WP-ADMIN
   Muestra y permite editar los datos de InkRush desde
   /wp-admin/user-edit.php y /wp-admin/profile.php
────────────────────────────────────────────────────────────── */

function inkrush_user_profile_fields( WP_User $user ) {
    $uid        = $user->ID;
    $handle     = get_user_meta( $uid, 'inkrush_handle',               true ) ?: '';
    $bio        = get_user_meta( $uid, 'inkrush_bio',                  true ) ?: '';
    $avatar_url = get_user_meta( $uid, 'inkrush_avatar_url',           true ) ?: '';
    $level      = (int) get_user_meta( $uid, 'inkrush_level',          true ) ?: 1;
    $challenges = (int) get_user_meta( $uid, 'inkrush_challenges_completed', true );
    $streak     = (int) get_user_meta( $uid, 'inkrush_streak',         true );
    $followers  = (int) get_user_meta( $uid, 'inkrush_followers_count',true );
    $following  = (int) get_user_meta( $uid, 'inkrush_following_count',true );
    $likes      = (int) get_user_meta( $uid, 'inkrush_total_likes',    true );
    $inspires   = (int) get_user_meta( $uid, 'inkrush_inspires_received', true );
    $socials    = get_user_meta( $uid, 'inkrush_socials', true ) ?: [ 'instagram' => '', 'tiktok' => '', 'pinterest' => '' ];
    $base       = get_option( 'inkrush_profile_base', 'artista' );
    $share_link = $handle ? home_url( "/{$base}/{$handle}" ) : '—';
    wp_nonce_field( 'inkrush_save_user_meta', 'inkrush_user_nonce' );
    ?>
    <h2 style="border-top:1px solid #ddd;padding-top:20px;margin-top:20px">InkRush</h2>
    <table class="form-table" role="presentation">

      <tr>
        <th><label for="inkrush_handle">Handle</label></th>
        <td>
          <input type="text" id="inkrush_handle" name="inkrush_handle"
                 value="<?php echo esc_attr( $handle ); ?>"
                 class="regular-text" placeholder="mi_handle" pattern="[a-z0-9_]{3,20}"/>
          <p class="description">Solo minúsculas, números y guión bajo. 3–20 caracteres.<br>
          URL del perfil: <strong><?php echo esc_html( $share_link ); ?></strong></p>
        </td>
      </tr>

      <tr>
        <th><label for="inkrush_bio">Bio</label></th>
        <td>
          <textarea id="inkrush_bio" name="inkrush_bio" rows="3" class="large-text"><?php echo esc_textarea( $bio ); ?></textarea>
        </td>
      </tr>

      <tr>
        <th>Avatar URL</th>
        <td>
          <?php if ( $avatar_url ) : ?>
            <img src="<?php echo esc_url( $avatar_url ); ?>" style="width:64px;height:64px;object-fit:cover;border-radius:50%;border:2px solid #ccc;" /><br>
          <?php endif; ?>
          <input type="url" name="inkrush_avatar_url" value="<?php echo esc_attr( $avatar_url ); ?>" class="large-text" placeholder="https://..."/>
          <p class="description">Se actualiza automáticamente cuando el usuario sube foto desde la app.</p>
        </td>
      </tr>

      <tr>
        <th>Redes sociales</th>
        <td>
          <p><label>Instagram &nbsp;<input type="text" name="inkrush_socials[instagram]" value="<?php echo esc_attr( $socials['instagram'] ?? '' ); ?>" placeholder="sin @" class="regular-text"/></label></p>
          <p><label>TikTok &nbsp;&nbsp;&nbsp;&nbsp;<input type="text" name="inkrush_socials[tiktok]"    value="<?php echo esc_attr( $socials['tiktok']    ?? '' ); ?>" placeholder="sin @" class="regular-text"/></label></p>
          <p><label>Pinterest &nbsp;<input type="text" name="inkrush_socials[pinterest]" value="<?php echo esc_attr( $socials['pinterest'] ?? '' ); ?>" placeholder="sin @" class="regular-text"/></label></p>
        </td>
      </tr>

      <tr>
        <th>Estadísticas</th>
        <td>
          <table style="border-collapse:collapse;font-size:13px">
            <tr>
              <td style="padding:4px 16px 4px 0;color:#666">Nivel</td>
              <td style="padding:4px 16px 4px 0;font-weight:600"><?php echo (int) $level; ?></td>
              <td style="padding:4px 16px 4px 0;color:#666">Retos completados</td>
              <td style="font-weight:600"><?php echo $challenges; ?></td>
            </tr>
            <tr>
              <td style="padding:4px 16px 4px 0;color:#666">Racha actual</td>
              <td style="padding:4px 16px 4px 0;font-weight:600"><?php echo $streak; ?> días</td>
              <td style="padding:4px 16px 4px 0;color:#666">Seguidores / Siguiendo</td>
              <td style="font-weight:600"><?php echo $followers; ?> / <?php echo $following; ?></td>
            </tr>
            <tr>
              <td style="padding:4px 16px 4px 0;color:#666">Likes recibidos</td>
              <td style="padding:4px 16px 4px 0;font-weight:600"><?php echo $likes; ?></td>
              <td style="padding:4px 16px 4px 0;color:#666">Inspiras recibidas</td>
              <td style="font-weight:600"><?php echo $inspires; ?></td>
            </tr>
          </table>
          <p class="description" style="margin-top:8px">Estos valores los gestiona la app automáticamente.</p>

          <p style="margin-top:12px">
            <label>Retos completados (ajuste manual) &nbsp;
              <input type="number" name="inkrush_challenges_completed" value="<?php echo $challenges; ?>" min="0" style="width:80px"/>
            </label>
          </p>
        </td>
      </tr>

    </table>

    <?php
    /* ── Obras publicadas por este usuario ── */
    $artworks = get_posts( [
        'post_type'      => 'inkrush_artwork',
        'author'         => $uid,
        'posts_per_page' => -1,
        'post_status'    => [ 'publish', 'private', 'draft' ],
        'orderby'        => 'date',
        'order'          => 'DESC',
    ] );
    ?>
    <h3 style="margin-top:20px">Obras publicadas (<?php echo count( $artworks ); ?>)</h3>
    <?php if ( empty( $artworks ) ) : ?>
        <p style="color:#666;font-size:13px">Este usuario no ha publicado obras todavía.</p>
    <?php else : ?>
        <table class="widefat fixed striped" style="margin-top:8px;font-size:12px">
          <thead>
            <tr>
              <th style="width:50px">ID</th>
              <th>Reto / Prompt</th>
              <th style="width:90px">Técnica</th>
              <th style="width:70px">Rareza</th>
              <th style="width:60px">Likes</th>
              <th style="width:100px">Fecha</th>
              <th style="width:60px">Estado</th>
              <th style="width:60px">Acción</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ( $artworks as $aw ) :
                $technique = get_post_meta( $aw->ID, 'inkrush_technique', true ) ?: '—';
                $rarity    = get_post_meta( $aw->ID, 'inkrush_rarity',    true ) ?: '—';
                $likes     = (int) get_post_meta( $aw->ID, 'inkrush_likes', true );
                $status_label = [ 'publish' => '✅ Público', 'private' => '🔒 Privado', 'draft' => '📝 Borrador' ][ $aw->post_status ] ?? $aw->post_status;
            ?>
            <tr>
              <td><strong>#<?php echo $aw->ID; ?></strong></td>
              <td style="word-break:break-word"><?php echo esc_html( $aw->post_title ?: '(sin título)' ); ?></td>
              <td><?php echo esc_html( $technique ); ?></td>
              <td><?php echo esc_html( $rarity ); ?></td>
              <td><?php echo $likes; ?></td>
              <td><?php echo get_the_date( 'd/m/Y', $aw ); ?></td>
              <td><?php echo $status_label; ?></td>
              <td><a href="<?php echo get_edit_post_link( $aw->ID ); ?>">Editar</a></td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
    <?php endif; ?>
    <?php
}
add_action( 'show_user_profile', 'inkrush_user_profile_fields' );
add_action( 'edit_user_profile', 'inkrush_user_profile_fields' );

function inkrush_save_user_profile_fields( $uid ) {
    if ( ! current_user_can( 'edit_user', $uid ) ) return;
    if ( ! isset( $_POST['inkrush_user_nonce'] ) || ! wp_verify_nonce( $_POST['inkrush_user_nonce'], 'inkrush_save_user_meta' ) ) return;

    /* Handle — validate format */
    if ( isset( $_POST['inkrush_handle'] ) ) {
        $handle = strtolower( sanitize_text_field( $_POST['inkrush_handle'] ) );
        if ( preg_match( '/^[a-z0-9_]{3,20}$/', $handle ) ) {
            $taken = get_users( [ 'meta_key' => 'inkrush_handle', 'meta_value' => $handle, 'number' => 1, 'fields' => 'ID', 'exclude' => [ $uid ] ] );
            if ( empty( $taken ) ) {
                update_user_meta( $uid, 'inkrush_handle', $handle );
            }
        }
    }

    if ( isset( $_POST['inkrush_bio'] ) ) {
        update_user_meta( $uid, 'inkrush_bio', sanitize_textarea_field( $_POST['inkrush_bio'] ) );
    }

    if ( isset( $_POST['inkrush_avatar_url'] ) ) {
        update_user_meta( $uid, 'inkrush_avatar_url', esc_url_raw( $_POST['inkrush_avatar_url'] ) );
    }

    if ( isset( $_POST['inkrush_socials'] ) && is_array( $_POST['inkrush_socials'] ) ) {
        $socials = array_map( 'sanitize_text_field', $_POST['inkrush_socials'] );
        update_user_meta( $uid, 'inkrush_socials', $socials );
    }

    if ( isset( $_POST['inkrush_challenges_completed'] ) && current_user_can( 'manage_options' ) ) {
        $challenges = max( 0, (int) $_POST['inkrush_challenges_completed'] );
        update_user_meta( $uid, 'inkrush_challenges_completed', $challenges );
        inkrush_update_user_level( $uid );
    }
}
add_action( 'personal_options_update',  'inkrush_save_user_profile_fields' );
add_action( 'edit_user_profile_update', 'inkrush_save_user_profile_fields' );

/* ── Intentos diarios: helpers compartidos ── */
function inkrush_count_tries_today( $user_id ) {
    global $wpdb;
    $table = $wpdb->prefix . 'inkrush_tries_log';
    $today = ( new DateTime( 'now', wp_timezone() ) )->format( 'Y-m-d' );
    return (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM {$table} WHERE user_id = %d AND try_date = %s",
        (int) $user_id, $today
    ) );
}

function inkrush_cleanup_old_tries() {
    global $wpdb;
    $table   = $wpdb->prefix . 'inkrush_tries_log';
    $cutoff  = ( new DateTime( 'now', wp_timezone() ) )->modify( '-2 days' )->format( 'Y-m-d' );
    $wpdb->query( $wpdb->prepare( "DELETE FROM {$table} WHERE try_date < %s", $cutoff ) );
}
