<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'rest_api_init', 'inkrush_register_routes' );

function inkrush_register_routes() {

    /* ── Parámetros ── */
    register_rest_route( 'inkrush/v1', '/parameters', [
        [ 'methods' => 'GET',  'callback' => 'inkrush_api_list_parameters',   'permission_callback' => '__return_true' ],
        [ 'methods' => 'POST', 'callback' => 'inkrush_api_create_parameter',  'permission_callback' => fn() => current_user_can('manage_options') ],
    ] );
    register_rest_route( 'inkrush/v1', '/parameters/(?P<id>[a-f0-9]+)', [
        'methods' => 'DELETE', 'callback' => 'inkrush_api_delete_parameter',
        'permission_callback' => fn() => current_user_can('manage_options'),
    ] );

    /* ── Temporada y config ── */
    register_rest_route( 'inkrush/v1', '/season', [
        'methods' => 'GET', 'permission_callback' => '__return_true',
        'callback' => fn() => rest_ensure_response( [
            'season' => get_option('inkrush_active_season',''),
            'rolls'  => (int) get_option('inkrush_rolls_per_day', 3),
            'params' => (int) get_option('inkrush_max_params', 3),
        ] ),
    ] );

    /* ── Obras (artworks) ── */
    register_rest_route( 'inkrush/v1', '/artworks', [
        [ 'methods' => 'GET',  'callback' => 'inkrush_api_list_artworks',  'permission_callback' => '__return_true' ],
        [ 'methods' => 'POST', 'callback' => 'inkrush_api_create_artwork', 'permission_callback' => 'is_user_logged_in' ],
    ] );
    register_rest_route( 'inkrush/v1', '/artworks/(?P<id>\d+)/react', [
        'methods' => 'POST', 'callback' => 'inkrush_api_react',
        'permission_callback' => 'is_user_logged_in',
    ] );

    /* ── Retos ── */
    register_rest_route( 'inkrush/v1', '/challenge/complete', [
        'methods' => 'POST', 'callback' => 'inkrush_api_complete_challenge',
        'permission_callback' => 'is_user_logged_in',
    ] );
}

/* ──────────────────────────────────────────────────────────────
   PARÁMETROS
────────────────────────────────────────────────────────────── */

function inkrush_api_list_parameters( WP_REST_Request $req ) {
    $vars     = inkrush_get_variables();
    $category = $req->get_param('category');
    $rarity   = $req->get_param('rarity');
    $season   = $req->get_param('season');
    $active   = get_option('inkrush_active_season','');

    $filtered = array_values( array_filter( $vars, function($v) use ($category,$rarity,$season,$active) {
        if ( $category && $v['category'] !== $category ) return false;
        if ( $rarity   && $v['rarity']   !== $rarity )   return false;
        if ( $season === 'active' ) {
            if ( $v['season'] && $v['season'] !== $active ) return false;
        } elseif ( $season ) {
            if ( $v['season'] !== $season ) return false;
        }
        return true;
    } ) );

    return rest_ensure_response( [ 'success'=>true, 'active_season'=>$active, 'total'=>count($filtered), 'parameters'=>$filtered ] );
}

function inkrush_api_create_parameter( WP_REST_Request $req ) {
    $value    = sanitize_text_field( $req->get_param('value') );
    $category = sanitize_text_field( $req->get_param('category') );
    $rarity   = sanitize_text_field( $req->get_param('rarity') ?? 'Común' );
    $season   = sanitize_text_field( $req->get_param('season') ?? '' );

    if ( !$value || !$category ) return new WP_Error('missing','value y category requeridos.',['status'=>400]);

    $vars  = inkrush_get_variables();
    $new   = [ 'id'=>inkrush_uid(), 'category'=>$category, 'value'=>strtolower($value), 'rarity'=>$rarity, 'season'=>$season ];
    $vars[] = $new;
    inkrush_save_variables($vars);
    return rest_ensure_response( ['success'=>true,'variable'=>$new] );
}

function inkrush_api_delete_parameter( WP_REST_Request $req ) {
    $id   = sanitize_text_field( $req->get_param('id') );
    $vars = array_values( array_filter( inkrush_get_variables(), fn($v) => $v['id'] !== $id ) );
    inkrush_save_variables($vars);
    return rest_ensure_response( ['success'=>true] );
}

/* ──────────────────────────────────────────────────────────────
   OBRAS
────────────────────────────────────────────────────────────── */

