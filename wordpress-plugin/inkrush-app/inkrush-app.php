<?php
/**
 * Plugin Name: InkRush App
 * Plugin URI:  https://inkrush.app
 * Description: Prototipo interactivo InkRush — app de retos creativos para ilustradores. Usa el shortcode [inkrush_app] en cualquier página.
 * Version:     1.0.0
 * Author:      InkRush
 * License:     GPL-2.0+
 * Text Domain: inkrush-app
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'INKRUSH_VERSION', '1.0.0' );
define( 'INKRUSH_DIR', plugin_dir_path( __FILE__ ) );
define( 'INKRUSH_URL', plugin_dir_url( __FILE__ ) );

// ─── 1. Shortcode [inkrush_app] ───────────────────────────────────────────────

function inkrush_render_app( $atts ) {
    $atts = shortcode_atts( [
        'height' => '100vh',
    ], $atts, 'inkrush_app' );

    wp_enqueue_style(
        'inkrush-app',
        INKRUSH_URL . 'assets/app.css',
        [],
        INKRUSH_VERSION
    );

    wp_enqueue_script(
        'inkrush-app',
        INKRUSH_URL . 'assets/app.js',
        [],
        INKRUSH_VERSION,
        true  // cargar en el footer
    );

    $height = esc_attr( $atts['height'] );

    return sprintf(
        '<div id="root" style="min-height:%s; background:#DFFF23;"></div>',
        $height
    );
}
add_shortcode( 'inkrush_app', 'inkrush_render_app' );

// ─── 2. Crear página automáticamente al activar el plugin ────────────────────

register_activation_hook( __FILE__, 'inkrush_create_page' );

function inkrush_create_page() {
    // Evitar duplicados
    $existing = get_page_by_path( 'inkrush' );
    if ( $existing ) {
        return;
    }

    $page_id = wp_insert_post( [
        'post_title'   => 'InkRush App',
        'post_name'    => 'inkrush',
        'post_content' => '[inkrush_app]',
        'post_status'  => 'publish',
        'post_type'    => 'page',
        'page_template' => 'inkrush-fullscreen.php',
    ] );

    if ( $page_id && ! is_wp_error( $page_id ) ) {
        update_option( 'inkrush_page_id', $page_id );
    }
}

// ─── 3. Template de página fullscreen (sin cabecera/footer de WP) ────────────

add_filter( 'theme_page_templates', 'inkrush_add_template' );

function inkrush_add_template( $templates ) {
    $templates['inkrush-fullscreen.php'] = 'InkRush Fullscreen';
    return $templates;
}

add_filter( 'template_include', 'inkrush_load_template' );

function inkrush_load_template( $template ) {
    if ( is_page() ) {
        $meta = get_post_meta( get_the_ID(), '_wp_page_template', true );
        if ( 'inkrush-fullscreen.php' === $meta ) {
            $custom = INKRUSH_DIR . 'templates/inkrush-fullscreen.php';
            if ( file_exists( $custom ) ) {
                return $custom;
            }
        }
    }
    return $template;
}

// ─── 4. Registrar rol "Ilustrador" ───────────────────────────────────────────

register_activation_hook( __FILE__, 'inkrush_register_roles' );

function inkrush_register_roles() {
    // Clonar capacidades básicas del suscriptor
    $subscriber = get_role( 'subscriber' );
    $caps = $subscriber ? $subscriber->capabilities : [ 'read' => true ];

    // Capacidades específicas de InkRush
    $inkrush_caps = array_merge( $caps, [
        'inkrush_generate_challenge' => true,
        'inkrush_upload_artwork'     => true,
        'inkrush_react_to_posts'     => true,
        'inkrush_view_feed'          => true,
    ] );

    add_role(
        'ilustrador',
        'Ilustrador',
        $inkrush_caps
    );
}

register_deactivation_hook( __FILE__, 'inkrush_remove_roles' );

function inkrush_remove_roles() {
    remove_role( 'ilustrador' );
}

// ─── 5. Asignar rol "Ilustrador" a nuevos registros ──────────────────────────

add_action( 'user_register', 'inkrush_assign_ilustrador_role' );

function inkrush_assign_ilustrador_role( $user_id ) {
    $user = new WP_User( $user_id );
    $user->set_role( 'ilustrador' );
}

// ─── 6. REST API — Parámetros/Variables de dibujo ────────────────────────────

add_action( 'rest_api_init', 'inkrush_register_api_routes' );

function inkrush_register_api_routes() {
    // GET /wp-json/inkrush/v1/parameters
    register_rest_route( 'inkrush/v1', '/parameters', [
        'methods'             => 'GET',
        'callback'            => 'inkrush_api_get_parameters',
        'permission_callback' => '__return_true', // público para la app
    ] );

    // GET /wp-json/inkrush/v1/parameters?category=Lugares&rarity=Epico
    // POST /wp-json/inkrush/v1/parameters  (solo admin)
    register_rest_route( 'inkrush/v1', '/parameters', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_create_parameter',
        'permission_callback' => function() {
            return current_user_can( 'manage_options' );
        },
    ] );

    // GET /wp-json/inkrush/v1/season
    register_rest_route( 'inkrush/v1', '/season', [
        'methods'             => 'GET',
        'callback'            => 'inkrush_api_get_season',
        'permission_callback' => '__return_true',
    ] );
}

function inkrush_api_get_parameters( WP_REST_Request $request ) {
    $category = sanitize_text_field( $request->get_param( 'category' ) );
    $rarity   = sanitize_text_field( $request->get_param( 'rarity' ) );
    $season   = get_option( 'inkrush_active_season', '' );

    // En el futuro estos vendrían de un Custom Post Type.
    // Por ahora devolvemos un ejemplo demostrativo.
    $sample = [
        [ 'value' => 'bosque oscuro',     'rarity' => 'Común',     'category' => 'Lugares',   'season' => '' ],
        [ 'value' => 'ciudad cyberpunk',  'rarity' => 'Épico',     'category' => 'Lugares',   'season' => '' ],
        [ 'value' => 'melancolía',        'rarity' => 'Común',     'category' => 'Emociones', 'season' => '' ],
        [ 'value' => 'campo de cerezos',  'rarity' => 'Épico',     'category' => 'Lugares',   'season' => 'Primavera' ],
        [ 'value' => 'fénix',             'rarity' => 'Legendario','category' => 'Animales',  'season' => '' ],
    ];

    // Filtrar por categoría si se pide
    if ( $category ) {
        $sample = array_values( array_filter( $sample, fn( $v ) => $v['category'] === $category ) );
    }
    // Filtrar por rareza si se pide
    if ( $rarity ) {
        $sample = array_values( array_filter( $sample, fn( $v ) => $v['rarity'] === $rarity ) );
    }

    return rest_ensure_response( [
        'success'       => true,
        'active_season' => $season,
        'count'         => count( $sample ),
        'parameters'    => $sample,
    ] );
}

function inkrush_api_create_parameter( WP_REST_Request $request ) {
    $value    = sanitize_text_field( $request->get_param( 'value' ) );
    $rarity   = sanitize_text_field( $request->get_param( 'rarity' ) );
    $category = sanitize_text_field( $request->get_param( 'category' ) );
    $season   = sanitize_text_field( $request->get_param( 'season' ) );

    if ( empty( $value ) || empty( $rarity ) || empty( $category ) ) {
        return new WP_Error( 'missing_fields', 'value, rarity y category son obligatorios.', [ 'status' => 400 ] );
    }

    // Aquí se guardaría como Custom Post Type inkrush_variable.
    // Demo: devolvemos el objeto que se crearía.
    return rest_ensure_response( [
        'success'  => true,
        'message'  => 'Variable creada (demo — implementar CPT en producción).',
        'variable' => compact( 'value', 'rarity', 'category', 'season' ),
    ] );
}

function inkrush_api_get_season() {
    return rest_ensure_response( [
        'active_season' => get_option( 'inkrush_active_season', '' ),
    ] );
}

// ─── 7. Página de ajustes en el admin de WP ──────────────────────────────────

add_action( 'admin_menu', 'inkrush_admin_menu' );

function inkrush_admin_menu() {
    add_menu_page(
        'InkRush',
        'InkRush',
        'manage_options',
        'inkrush-settings',
        'inkrush_settings_page',
        'dashicons-art',
        30
    );
}

function inkrush_settings_page() {
    if ( isset( $_POST['inkrush_save'] ) && check_admin_referer( 'inkrush_settings' ) ) {
        update_option( 'inkrush_active_season', sanitize_text_field( $_POST['active_season'] ) );
        echo '<div class="notice notice-success"><p>✅ Ajustes guardados.</p></div>';
    }

    $current_season = get_option( 'inkrush_active_season', '' );
    $seasons = [ '', 'Primavera', 'Verano', 'Otoño', 'Invierno', 'Halloween', 'Navidad', 'San Valentín' ];
    $page_id = get_option( 'inkrush_page_id' );
    $page_url = $page_id ? get_permalink( $page_id ) : '';
    ?>
    <div class="wrap">
        <h1>🎨 InkRush — Panel de Control</h1>

        <div style="background:#DFFF23;border:3px solid #111;border-radius:12px;padding:16px 20px;margin:20px 0;max-width:600px;">
            <strong>🔗 URL de la app:</strong><br>
            <?php if ( $page_url ) : ?>
                <a href="<?php echo esc_url( $page_url ); ?>" target="_blank"><?php echo esc_url( $page_url ); ?></a>
                <br><small>También puedes usar el shortcode <code>[inkrush_app]</code> en cualquier página.</small>
            <?php else : ?>
                <span style="color:red;">La página no se creó automáticamente. Crea una página nueva y agrega el shortcode <code>[inkrush_app]</code>.</span>
            <?php endif; ?>
        </div>

        <h2>Temporada activa</h2>
        <form method="post">
            <?php wp_nonce_field( 'inkrush_settings' ); ?>
            <table class="form-table">
                <tr>
                    <th><label for="active_season">Temporada / Evento</label></th>
                    <td>
                        <select name="active_season" id="active_season">
                            <?php foreach ( $seasons as $s ) : ?>
                                <option value="<?php echo esc_attr( $s ); ?>" <?php selected( $current_season, $s ); ?>>
                                    <?php echo $s ?: '— Sin temporada especial —'; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description">
                            Al activar una temporada, las variables etiquetadas con ella aparecen con mayor probabilidad en el Randometro.
                        </p>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <input type="submit" name="inkrush_save" class="button-primary" value="Guardar temporada">
            </p>
        </form>

        <h2>API REST</h2>
        <table class="widefat" style="max-width:600px;">
            <thead><tr><th>Endpoint</th><th>Descripción</th></tr></thead>
            <tbody>
                <tr><td><code>GET /wp-json/inkrush/v1/parameters</code></td><td>Lista de variables de dibujo</td></tr>
                <tr><td><code>GET /wp-json/inkrush/v1/parameters?category=Lugares</code></td><td>Filtrar por categoría</td></tr>
                <tr><td><code>GET /wp-json/inkrush/v1/parameters?rarity=Legendario</code></td><td>Filtrar por rareza</td></tr>
                <tr><td><code>POST /wp-json/inkrush/v1/parameters</code></td><td>Crear variable (solo admins)</td></tr>
                <tr><td><code>GET /wp-json/inkrush/v1/season</code></td><td>Temporada activa actual</td></tr>
            </tbody>
        </table>

        <h2>Roles</h2>
        <p>Los nuevos registros reciben automáticamente el rol <strong>Ilustrador</strong>.</p>
        <p>Para niveles premium, instala <strong>WooCommerce Memberships</strong> y crea planes para los niveles 2-5.</p>
    </div>
    <?php
}

// ─── 8. Estilos mínimos para que la app ocupe toda la pantalla ───────────────

add_action( 'wp_head', 'inkrush_fullscreen_styles' );

function inkrush_fullscreen_styles() {
    // Solo en páginas que usen el shortcode
    global $post;
    if ( $post && has_shortcode( $post->post_content, 'inkrush_app' ) ) {
        echo '<style>
            body.page #root { margin: 0; padding: 0; }
            /* Ocultar cabecera/footer del tema en la página de la app si lo deseas */
            /* body.page-id-' . intval( get_option( 'inkrush_page_id' ) ) . ' .site-header,
            body.page-id-' . intval( get_option( 'inkrush_page_id' ) ) . ' .site-footer { display:none; } */
        </style>' . PHP_EOL;
    }
}
