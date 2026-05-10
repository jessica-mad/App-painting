<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'rest_api_init', 'inkrush_register_routes' );

function inkrush_register_routes() {

    /* GET /inkrush/v1/parameters */
    register_rest_route( 'inkrush/v1', '/parameters', [
        'methods'             => 'GET',
        'callback'            => 'inkrush_api_list_parameters',
        'permission_callback' => '__return_true',
        'args' => [
            'category' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
            'rarity'   => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
            'season'   => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
        ],
    ] );

    /* POST /inkrush/v1/parameters  (solo admins) */
    register_rest_route( 'inkrush/v1', '/parameters', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_create_parameter',
        'permission_callback' => fn() => current_user_can( 'manage_options' ),
    ] );

    /* DELETE /inkrush/v1/parameters/{id} */
    register_rest_route( 'inkrush/v1', '/parameters/(?P<id>[a-f0-9]+)', [
        'methods'             => 'DELETE',
        'callback'            => 'inkrush_api_delete_parameter',
        'permission_callback' => fn() => current_user_can( 'manage_options' ),
    ] );

    /* GET /inkrush/v1/season */
    register_rest_route( 'inkrush/v1', '/season', [
        'methods'             => 'GET',
        'callback'            => fn() => rest_ensure_response( [
            'season'  => get_option( 'inkrush_active_season', '' ),
            'rolls'   => (int) get_option( 'inkrush_rolls_per_day', 3 ),
            'params'  => (int) get_option( 'inkrush_max_params', 3 ),
        ] ),
        'permission_callback' => '__return_true',
    ] );

    /* POST /inkrush/v1/challenge/complete  — marcar reto completado */
    register_rest_route( 'inkrush/v1', '/challenge/complete', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_complete_challenge',
        'permission_callback' => 'is_user_logged_in',
    ] );
}

/* ── Listar variables ── */
function inkrush_api_list_parameters( WP_REST_Request $req ) {
    $vars     = inkrush_get_variables();
    $category = $req->get_param( 'category' );
    $rarity   = $req->get_param( 'rarity' );
    $season   = $req->get_param( 'season' );
    $active   = get_option( 'inkrush_active_season', '' );

    $filtered = array_values( array_filter( $vars, function( $v ) use ( $category, $rarity, $season, $active ) {
        if ( $category && $v['category'] !== $category ) return false;
        if ( $rarity   && $v['rarity']   !== $rarity )   return false;
        // Si se pasa season=active, solo devolver las de la temporada activa + las sin temporada
        if ( $season === 'active' ) {
            if ( $v['season'] && $v['season'] !== $active ) return false;
        } elseif ( $season ) {
            if ( $v['season'] !== $season ) return false;
        }
        return true;
    } ) );

    return rest_ensure_response( [
        'success'        => true,
        'active_season'  => $active,
        'total'          => count( $filtered ),
        'parameters'     => $filtered,
    ] );
}

/* ── Crear variable ── */
function inkrush_api_create_parameter( WP_REST_Request $req ) {
    $value    = sanitize_text_field( $req->get_param( 'value' ) );
    $category = sanitize_text_field( $req->get_param( 'category' ) );
    $rarity   = sanitize_text_field( $req->get_param( 'rarity' ) );
    $season   = sanitize_text_field( $req->get_param( 'season' ) ?? '' );

    $allowed_rarities   = [ 'Común', 'Raro', 'Épico', 'Legendario' ];
    $allowed_categories = [ 'Lugares', 'Emociones', 'Personajes', 'Objetos', 'Animales', 'Acciones', 'Eventos' ];

    if ( ! $value || ! $category ) {
        return new WP_Error( 'missing', 'value y category son obligatorios.', [ 'status' => 400 ] );
    }
    if ( ! in_array( $rarity, $allowed_rarities, true ) ) {
        return new WP_Error( 'invalid_rarity', 'Rareza no válida.', [ 'status' => 400 ] );
    }
    if ( ! in_array( $category, $allowed_categories, true ) ) {
        return new WP_Error( 'invalid_category', 'Categoría no válida.', [ 'status' => 400 ] );
    }

    $vars  = inkrush_get_variables();
    $new   = [ 'id' => inkrush_uid(), 'category' => $category, 'value' => strtolower( $value ), 'rarity' => $rarity, 'season' => $season ];
    $vars[] = $new;
    inkrush_save_variables( $vars );

    return rest_ensure_response( [ 'success' => true, 'variable' => $new ] );
}

/* ── Eliminar variable ── */
function inkrush_api_delete_parameter( WP_REST_Request $req ) {
    $id   = sanitize_text_field( $req->get_param( 'id' ) );
    $vars = inkrush_get_variables();
    $vars = array_values( array_filter( $vars, fn( $v ) => $v['id'] !== $id ) );
    inkrush_save_variables( $vars );
    return rest_ensure_response( [ 'success' => true ] );
}

/* ── Completar reto ── */
function inkrush_api_complete_challenge( WP_REST_Request $req ) {
    $uid        = get_current_user_id();
    $challenges = (int) get_user_meta( $uid, 'inkrush_challenges_completed', true );

    update_user_meta( $uid, 'inkrush_challenges_completed', $challenges + 1 );
    $new_level = inkrush_update_user_level( $uid );

    // Actualizar racha (simplificado — en producción comparar con fecha del último reto)
    $streak = (int) get_user_meta( $uid, 'inkrush_streak', true );
    update_user_meta( $uid, 'inkrush_streak', $streak + 1 );

    return rest_ensure_response( [
        'success'    => true,
        'challenges' => $challenges + 1,
        'level'      => $new_level,
        'streak'     => $streak + 1,
    ] );
}
