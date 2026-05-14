<?php
/**
 * Plugin Name: InkRush App
 * Plugin URI:  https://inkrush.app
 * Description: App de retos creativos para ilustradores. Shortcode: [inkrush_app]
 * Version:     1.2.0
 * Author:      InkRush
 * License:     GPL-2.0+
 * Text Domain: inkrush-app
 * GitHub Plugin URI: jessica-mad/App-painting
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'INKRUSH_VERSION', '1.2.0' );
define( 'INKRUSH_DIR',     plugin_dir_path( __FILE__ ) );
define( 'INKRUSH_URL',     plugin_dir_url( __FILE__ ) );

require_once INKRUSH_DIR . 'admin/variables.php';
require_once INKRUSH_DIR . 'admin/users.php';
require_once INKRUSH_DIR . 'admin/settings.php';
require_once INKRUSH_DIR . 'admin/music.php';
require_once INKRUSH_DIR . 'admin/reports.php';
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
    flush_rewrite_rules();
}

register_deactivation_hook( __FILE__, function() {
    remove_role( 'ilustrador' );
    flush_rewrite_rules();
} );

/* ──────────────────────────────────────────────────────────────
   2. CUSTOM POST TYPE — inkrush_artwork
────────────────────────────────────────────────────────────── */

add_action( 'init', 'inkrush_register_cpt' );

/* ── URL bonitas de perfil: /{base}/{handle} ── */
add_action( 'init', function () {
    $base = get_option( 'inkrush_profile_base', 'artista' );
    if ( ! $base ) return;
    add_rewrite_tag( '%inkrush_user%', '([^/]+)' );
    add_rewrite_rule(
        '^' . preg_quote( $base, '#' ) . '/([^/]+)/?$',
        'index.php?pagename=inkrush-app&inkrush_user=$matches[1]',
        'top'
    );
} );
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
        'profileBase'  => get_option( 'inkrush_profile_base', 'artista' ),
        'shareLink'    => $user_id ? home_url( '/' . get_option( 'inkrush_profile_base', 'artista' ) . '/' . ( get_user_meta( $user_id, 'inkrush_handle', true ) ?: $user->user_login ) ) : '',
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
        'triesLimit'       => $user_id ? inkrush_get_tries_limit( $user_id ) : 3,
        'triesUsedToday'     => $user_id ? (int) get_user_meta( $user_id, 'inkrush_daily_tries_' . ( new DateTime( 'now', wp_timezone() ) )->format( 'Y-m-d' ), true ) : 0,
        'recaptchaSiteKey'   => get_option( 'inkrush_recaptcha_site_key', '' ),
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
    add_submenu_page( 'inkrush', 'Música Pomodoro', '🎵 Música',   'manage_options', 'inkrush-music',     'inkrush_page_music' );
    add_submenu_page( 'inkrush', 'Reportes',        '🚨 Reportes', 'manage_options', 'inkrush-reports',   'inkrush_page_reports' );
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
