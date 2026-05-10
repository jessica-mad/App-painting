<?php
/**
 * Plugin Name: InkRush App
 * Plugin URI:  https://inkrush.app
 * Description: App de retos creativos para ilustradores. Shortcode: [inkrush_app]
 * Version:     1.1.0
 * Author:      InkRush
 * License:     GPL-2.0+
 * Text Domain: inkrush-app
 * GitHub Plugin URI: jessica-mad/App-painting
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'INKRUSH_VERSION', '1.1.0' );
define( 'INKRUSH_DIR',     plugin_dir_path( __FILE__ ) );
define( 'INKRUSH_URL',     plugin_dir_url( __FILE__ ) );

require_once INKRUSH_DIR . 'admin/variables.php';
require_once INKRUSH_DIR . 'admin/users.php';
require_once INKRUSH_DIR . 'admin/settings.php';
require_once INKRUSH_DIR . 'admin/api.php';

/* ──────────────────────────────────────────────────────────────
   1. ACTIVACIÓN / DESACTIVACIÓN
────────────────────────────────────────────────────────────── */

register_activation_hook( __FILE__, 'inkrush_activate' );
function inkrush_activate() {
    inkrush_register_roles();
    inkrush_create_page();
    inkrush_seed_default_variables();
    flush_rewrite_rules();
}

register_deactivation_hook( __FILE__, 'inkrush_deactivate' );
function inkrush_deactivate() {
    remove_role( 'ilustrador' );
    flush_rewrite_rules();
}

/* ──────────────────────────────────────────────────────────────
   2. ROLES
────────────────────────────────────────────────────────────── */

function inkrush_register_roles() {
    if ( get_role( 'ilustrador' ) ) return;
    $sub = get_role( 'subscriber' );
    $caps = $sub ? $sub->capabilities : [ 'read' => true ];
    add_role( 'ilustrador', 'Ilustrador', array_merge( $caps, [
        'inkrush_generate_challenge' => true,
        'inkrush_upload_artwork'     => true,
        'inkrush_react_to_posts'     => true,
    ] ) );
}

/* Asignar rol al registrarse */
add_action( 'user_register', function( $uid ) {
    ( new WP_User( $uid ) )->set_role( 'ilustrador' );
} );

/* ──────────────────────────────────────────────────────────────
   3. SHORTCODE [inkrush_app]
────────────────────────────────────────────────────────────── */

add_shortcode( 'inkrush_app', function() {
    wp_enqueue_style(  'inkrush-app', INKRUSH_URL . 'plugin-assets/app.css', [], INKRUSH_VERSION );
    wp_enqueue_script( 'inkrush-app', INKRUSH_URL . 'plugin-assets/app.js',  [], INKRUSH_VERSION, true );

    /* Pasamos la configuración de WP a la app React */
    wp_localize_script( 'inkrush-app', 'InkRushConfig', [
        'apiUrl'        => esc_url( rest_url( 'inkrush/v1' ) ),
        'nonce'         => wp_create_nonce( 'wp_rest' ),
        'activeSeason'  => get_option( 'inkrush_active_season', '' ),
        'userId'        => get_current_user_id(),
        'levelConfig'   => inkrush_get_level_config(),
    ] );

    return '<div id="inkrush-root" style="min-height:100vh;background:#DFFF23;"></div>';
} );

/* ──────────────────────────────────────────────────────────────
   4. PÁGINA AUTOMÁTICA AL ACTIVAR
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

/* Template fullscreen */
add_filter( 'template_include', function( $tpl ) {
    if ( ! is_page() ) return $tpl;
    if ( get_post_meta( get_the_ID(), '_wp_page_template', true ) !== 'inkrush-fullscreen' ) return $tpl;
    $custom = INKRUSH_DIR . 'templates/fullscreen.php';
    return file_exists( $custom ) ? $custom : $tpl;
} );

/* ──────────────────────────────────────────────────────────────
   5. MENÚ ADMIN
────────────────────────────────────────────────────────────── */

add_action( 'admin_menu', function() {
    add_menu_page( 'InkRush', 'InkRush 🎨', 'manage_options',
        'inkrush', 'inkrush_page_settings', 'dashicons-art', 30 );

    add_submenu_page( 'inkrush', 'Configuración',  'Configuración',  'manage_options', 'inkrush',            'inkrush_page_settings' );
    add_submenu_page( 'inkrush', 'Variables',       'Variables',      'manage_options', 'inkrush-variables',  'inkrush_page_variables' );
    add_submenu_page( 'inkrush', 'Usuarios',        'Usuarios',       'manage_options', 'inkrush-users',      'inkrush_page_users' );
} );