function inkrush_api_list_artworks( WP_REST_Request $req ) {
    $page      = max(1, (int) $req->get_param('page'));
    $technique = sanitize_text_field( $req->get_param('technique') ?? '' );
    $rarity    = sanitize_text_field( $req->get_param('rarity') ?? '' );

    $args = [
        'post_type'      => 'inkrush_artwork',
        'post_status'    => 'publish',
        'posts_per_page' => 20,
        'paged'          => $page,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'meta_query'     => [],
    ];

    if ( $technique ) $args['meta_query'][] = [ 'key'=>'inkrush_technique', 'value'=>$technique ];
    if ( $rarity )    $args['meta_query'][] = [ 'key'=>'inkrush_rarity',    'value'=>$rarity    ];

    $query = new WP_Query($args);
    $posts = [];

    foreach ( $query->posts as $post ) {
        $uid    = (int) $post->post_author;
        $author = get_userdata($uid);
        $posts[] = [
            'id'        => $post->ID,
            'prompt'    => $post->post_title,
            'username'  => $author ? $author->display_name : 'Artista',
            'avatar'    => '🎨',
            'technique' => get_post_meta( $post->ID, 'inkrush_technique', true ),
            'variables' => json_decode( get_post_meta( $post->ID, 'inkrush_variables', true ) ?: '[]', true ),
            'rarity'    => get_post_meta( $post->ID, 'inkrush_rarity', true ) ?: 'Común',
            'likes'     => (int) get_post_meta( $post->ID, 'inkrush_likes', true ),
            'inspires'  => (int) get_post_meta( $post->ID, 'inkrush_inspires', true ),
            'tries'     => (int) get_post_meta( $post->ID, 'inkrush_tries', true ),
            'image'     => get_the_post_thumbnail_url( $post->ID, 'medium' ) ?: '',
            'date'      => $post->post_date,
        ];
    }

    return rest_ensure_response( [
        'success'  => true,
        'artworks' => $posts,
        'total'    => $query->found_posts,
        'pages'    => $query->max_num_pages,
    ] );
}

function inkrush_api_create_artwork( WP_REST_Request $req ) {
    $uid         = get_current_user_id();
    $prompt      = sanitize_text_field( $req->get_param('prompt') ?? '' );
    $technique   = sanitize_text_field( $req->get_param('technique') ?? '' );
    $rarity      = sanitize_text_field( $req->get_param('rarity') ?? 'Común' );
    $description = sanitize_textarea_field( $req->get_param('description') ?? '' );
    $variables   = $req->get_param('variables') ?? [];
    $params      = $req->get_param('params') ?? [];

    $post_id = wp_insert_post( [
        'post_title'   => $prompt ?: implode(' + ', (array) $variables),
        'post_content' => $description,
        'post_author'  => $uid,
        'post_status'  => 'publish',
        'post_type'    => 'inkrush_artwork',
    ] );

    if ( is_wp_error($post_id) ) return $post_id;

    update_post_meta( $post_id, 'inkrush_technique', $technique );
    update_post_meta( $post_id, 'inkrush_rarity',    $rarity );
    update_post_meta( $post_id, 'inkrush_variables',  wp_json_encode( (array) $variables ) );
    update_post_meta( $post_id, 'inkrush_params',     wp_json_encode( (array) $params ) );
    update_post_meta( $post_id, 'inkrush_likes',     0 );
    update_post_meta( $post_id, 'inkrush_inspires',  0 );
    update_post_meta( $post_id, 'inkrush_tries',     0 );

    // Incrementar contador del usuario y recalcular nivel
    $current = (int) get_user_meta( $uid, 'inkrush_challenges_completed', true );
    update_user_meta( $uid, 'inkrush_challenges_completed', $current + 1 );
    inkrush_update_user_level( $uid );

    return rest_ensure_response( ['success'=>true, 'id'=>$post_id] );
}

function inkrush_api_react( WP_REST_Request $req ) {
    $post_id = (int) $req->get_param('id');
    $type    = sanitize_text_field( $req->get_param('type') );
    $uid     = get_current_user_id();

    $allowed = [ 'like' => 'inkrush_likes', 'inspire' => 'inkrush_inspires', 'try' => 'inkrush_tries' ];
    if ( ! isset( $allowed[$type] ) ) return new WP_Error('invalid_type','Tipo inválido.',['status'=>400]);

    $meta_key    = $allowed[$type];
    $react_key   = "inkrush_reacted_{$type}_{$post_id}";
    $already     = (bool) get_user_meta( $uid, $react_key, true );

    if ( $already ) {
        // Quitar reacción
        delete_user_meta( $uid, $react_key );
        $count = max( 0, (int) get_post_meta( $post_id, $meta_key, true ) - 1 );
    } else {
        // Añadir reacción
        update_user_meta( $uid, $react_key, true );
        $count = (int) get_post_meta( $post_id, $meta_key, true ) + 1;
        // Si es inspiración, sumar al autor
        if ( $type === 'inspire' ) {
            $author = (int) get_post_field( 'post_author', $post_id );
            $ai = (int) get_user_meta( $author, 'inkrush_inspires_received', true );
            update_user_meta( $author, 'inkrush_inspires_received', $ai + 1 );
            inkrush_update_user_level( $author );
        }
    }
    update_post_meta( $post_id, $meta_key, $count );

    return rest_ensure_response( ['success'=>true, 'count'=>$count, 'active'=>!$already] );
}

/* ──────────────────────────────────────────────────────────────
   RETOS
────────────────────────────────────────────────────────────── */

function inkrush_api_complete_challenge() {
    $uid        = get_current_user_id();
    $challenges = (int) get_user_meta( $uid, 'inkrush_challenges_completed', true );
    update_user_meta( $uid, 'inkrush_challenges_completed', $challenges + 1 );
    $level  = inkrush_update_user_level( $uid );
    $streak = (int) get_user_meta( $uid, 'inkrush_streak', true );
    update_user_meta( $uid, 'inkrush_streak', $streak + 1 );
    return rest_ensure_response( ['success'=>true,'challenges'=>$challenges+1,'level'=>$level,'streak'=>$streak+1] );
}
