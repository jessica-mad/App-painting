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

    /* ── Config de contenido: niveles, temporadas, rareza ── */
    register_rest_route( 'inkrush/v1', '/config', [
        'methods' => 'GET', 'permission_callback' => '__return_true',
        'callback' => 'inkrush_api_get_config',
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

    /* ── Registro de usuario ── */
    register_rest_route( 'inkrush/v1', '/register', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_register',
        'permission_callback' => '__return_true',
    ] );

    /* ── Perfil del usuario actual ── */
    register_rest_route( 'inkrush/v1', '/users/me', [
        [ 'methods' => 'GET',   'callback' => 'inkrush_api_get_me',    'permission_callback' => 'is_user_logged_in' ],
        [ 'methods' => 'POST',  'callback' => 'inkrush_api_update_me', 'permission_callback' => 'is_user_logged_in' ],
    ] );

    /* ── Perfil público de cualquier usuario ── */
    register_rest_route( 'inkrush/v1', '/users/(?P<id>\d+)', [
        'methods' => 'GET', 'permission_callback' => '__return_true',
        'callback' => 'inkrush_api_get_user',
    ] );

    /* ── Seguir / dejar de seguir ── */
    register_rest_route( 'inkrush/v1', '/users/(?P<id>\d+)/follow', [
        'methods' => 'POST', 'callback' => 'inkrush_api_follow_user',
        'permission_callback' => 'is_user_logged_in',
    ] );

    /* ── Lista de usuarios que sigue ── */
    register_rest_route( 'inkrush/v1', '/users/(?P<id>\d+)/following', [
        'methods' => 'GET', 'callback' => 'inkrush_api_get_following',
        'permission_callback' => '__return_true',
    ] );

    /* ── Lista de seguidores ── */
    register_rest_route( 'inkrush/v1', '/users/(?P<id>\d+)/followers', [
        'methods' => 'GET', 'callback' => 'inkrush_api_get_followers',
        'permission_callback' => '__return_true',
    ] );

    /* ── Gestión de obras propias ── */
    register_rest_route( 'inkrush/v1', '/artworks/(?P<id>\d+)', [
        [ 'methods' => 'GET',    'callback' => 'inkrush_api_get_artwork',    'permission_callback' => '__return_true' ],
        [ 'methods' => 'DELETE', 'callback' => 'inkrush_api_delete_artwork', 'permission_callback' => 'is_user_logged_in' ],
    ] );
    register_rest_route( 'inkrush/v1', '/artworks/(?P<id>\d+)/hide', [
        'methods' => 'POST', 'callback' => 'inkrush_api_hide_artwork',
        'permission_callback' => 'is_user_logged_in',
    ] );
    register_rest_route( 'inkrush/v1', '/artworks/(?P<id>\d+)/report', [
        'methods' => 'POST', 'callback' => 'inkrush_api_report_artwork',
        'permission_callback' => 'is_user_logged_in',
    ] );

    /* ── Reportes (admin) ── */
    register_rest_route( 'inkrush/v1', '/reports', [
        'methods' => 'GET', 'callback' => 'inkrush_api_list_reports',
        'permission_callback' => fn() => current_user_can('manage_options'),
    ] );
    register_rest_route( 'inkrush/v1', '/artworks/(?P<id>\d+)/republish', [
        'methods' => 'POST', 'callback' => 'inkrush_api_republish_artwork',
        'permission_callback' => fn() => current_user_can('manage_options'),
    ] );

    /* ── Handle / disponibilidad de nombre ── */
    register_rest_route( 'inkrush/v1', '/check-username', [
        'methods'             => 'GET',
        'callback'            => 'inkrush_api_check_username',
        'permission_callback' => '__return_true',
    ] );

    /* ── Autenticación en-app ── */
    register_rest_route( 'inkrush/v1', '/auth/login', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_login',
        'permission_callback' => '__return_true',
    ] );

    /* ── IA: keyword rain ── */
    register_rest_route( 'inkrush/v1', '/ai/keywords', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_ai_keywords',
        'permission_callback' => 'is_user_logged_in',
    ] );

    /* ── IA: creative challenge prompt ── */
    register_rest_route( 'inkrush/v1', '/ai/prompt', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_ai_prompt',
        'permission_callback' => 'is_user_logged_in',
    ] );

    /* ── Intentos "Lo intentaré" diarios ── */
    register_rest_route( 'inkrush/v1', '/tries/use', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_use_try',
        'permission_callback' => 'is_user_logged_in',
    ] );

    /* ── Reset intentos diarios (admin) ── */
    register_rest_route( 'inkrush/v1', '/rolls/reset', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_reset_rolls',
        'permission_callback' => fn() => current_user_can('manage_options'),
    ] );

    /* ── Track roll use ── */
    register_rest_route( 'inkrush/v1', '/rolls/use', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_use_roll',
        'permission_callback' => 'is_user_logged_in',
    ] );

    /* ── Bug reports ── */
    register_rest_route( 'inkrush/v1', '/bug-reports', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_submit_bug_report',
        'permission_callback' => '__return_true',
    ] );

    /* ── Comentarios de obras ── */
    register_rest_route( 'inkrush/v1', '/artworks/(?P<id>\d+)/comments', [
        [ 'methods' => 'GET',  'callback' => 'inkrush_api_list_comments',  'permission_callback' => '__return_true' ],
        [ 'methods' => 'POST', 'callback' => 'inkrush_api_post_comment',   'permission_callback' => 'is_user_logged_in' ],
    ] );
    register_rest_route( 'inkrush/v1', '/artworks/(?P<id>\d+)/comments/(?P<comment_id>\d+)', [
        'methods'             => 'DELETE',
        'callback'            => 'inkrush_api_delete_comment',
        'permission_callback' => 'is_user_logged_in',
    ] );

    /* ── Notificaciones ── */
    register_rest_route( 'inkrush/v1', '/notifications', [
        [ 'methods' => 'GET',  'callback' => 'inkrush_api_get_notifications',   'permission_callback' => 'is_user_logged_in' ],
        [ 'methods' => 'POST', 'callback' => 'inkrush_api_mark_notifications_read', 'permission_callback' => 'is_user_logged_in' ],
    ] );

    /* ── Traducción IA ── */
    register_rest_route( 'inkrush/v1', '/translate', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_translate',
        'permission_callback' => '__return_true',
    ] );

    /* ── Traducción masiva de parámetros ── */
    register_rest_route( 'inkrush/v1', '/parameters/translate-missing', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_translate_missing_params',
        'permission_callback' => fn() => current_user_can( 'manage_options' ),
    ] );

    /* ── Traducir un parámetro concreto ── */
    register_rest_route( 'inkrush/v1', '/parameters/(?P<id>[a-f0-9]+)/translate', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_translate_single_param',
        'permission_callback' => fn() => current_user_can( 'manage_options' ),
    ] );

    /* ── Recuperar contraseña ── */
    register_rest_route( 'inkrush/v1', '/forgot-password', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_forgot_password',
        'permission_callback' => '__return_true',
    ] );

    /* ── Música: URLs por track ── */
    register_rest_route( 'inkrush/v1', '/music-srcs', [
        'methods'             => 'GET',
        'callback'            => 'inkrush_api_get_music_srcs',
        'permission_callback' => '__return_true',
    ] );

    /* ── Búsqueda ── */
    register_rest_route( 'inkrush/v1', '/search/users', [
        'methods'             => 'GET',
        'callback'            => 'inkrush_api_search_users',
        'permission_callback' => '__return_true',
    ] );
    register_rest_route( 'inkrush/v1', '/search/posts', [
        'methods'             => 'GET',
        'callback'            => 'inkrush_api_search_posts',
        'permission_callback' => '__return_true',
    ] );

    /* ── Push subscriptions ── */
    register_rest_route( 'inkrush/v1', '/push/subscribe', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_push_subscribe',
        'permission_callback' => 'is_user_logged_in',
    ] );
    register_rest_route( 'inkrush/v1', '/push/unsubscribe', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_push_unsubscribe',
        'permission_callback' => 'is_user_logged_in',
    ] );
    register_rest_route( 'inkrush/v1', '/push/status', [
        'methods'             => 'GET',
        'callback'            => 'inkrush_api_push_status',
        'permission_callback' => 'is_user_logged_in',
    ] );
    register_rest_route( 'inkrush/v1', '/push/musai-hour', [
        'methods'             => 'POST',
        'callback'            => 'inkrush_api_push_musai_hour',
        'permission_callback' => 'is_user_logged_in',
    ] );
}

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────── */

/**
 * Insert a notification row. Skips self-notifications and duplicates within 60s.
 */
function inkrush_push_notification( $user_id, $from_user_id, $type, $post_id = null, $excerpt = null ) {
    global $wpdb;

    $user_id      = (int) $user_id;
    $from_user_id = (int) $from_user_id;
    if ( ! $user_id || ! $from_user_id || $user_id === $from_user_id ) return;

    $table = $wpdb->prefix . 'inkrush_notifications';

    // De-duplicate: same actor + type + post within 60 seconds
    $since = gmdate( 'Y-m-d H:i:s', time() - 60 );
    $exists = $wpdb->get_var( $wpdb->prepare(
        "SELECT id FROM {$table}
         WHERE user_id = %d AND from_user_id = %d AND type = %s AND post_id <=> %s AND created_at > %s
         LIMIT 1",
        $user_id, $from_user_id, $type,
        $post_id !== null ? (string) $post_id : null,
        $since
    ) );
    if ( $exists ) return;

    $wpdb->insert( $table, [
        'user_id'      => $user_id,
        'from_user_id' => $from_user_id,
        'type'         => $type,
        'post_id'      => $post_id,
        'excerpt'      => $excerpt ? mb_substr( $excerpt, 0, 255 ) : null,
        'is_read'      => 0,
        'created_at'   => current_time( 'mysql', true ),
    ], [ '%d', '%d', '%s', $post_id !== null ? '%d' : 'NULL', '%s', '%d', '%s' ] );

    // Also send a Web Push to the device
    if ( function_exists( 'inkrush_maybe_send_social_push' ) ) {
        inkrush_maybe_send_social_push( $user_id, $from_user_id, $type, $post_id );
    }
}

/**
 * Read artwork variables from post meta with backward compatibility.
 * Old artworks stored a JSON string (wp_json_encode without UNESCAPED_UNICODE),
 * which WP's stripslashes damaged into literal "u00f1" sequences.
 * New artworks store a PHP-serialized array directly.
 */
function inkrush_get_post_variables( $post_id ) {
    $raw = get_post_meta( $post_id, 'inkrush_variables', true );
    if ( is_array( $raw ) ) return $raw;
    if ( empty( $raw ) ) return [];
    // Legacy JSON string — decode
    $decoded = json_decode( $raw, true );
    if ( is_array( $decoded ) ) return $decoded;
    return [];
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
    $value_en = sanitize_text_field( $req->get_param('value_en') ?? '' );

    if ( !$value || !$category ) return new WP_Error('missing','value y category requeridos.',['status'=>400]);

    $vars  = inkrush_get_variables();
    $new   = [ 'id'=>inkrush_uid(), 'category'=>$category, 'value'=>strtolower($value), 'value_en'=>$value_en, 'rarity'=>$rarity, 'season'=>$season ];
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

    $author = (int) $req->get_param('author');

    $args = [
        'post_type'      => 'inkrush_artwork',
        'post_status'    => [ 'publish', 'private' ],
        'posts_per_page' => 20,
        'paged'          => $page,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'meta_query'     => [],
    ];

    if ( $author )    $args['author']        = $author;
    if ( $technique ) $args['meta_query'][] = [ 'key'=>'inkrush_technique', 'value'=>$technique ];
    if ( $rarity )    $args['meta_query'][] = [ 'key'=>'inkrush_rarity',    'value'=>$rarity    ];

    /* Feed público: excluir ocultos salvo que sea el autor quien pide sus propias obras */
    $me = get_current_user_id();
    if ( ! $author || (int) $author !== $me ) {
        $args['meta_query'][] = [
            'relation' => 'OR',
            [ 'key' => 'inkrush_hidden', 'compare' => 'NOT EXISTS' ],
            [ 'key' => 'inkrush_hidden', 'value' => '1', 'compare' => '!=' ],
        ];
    }

    $query = new WP_Query($args);
    $posts = [];

    foreach ( $query->posts as $post ) {
        $uid    = (int) $post->post_author;
        $author_data = get_userdata($uid);

        $user_reacted = [ 'like' => false, 'inspire' => false, 'try' => false ];
        if ( $me ) {
            foreach ( $user_reacted as $type => $_ ) {
                $user_reacted[$type] = (bool) get_user_meta( $me, "inkrush_reacted_{$type}_{$post->ID}", true );
            }
        }

        $posts[] = [
            'id'          => $post->ID,
            'author_id'   => $uid,
            'prompt'      => $post->post_title,
            'description' => $post->post_content,
            'username'    => $author_data ? $author_data->display_name : 'Artista',
            'handle'      => $uid ? ( get_user_meta( $uid, 'inkrush_handle', true ) ?: '' ) : '',
            'avatar_url'  => $uid ? ( get_user_meta( $uid, 'inkrush_avatar_url', true ) ?: '' ) : '',
            'technique'   => get_post_meta( $post->ID, 'inkrush_technique', true ),
            'variables'   => inkrush_get_post_variables( $post->ID ),
            'rarity'      => get_post_meta( $post->ID, 'inkrush_rarity', true ) ?: 'Común',
            'likes'         => (int) get_post_meta( $post->ID, 'inkrush_likes', true ),
            'inspires'      => (int) get_post_meta( $post->ID, 'inkrush_inspires', true ),
            'tries'         => (int) get_post_meta( $post->ID, 'inkrush_tries', true ),
            'comment_count' => (int) get_post_meta( $post->ID, 'inkrush_comment_count', true ),
            'userReacted'   => $user_reacted,
            'hidden'      => (bool) get_post_meta( $post->ID, 'inkrush_hidden', true ),
            'reports'     => (int) get_post_meta( $post->ID, 'inkrush_reports', true ),
            'image'       => get_the_post_thumbnail_url( $post->ID, 'large' ) ?: '',
            'images'      => array_values( array_filter( array_map(
                fn($id) => wp_get_attachment_image_url( $id, 'large' ) ?: '',
                json_decode( get_post_meta( $post->ID, 'inkrush_image_ids', true ) ?: '[]', true )
            ) ) ),
            'date'        => $post->post_date,
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
    update_post_meta( $post_id, 'inkrush_variables', array_values( (array) $variables ) );
    update_post_meta( $post_id, 'inkrush_params',   array_values( (array) $params ) );
    update_post_meta( $post_id, 'inkrush_likes',     0 );
    update_post_meta( $post_id, 'inkrush_inspires',  0 );
    update_post_meta( $post_id, 'inkrush_tries',     0 );

    /* Guardar imágenes (array de base64) */
    $images_b64 = $req->get_param('images') ?? [];
    $image_ids  = [];
    foreach ( (array) $images_b64 as $b64 ) {
        if ( $b64 && strlen($b64) > 100 ) {
            $aid = inkrush_save_base64_image( $b64, $post_id );
            if ( $aid ) $image_ids[] = $aid;
        }
    }
    if ( ! empty( $image_ids ) ) {
        set_post_thumbnail( $post_id, $image_ids[0] );
        update_post_meta( $post_id, 'inkrush_image_ids', wp_json_encode( $image_ids ) );
    }

    // Incrementar contador del usuario y recalcular nivel
    $current = (int) get_user_meta( $uid, 'inkrush_challenges_completed', true );
    update_user_meta( $uid, 'inkrush_challenges_completed', $current + 1 );
    inkrush_update_user_level( $uid );

    // Notificar a todos los seguidores del autor
    $followers = get_users( [
        'meta_key'   => "inkrush_following_{$uid}",
        'meta_value' => '1',
        'fields'     => 'ID',
        'number'     => 500,
    ] );
    foreach ( $followers as $follower_id ) {
        inkrush_push_notification( (int) $follower_id, $uid, 'new_post', $post_id, $prompt ?: null );
    }

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
        // Notificar al autor de la obra
        $post_author = (int) get_post_field( 'post_author', $post_id );
        inkrush_push_notification( $post_author, $uid, $type, $post_id );
    }
    update_post_meta( $post_id, $meta_key, $count );

    return rest_ensure_response( ['success'=>true, 'count'=>$count, 'active'=>!$already] );
}

/* ──────────────────────────────────────────────────────────────
   RETOS
────────────────────────────────────────────────────────────── */

function inkrush_api_complete_challenge() {
    $uid       = get_current_user_id();
    $tz        = wp_timezone();
    $today     = ( new DateTime( 'now', $tz ) )->format( 'Y-m-d' );
    $yesterday = ( new DateTime( 'yesterday', $tz ) )->format( 'Y-m-d' );

    $last_date = get_user_meta( $uid, 'inkrush_last_challenge_date', true );
    $streak    = (int) get_user_meta( $uid, 'inkrush_streak', true );

    if ( $last_date !== $today ) {
        $streak = ( $last_date === $yesterday ) ? $streak + 1 : 1;
        update_user_meta( $uid, 'inkrush_streak', $streak );
        update_user_meta( $uid, 'inkrush_last_challenge_date', $today );
    }

    $challenges = (int) get_user_meta( $uid, 'inkrush_challenges_completed', true );
    update_user_meta( $uid, 'inkrush_challenges_completed', $challenges + 1 );
    $level = inkrush_update_user_level( $uid );

    return rest_ensure_response( ['success'=>true,'challenges'=>$challenges+1,'level'=>$level,'streak'=>$streak] );
}

/* ──────────────────────────────────────────────────────────────
   REGISTRO
────────────────────────────────────────────────────────────── */

function inkrush_api_register( WP_REST_Request $req ) {
    $email         = sanitize_email( $req->get_param('email') ?? '' );
    $password      = $req->get_param('password') ?? '';
    $name          = sanitize_text_field( $req->get_param('displayName') ?? 'Artista' );
    $captcha_token = sanitize_text_field( $req->get_param('captchaToken') ?? '' );

    if ( ! is_email( $email ) )
        return new WP_Error('invalid_email', 'Email inválido.', ['status'=>400]);
    if ( strlen( $password ) < 6 )
        return new WP_Error('weak_password', 'Contraseña mínimo 6 caracteres.', ['status'=>400]);

    // Verify reCAPTCHA if a secret key is configured
    $secret = get_option( 'inkrush_recaptcha_secret_key', '' );
    if ( $secret ) {
        if ( empty( $captcha_token ) )
            return new WP_Error('captcha_missing', 'Completa el CAPTCHA.', ['status'=>400]);
        $response = wp_remote_post( 'https://www.google.com/recaptcha/api/siteverify', [
            'body' => [
                'secret'   => $secret,
                'response' => $captcha_token,
                'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
            ],
        ] );
        if ( is_wp_error( $response ) )
            return new WP_Error('captcha_error', 'Error verificando CAPTCHA.', ['status'=>500]);
        $data = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( empty( $data['success'] ) )
            return new WP_Error('captcha_failed', 'CAPTCHA inválido. Inténtalo de nuevo.', ['status'=>400]);
    }

    if ( email_exists( $email ) )
        return new WP_Error('email_exists', 'Este email ya está registrado.', ['status'=>409]);

    /* Generar un handle único desde el nombre artístico */
    $handle  = inkrush_unique_handle( inkrush_slugify_handle( $name ) );
    $wp_login = sanitize_user( explode('@', $email)[0] . '_' . wp_rand(100,999) );
    $user_id  = wp_create_user( $wp_login, $password, $email );
    if ( is_wp_error( $user_id ) ) return $user_id;

    wp_update_user( ['ID' => $user_id, 'display_name' => $name] );
    ( new WP_User( $user_id ) )->set_role( 'ilustrador' );
    update_user_meta( $user_id, 'inkrush_bio', '' );
    update_user_meta( $user_id, 'inkrush_handle', $handle );

    /* Login automático */
    wp_set_auth_cookie( $user_id, false );

    /* Suscribir a Mailchimp (silencioso — nunca bloquea el registro) */
    inkrush_mailchimp_subscribe( $email, $name );

    return rest_ensure_response( [
        'success'     => true,
        'userId'      => $user_id,
        'displayName' => $name,
        'handle'      => $handle,
        'username'    => $wp_login,
    ] );
}

/* ──────────────────────────────────────────────────────────────
   PERFIL PROPIO
────────────────────────────────────────────────────────────── */

function inkrush_api_get_me() {
    $uid  = get_current_user_id();
    $user = get_userdata( $uid );
    return rest_ensure_response( [
        'userId'      => $uid,
        'username'    => $user->user_login,
        'displayName' => $user->display_name,
        'email'       => $user->user_email,
        'bio'         => get_user_meta( $uid, 'inkrush_bio', true ) ?: '',
        'avatarUrl'   => get_user_meta( $uid, 'inkrush_avatar_url', true ) ?: get_avatar_url( $uid, ['size'=>96] ),
        'socials'     => get_user_meta( $uid, 'inkrush_socials', true ) ?: [ 'instagram'=>'', 'tiktok'=>'', 'pinterest'=>'' ],
        'followers'   => (int) get_user_meta( $uid, 'inkrush_followers_count', true ),
        'following'   => (int) get_user_meta( $uid, 'inkrush_following_count', true ),
    ] );
}

function inkrush_api_update_me( WP_REST_Request $req ) {
    $uid  = get_current_user_id();
    $data = [ 'ID' => $uid ];

    if ( $req->get_param('displayName') )
        $data['display_name'] = sanitize_text_field( $req->get_param('displayName') );
    if ( $req->get_param('email') && is_email( $req->get_param('email') ) )
        $data['user_email'] = sanitize_email( $req->get_param('email') );

    wp_update_user( $data );

    if ( $req->get_param('bio') !== null )
        update_user_meta( $uid, 'inkrush_bio', sanitize_textarea_field( $req->get_param('bio') ) );

    if ( $req->get_param('socials') ) {
        $s = $req->get_param('socials');
        update_user_meta( $uid, 'inkrush_socials', [
            'instagram' => sanitize_text_field( $s['instagram'] ?? '' ),
            'tiktok'    => sanitize_text_field( $s['tiktok']    ?? '' ),
            'pinterest' => sanitize_text_field( $s['pinterest'] ?? '' ),
        ] );
    }

    $avatar_b64 = $req->get_param('avatar');
    if ( $avatar_b64 && strlen( $avatar_b64 ) > 100 ) {
        $aid = inkrush_save_base64_image( $avatar_b64, 0 );
        if ( $aid ) {
            update_user_meta( $uid, 'inkrush_avatar_url', wp_get_attachment_url( $aid ) );
        }
    }

    if ( $req->get_param('handle') !== null ) {
        $handle = strtolower( sanitize_user( $req->get_param('handle') ) );
        if ( ! preg_match( '/^[a-z0-9_]{3,20}$/', $handle ) )
            return new WP_Error( 'invalid_handle', 'Handle inválido: solo a-z, 0-9, guión bajo. Mínimo 3, máximo 20.', ['status' => 400] );
        $taken = get_users( [ 'meta_key' => 'inkrush_handle', 'meta_value' => $handle, 'number' => 1, 'fields' => 'ID', 'exclude' => [ $uid ] ] );
        if ( ! empty( $taken ) )
            return new WP_Error( 'handle_taken', 'Ese nombre de usuario ya está en uso.', ['status' => 409] );
        update_user_meta( $uid, 'inkrush_handle', $handle );
    }

    return rest_ensure_response( ['success' => true] );
}

/* ──────────────────────────────────────────────────────────────
   HELPERS DE HANDLE
────────────────────────────────────────────────────────────── */

function inkrush_slugify_handle( $name ) {
    $slug = strtolower( $name );
    $slug = iconv( 'UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug );
    $slug = preg_replace( '/[^a-z0-9]+/', '_', $slug );
    $slug = trim( $slug, '_' );
    $slug = preg_replace( '/_{2,}/', '_', $slug );
    return substr( $slug ?: 'artista', 0, 20 );
}

function inkrush_unique_handle( $base ) {
    $handle = $base;
    $i      = 2;
    while ( ! empty( get_users( [ 'meta_key' => 'inkrush_handle', 'meta_value' => $handle, 'number' => 1, 'fields' => 'ID' ] ) ) ) {
        $handle = substr( $base, 0, 18 ) . $i++;
    }
    return $handle;
}

function inkrush_api_check_username( WP_REST_Request $req ) {
    $handle  = strtolower( sanitize_user( $req->get_param('username') ?? '' ) );
    $uid     = get_current_user_id();
    if ( strlen( $handle ) < 3 )
        return rest_ensure_response( [ 'available' => false, 'error' => 'Mínimo 3 caracteres' ] );
    if ( ! preg_match( '/^[a-z0-9_]{3,20}$/', $handle ) )
        return rest_ensure_response( [ 'available' => false, 'error' => 'Solo a-z, 0-9, guión bajo (máx. 20)' ] );
    $taken = get_users( [
        'meta_key'   => 'inkrush_handle',
        'meta_value' => $handle,
        'number'     => 1,
        'fields'     => 'ID',
        'exclude'    => $uid ? [ $uid ] : [],
    ] );
    return rest_ensure_response( [ 'available' => empty( $taken ) ] );
}

/* ──────────────────────────────────────────────────────────────
   PERFIL PÚBLICO & SEGUIMIENTO
────────────────────────────────────────────────────────────── */

function inkrush_api_get_user( WP_REST_Request $req ) {
    $uid  = (int) $req->get_param('id');
    $user = get_userdata( $uid );
    if ( ! $user ) return new WP_Error( 'not_found', 'Usuario no encontrado.', ['status'=>404] );

    $me          = get_current_user_id();
    $is_following = $me ? (bool) get_user_meta( $me, "inkrush_following_{$uid}", true ) : false;

    $challenges = (int) get_user_meta( $uid, 'inkrush_challenges_completed', true );
    $handle     = get_user_meta( $uid, 'inkrush_handle', true ) ?: '';
    $base       = get_option( 'inkrush_profile_base', 'artista' );
    return rest_ensure_response( [
        'userId'              => $uid,
        'username'            => $user->user_login,
        'displayName'         => $user->display_name,
        'handle'              => $handle,
        'shareLink'           => $handle ? home_url( "/{$base}/{$handle}" ) : '',
        'bio'                 => get_user_meta( $uid, 'inkrush_bio', true ) ?: '',
        'avatarUrl'           => get_user_meta( $uid, 'inkrush_avatar_url', true ) ?: get_avatar_url( $uid, ['size'=>96] ),
        'level'               => (int) get_user_meta( $uid, 'inkrush_level', true ) ?: 1,
        'completedChallenges' => $challenges,
        'streak'              => (int) get_user_meta( $uid, 'inkrush_streak', true ),
        'followers'           => (int) get_user_meta( $uid, 'inkrush_followers_count', true ),
        'following'           => (int) get_user_meta( $uid, 'inkrush_following_count', true ),
        'totalLikes'          => (int) get_user_meta( $uid, 'inkrush_total_likes', true ),
        'totalInspires'       => (int) get_user_meta( $uid, 'inkrush_inspires_received', true ),
        'socials'             => get_user_meta( $uid, 'inkrush_socials', true ) ?: [ 'instagram' => '', 'tiktok' => '', 'pinterest' => '' ],
        'isFollowing'         => $is_following,
    ] );
}

function inkrush_api_follow_user( WP_REST_Request $req ) {
    $target = (int) $req->get_param('id');
    $me     = get_current_user_id();

    if ( $me === $target )
        return new WP_Error( 'self_follow', 'No puedes seguirte a ti mismo.', ['status'=>400] );
    if ( ! get_userdata( $target ) )
        return new WP_Error( 'not_found', 'Usuario no encontrado.', ['status'=>404] );

    $already = (bool) get_user_meta( $me, "inkrush_following_{$target}", true );

    if ( $already ) {
        delete_user_meta( $me, "inkrush_following_{$target}" );
        $followers = max( 0, (int) get_user_meta( $target, 'inkrush_followers_count', true ) - 1 );
        $my_following = max( 0, (int) get_user_meta( $me, 'inkrush_following_count', true ) - 1 );
    } else {
        update_user_meta( $me, "inkrush_following_{$target}", true );
        $followers    = (int) get_user_meta( $target, 'inkrush_followers_count', true ) + 1;
        $my_following = (int) get_user_meta( $me, 'inkrush_following_count', true ) + 1;
    }

    update_user_meta( $target, 'inkrush_followers_count', $followers );
    update_user_meta( $me, 'inkrush_following_count', $my_following );

    // Notificar solo al seguir, no al dejar de seguir
    if ( ! $already ) {
        inkrush_push_notification( $target, $me, 'follow' );
    }

    return rest_ensure_response( [ 'success'=>true, 'following'=>!$already, 'followers'=>$followers ] );
}

function inkrush_api_get_following( WP_REST_Request $req ) {
    $uid  = (int) $req->get_param('id');
    $user = get_userdata( $uid );
    if ( ! $user ) return new WP_Error( 'not_found', 'Usuario no encontrado.', ['status'=>404] );

    $all_meta = get_user_meta( $uid );
    $result   = [];

    foreach ( $all_meta as $key => $values ) {
        if ( strpos( $key, 'inkrush_following_' ) !== 0 ) continue;
        if ( ! $values[0] ) continue;
        $tid    = (int) str_replace( 'inkrush_following_', '', $key );
        $target = get_userdata( $tid );
        if ( ! $target ) continue;
        $challenges = (int) get_user_meta( $tid, 'inkrush_challenges', true );
        $result[] = [
            'id'                  => $tid,
            'username'            => $target->user_login,
            'displayName'         => $target->display_name,
            'avatarUrl'           => get_user_meta( $tid, 'inkrush_avatar_url', true ) ?: '',
            'completedChallenges' => $challenges,
            'role'                => inkrush_level_name( $challenges ),
        ];
    }

    return rest_ensure_response( ['success'=>true, 'users'=>$result] );
}

function inkrush_api_get_followers( WP_REST_Request $req ) {
    $uid  = (int) $req->get_param('id');
    $user = get_userdata( $uid );
    if ( ! $user ) return new WP_Error( 'not_found', 'Usuario no encontrado.', ['status'=>404] );

    /* Buscar usuarios que tengan inkrush_following_{uid} = true */
    $followers_query = get_users( [
        'meta_key'   => "inkrush_following_{$uid}",
        'meta_value' => '1',
        'number'     => 200,
    ] );

    $result = [];
    foreach ( $followers_query as $follower ) {
        $challenges = (int) get_user_meta( $follower->ID, 'inkrush_challenges_completed', true );
        $result[] = [
            'id'                  => $follower->ID,
            'username'            => $follower->user_login,
            'displayName'         => $follower->display_name,
            'avatarUrl'           => get_user_meta( $follower->ID, 'inkrush_avatar_url', true ) ?: '',
            'completedChallenges' => $challenges,
            'role'                => inkrush_level_name( $challenges ),
        ];
    }

    return rest_ensure_response( ['success'=>true, 'users'=>$result] );
}

function inkrush_api_get_artwork( WP_REST_Request $req ) {
    $post_id = (int) $req->get_param('id');
    $post    = get_post( $post_id );

    if ( ! $post || $post->post_type !== 'inkrush_artwork' )
        return new WP_Error( 'not_found', 'Obra no encontrada.', [ 'status' => 404 ] );

    $me          = get_current_user_id();
    $uid         = (int) $post->post_author;
    $author_data = get_userdata( $uid );

    $user_reacted = [ 'like' => false, 'inspire' => false, 'try' => false ];
    if ( $me ) {
        foreach ( $user_reacted as $type => $_ ) {
            $user_reacted[ $type ] = (bool) get_user_meta( $me, "inkrush_reacted_{$type}_{$post->ID}", true );
        }
    }

    $artwork = [
        'id'           => $post->ID,
        'author_id'    => $uid,
        'prompt'       => $post->post_title,
        'description'  => $post->post_content,
        'username'     => $author_data ? $author_data->display_name : 'Artista',
        'handle'       => $uid ? ( get_user_meta( $uid, 'inkrush_handle', true ) ?: '' ) : '',
        'avatar_url'   => $uid ? ( get_user_meta( $uid, 'inkrush_avatar_url', true ) ?: '' ) : '',
        'technique'    => get_post_meta( $post->ID, 'inkrush_technique', true ),
        'variables'    => inkrush_get_post_variables( $post->ID ),
        'rarity'       => get_post_meta( $post->ID, 'inkrush_rarity', true ) ?: 'Común',
        'likes'        => (int) get_post_meta( $post->ID, 'inkrush_likes', true ),
        'inspires'     => (int) get_post_meta( $post->ID, 'inkrush_inspires', true ),
        'tries'        => (int) get_post_meta( $post->ID, 'inkrush_tries', true ),
        'comment_count'=> (int) get_post_meta( $post->ID, 'inkrush_comment_count', true ),
        'userReacted'  => $user_reacted,
        'hidden'       => (bool) get_post_meta( $post->ID, 'inkrush_hidden', true ),
        'image'        => get_the_post_thumbnail_url( $post->ID, 'large' ) ?: '',
        'images'       => array_values( array_filter( array_map(
            fn( $id ) => wp_get_attachment_image_url( $id, 'large' ) ?: '',
            json_decode( get_post_meta( $post->ID, 'inkrush_image_ids', true ) ?: '[]', true )
        ) ) ),
        'date'         => $post->post_date,
    ];

    return rest_ensure_response( [ 'success' => true, 'artwork' => $artwork ] );
}

function inkrush_api_delete_artwork( WP_REST_Request $req ) {
    $post_id = (int) $req->get_param('id');
    $uid     = get_current_user_id();
    $post    = get_post( $post_id );

    if ( ! $post || $post->post_type !== 'inkrush_artwork' )
        return new WP_Error( 'not_found', 'Obra no encontrada.', ['status'=>404] );
    if ( (int) $post->post_author !== $uid && ! current_user_can('manage_options') )
        return new WP_Error( 'forbidden', 'Sin permiso.', ['status'=>403] );

    wp_delete_post( $post_id, true );
    return rest_ensure_response( ['success'=>true] );
}

function inkrush_api_hide_artwork( WP_REST_Request $req ) {
    $post_id = (int) $req->get_param('id');
    $uid     = get_current_user_id();
    $post    = get_post( $post_id );

    if ( ! $post || $post->post_type !== 'inkrush_artwork' )
        return new WP_Error( 'not_found', 'Obra no encontrada.', ['status'=>404] );
    if ( (int) $post->post_author !== $uid && ! current_user_can('manage_options') )
        return new WP_Error( 'forbidden', 'Sin permiso.', ['status'=>403] );

    $hidden = (bool) get_post_meta( $post_id, 'inkrush_hidden', true );
    if ( $hidden ) {
        delete_post_meta( $post_id, 'inkrush_hidden' );
    } else {
        update_post_meta( $post_id, 'inkrush_hidden', '1' );
    }

    return rest_ensure_response( ['success'=>true, 'hidden'=>!$hidden] );
}

function inkrush_api_report_artwork( WP_REST_Request $req ) {
    $post_id = (int) $req->get_param('id');
    $uid     = get_current_user_id();
    $reason  = sanitize_text_field( $req->get_param('reason') ?? '' );
    $post    = get_post( $post_id );

    if ( ! $post || $post->post_type !== 'inkrush_artwork' )
        return new WP_Error( 'not_found', 'Obra no encontrada.', ['status'=>404] );

    /* Evitar reportes duplicados del mismo usuario */
    $already = (bool) get_user_meta( $uid, "inkrush_reported_{$post_id}", true );
    if ( $already ) return rest_ensure_response( ['success'=>true, 'already'=>true] );

    update_user_meta( $uid, "inkrush_reported_{$post_id}", '1' );

    $count = (int) get_post_meta( $post_id, 'inkrush_reports', true ) + 1;
    update_post_meta( $post_id, 'inkrush_reports', $count );

    /* Guardar detalle del reporte */
    $reports = json_decode( get_post_meta( $post_id, 'inkrush_reports_detail', true ) ?: '[]', true );
    $text    = sanitize_textarea_field( $req->get_param('text') ?? '' );
    $reports[] = [ 'uid' => $uid, 'reason' => $reason, 'text' => $text, 'date' => date('c') ];
    update_post_meta( $post_id, 'inkrush_reports_detail', wp_json_encode( $reports ) );

    /* Auto-ocultar si ≥ 5 reportes */
    if ( $count >= 5 ) {
        update_post_meta( $post_id, 'inkrush_hidden', '1' );
    }

    return rest_ensure_response( ['success'=>true, 'reports'=>$count, 'autoHidden'=>$count >= 5] );
}

function inkrush_api_list_reports( WP_REST_Request $req ) {
    $args = [
        'post_type'      => 'inkrush_artwork',
        'post_status'    => [ 'publish', 'private' ],
        'posts_per_page' => 50,
        'meta_query'     => [
            [ 'key' => 'inkrush_reports', 'value' => '0', 'compare' => '>', 'type' => 'NUMERIC' ],
        ],
        'orderby'  => 'meta_value_num',
        'meta_key' => 'inkrush_reports',
        'order'    => 'DESC',
    ];

    $query = new WP_Query( $args );
    $result = [];

    foreach ( $query->posts as $post ) {
        $uid    = (int) $post->post_author;
        $author = get_userdata( $uid );
        $result[] = [
            'id'       => $post->ID,
            'prompt'   => $post->post_title,
            'author'   => $author ? $author->display_name : 'Desconocido',
            'reports'  => (int) get_post_meta( $post->ID, 'inkrush_reports', true ),
            'hidden'   => (bool) get_post_meta( $post->ID, 'inkrush_hidden', true ),
            'detail'   => json_decode( get_post_meta( $post->ID, 'inkrush_reports_detail', true ) ?: '[]', true ),
            'image'    => get_the_post_thumbnail_url( $post->ID, 'medium' ) ?: '',
            'date'     => $post->post_date,
        ];
    }

    return rest_ensure_response( ['success'=>true, 'reports'=>$result] );
}

function inkrush_api_republish_artwork( WP_REST_Request $req ) {
    $post_id = (int) $req->get_param('id');
    $post    = get_post( $post_id );

    if ( ! $post || $post->post_type !== 'inkrush_artwork' )
        return new WP_Error( 'not_found', 'Obra no encontrada.', ['status'=>404] );

    delete_post_meta( $post_id, 'inkrush_hidden' );
    delete_post_meta( $post_id, 'inkrush_reports' );
    delete_post_meta( $post_id, 'inkrush_reports_detail' );

    return rest_ensure_response( ['success'=>true] );
}

function inkrush_level_name( $challenges ) {
    if ( $challenges >= 50 ) return 'Maestro';
    if ( $challenges >= 30 ) return 'Avanzado';
    if ( $challenges >= 15 ) return 'Intermedio';
    if ( $challenges >= 5  ) return 'Aprendiz';
    return 'Explorador';
}

/* ──────────────────────────────────────────────────────────────
   INTENTOS DIARIOS
────────────────────────────────────────────────────────────── */

function inkrush_api_use_roll() {
    $uid     = get_current_user_id();
    $key     = 'inkrush_daily_rolls_' . date('Y-m-d');
    $current = (int) get_user_meta( $uid, $key, true );
    update_user_meta( $uid, $key, $current + 1 );
    return rest_ensure_response( ['success'=>true, 'used'=> $current + 1] );
}

function inkrush_api_reset_rolls( WP_REST_Request $req ) {
    $uid = (int) $req->get_param('userId');
    if ( ! $uid ) $uid = get_current_user_id();

    $key = 'inkrush_daily_rolls_' . date('Y-m-d');
    delete_user_meta( $uid, $key );

    return rest_ensure_response( ['success'=>true, 'userId'=>$uid] );
}

/* ──────────────────────────────────────────────────────────────
   IMÁGENES (base64 → WP Media)
────────────────────────────────────────────────────────────── */

function inkrush_save_base64_image( $base64, $post_id ) {
    if ( ! function_exists('wp_handle_upload') ) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
    }

    $data = preg_replace('#^data:image/\w+;base64,#i', '', $base64);
    $data = base64_decode( $data );
    if ( ! $data ) return null;

    $upload_dir  = wp_upload_dir();
    $filename    = 'inkrush-' . $post_id . '-' . uniqid() . '.jpg';
    $file_path   = $upload_dir['path'] . '/' . $filename;
    file_put_contents( $file_path, $data );

    $attachment  = [
        'post_mime_type' => 'image/jpeg',
        'post_title'     => $filename,
        'post_status'    => 'inherit',
    ];
    $attach_id   = wp_insert_attachment( $attachment, $file_path, $post_id );
    $attach_data = wp_generate_attachment_metadata( $attach_id, $file_path );
    wp_update_attachment_metadata( $attach_id, $attach_data );

    return $attach_id;
}

/* ──────────────────────────────────────────────────────────────
   AUTENTICACIÓN EN-APP
────────────────────────────────────────────────────────────── */

function inkrush_api_login( WP_REST_Request $req ) {
    $email    = sanitize_email( $req->get_param('email') ?? '' );
    $password = $req->get_param('password') ?? '';

    if ( ! is_email( $email ) ) {
        return new WP_Error( 'invalid_email', 'Email inválido.', [ 'status' => 400 ] );
    }
    if ( empty( $password ) ) {
        return new WP_Error( 'missing_password', 'Contraseña requerida.', [ 'status' => 400 ] );
    }

    /* WP acepta email como user_login en wp_signon */
    $creds = [
        'user_login'    => $email,
        'user_password' => $password,
        'remember'      => true,
    ];

    $user = wp_signon( $creds, is_ssl() );

    if ( is_wp_error( $user ) ) {
        return new WP_Error( 'auth_failed', 'Email o contraseña incorrectos.', [ 'status' => 401 ] );
    }

    return rest_ensure_response( [
        'success'     => true,
        'userId'      => $user->ID,
        'displayName' => $user->display_name,
        'username'    => $user->user_login,
    ] );
}

/* ──────────────────────────────────────────────────────────────
   INTENTOS "LO INTENTARÉ" POR NIVEL
────────────────────────────────────────────────────────────── */

function inkrush_get_tries_limit( $user_id ) {
    $challenges = (int) get_user_meta( $user_id, 'inkrush_challenges_completed', true );
    if ( $challenges >= 30 ) return 15; // Nivel 5
    if ( $challenges >= 20 ) return 10; // Nivel 4
    if ( $challenges >= 10 ) return 7;  // Nivel 3
    if ( $challenges >= 5  ) return 5;  // Nivel 2
    return 3;                            // Nivel 1
}

function inkrush_api_use_try( WP_REST_Request $req ) {
    global $wpdb;

    $uid   = get_current_user_id();
    $tz    = wp_timezone();
    $today = ( new DateTime( 'now', $tz ) )->format( 'Y-m-d' );
    $now   = ( new DateTime( 'now', $tz ) )->setTimezone( new DateTimeZone('UTC') )->format( 'Y-m-d H:i:s' );
    $table = $wpdb->prefix . 'inkrush_tries_log';
    $limit = inkrush_get_tries_limit( $uid );

    // Count entries for today from the log table (source of truth)
    $used = inkrush_count_tries_today( $uid );

    if ( $used >= $limit ) {
        return new WP_Error( 'tries_exhausted', 'Sin intentos disponibles hoy.', [ 'status' => 429 ] );
    }

    // Store the variables obtained in this try (for the log)
    $variables_raw = $req->get_json_params()['variables'] ?? null;
    $variables_json = $variables_raw ? wp_json_encode( $variables_raw, JSON_UNESCAPED_UNICODE ) : null;

    $wpdb->insert( $table, [
        'user_id'    => $uid,
        'variables'  => $variables_json,
        'try_date'   => $today,
        'created_at' => $now,
    ], [ '%d', '%s', '%s', '%s' ] );

    $new_used = $used + 1;

    // Cleanup entries older than 2 days (runs on each try, cheap query)
    inkrush_cleanup_old_tries();

    return rest_ensure_response( [
        'success' => true,
        'used'    => $new_used,
        'limit'   => $limit,
        'left'    => $limit - $new_used,
    ] );
}

/* ──────────────────────────────────────────────────────────────
   IA: KEYWORD RAIN
────────────────────────────────────────────────────────────── */

function inkrush_api_ai_keywords( WP_REST_Request $req ) {
    $api_key = get_option( 'inkrush_anthropic_key', '' );
    if ( empty( $api_key ) ) {
        return new WP_Error( 'no_api_key', 'Clave de Anthropic no configurada.', [ 'status' => 400 ] );
    }

    $raw_vars = $req->get_param( 'variables' );
    if ( ! is_array( $raw_vars ) || empty( $raw_vars ) ) {
        return new WP_Error( 'missing_variables', 'Se requieren las variables de la idea.', [ 'status' => 400 ] );
    }

    $variables = array_map( 'sanitize_text_field', (array) $raw_vars );
    $joined    = implode( ', ', $variables );

    $system_prompt = 'Eres un asistente creativo para artistas ilustradores. Tu única tarea es generar exactamente 8 palabras clave en español que amplíen la inspiración visual de una idea de ilustración.

Reglas estrictas:
- Devuelve ÚNICAMENTE 8 palabras, una por línea, sin numeración, guiones, puntuación ni explicación
- Cada palabra debe ser una sola palabra (sin espacios)
- Las palabras deben ser en español
- Deben evocar imágenes, texturas, atmósferas o elementos visuales
- Varía el tipo: adjetivos, sustantivos visuales, palabras de ambiente
- Evita repetir palabras que ya aparecen en la idea original';

    $user_message = "Idea de ilustración con estos conceptos: {$joined}.\n\nGenera 8 palabras clave visuales en español:";

    $body = wp_json_encode( [
        'model'      => 'claude-haiku-4-5-20251001',
        'max_tokens' => 120,
        'system'     => $system_prompt,
        'messages'   => [
            [ 'role' => 'user', 'content' => $user_message ],
        ],
    ] );

    $response = wp_remote_post( 'https://api.anthropic.com/v1/messages', [
        'timeout' => 15,
        'headers' => [
            'Content-Type'      => 'application/json',
            'x-api-key'         => $api_key,
            'anthropic-version' => '2023-06-01',
        ],
        'body' => $body,
    ] );

    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'anthropic_unreachable', 'No se pudo contactar con la API de Anthropic.', [ 'status' => 502 ] );
    }

    $code = wp_remote_retrieve_response_code( $response );
    if ( $code !== 200 ) {
        return new WP_Error( 'anthropic_error', 'Error de la API de Anthropic: ' . $code, [ 'status' => 502 ] );
    }

    $data = json_decode( wp_remote_retrieve_body( $response ), true );
    $text = $data['content'][0]['text'] ?? '';

    $keywords = array_values( array_filter(
        array_map( 'trim', explode( "\n", $text ) ),
        fn( $w ) => $w !== '' && strpos( $w, ' ' ) === false
    ) );

    $keywords = array_slice( $keywords, 0, 8 );

    if ( count( $keywords ) < 3 ) {
        return new WP_Error( 'parse_error', 'No se pudieron parsear palabras clave de la respuesta.', [ 'status' => 500 ] );
    }

    return rest_ensure_response( [ 'keywords' => $keywords ] );
}

/* ──────────────────────────────────────────────────────────────
   IA: CREATIVE CHALLENGE PROMPT
────────────────────────────────────────────────────────────── */

function inkrush_api_ai_prompt( WP_REST_Request $req ) {
    $api_key = get_option( 'inkrush_anthropic_key', '' );
    if ( empty( $api_key ) ) {
        return rest_ensure_response( [ 'prompt' => null ] ); // fallback gracefully
    }

    $raw_vars = $req->get_param( 'variables' );
    if ( ! is_array( $raw_vars ) || empty( $raw_vars ) ) {
        return new WP_Error( 'missing_variables', 'Se requieren las variables.', [ 'status' => 400 ] );
    }

    $variables = array_map( 'sanitize_text_field', (array) $raw_vars );
    $joined    = implode( ', ', $variables );

    $system_prompt = 'Eres un generador de enunciados creativos para retos de ilustración. Dado un conjunto de conceptos, crea UNA sola frase corta y evocadora en español (máximo 20 palabras) que sirva como enunciado poético de un reto de dibujo. La frase debe ser sugerente y visual, no literal. No uses la palabra "ilustra", "dibuja" ni imperativos. Solo devuelve la frase sin comillas ni explicaciones.';

    $user_message = "Conceptos: {$joined}";

    $body = wp_json_encode( [
        'model'      => 'claude-haiku-4-5-20251001',
        'max_tokens' => 80,
        'system'     => $system_prompt,
        'messages'   => [
            [ 'role' => 'user', 'content' => $user_message ],
        ],
    ] );

    $response = wp_remote_post( 'https://api.anthropic.com/v1/messages', [
        'timeout' => 12,
        'headers' => [
            'Content-Type'      => 'application/json',
            'x-api-key'         => $api_key,
            'anthropic-version' => '2023-06-01',
        ],
        'body' => $body,
    ] );

    if ( is_wp_error( $response ) ) {
        return rest_ensure_response( [ 'prompt' => null ] );
    }

    $code = wp_remote_retrieve_response_code( $response );
    if ( $code !== 200 ) {
        return rest_ensure_response( [ 'prompt' => null ] );
    }

    $data   = json_decode( wp_remote_retrieve_body( $response ), true );
    $prompt = trim( $data['content'][0]['text'] ?? '' );

    return rest_ensure_response( [ 'prompt' => $prompt ?: null ] );
}

/* ──────────────────────────────────────────────────────────────
   BUG REPORTS
────────────────────────────────────────────────────────────── */

function inkrush_api_submit_bug_report( WP_REST_Request $req ) {
    $title       = sanitize_text_field( $req->get_param('title') ?? '' );
    $description = sanitize_textarea_field( $req->get_param('description') ?? '' );
    $expected    = sanitize_textarea_field( $req->get_param('expected') ?? '' );
    $device_raw  = $req->get_param('device_info') ?? '{}';
    $device      = wp_json_encode( json_decode( $device_raw, true ) ?: [] );

    if ( empty( $title ) || empty( $description ) ) {
        return new WP_Error( 'missing_fields', 'Título y descripción son requeridos.', [ 'status' => 400 ] );
    }

    $post_id = wp_insert_post( [
        'post_type'    => 'inkrush_bug',
        'post_title'   => $title,
        'post_content' => $description,
        'post_excerpt' => $expected,
        'post_status'  => 'private',
        'post_author'  => get_current_user_id(),
    ] );

    if ( is_wp_error( $post_id ) ) {
        return new WP_Error( 'insert_failed', 'No se pudo guardar el reporte.', [ 'status' => 500 ] );
    }

    update_post_meta( $post_id, 'device_info', $device );

    /* Attach uploaded files */
    if ( ! function_exists( 'media_handle_upload' ) ) {
        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
    }
    $attachment_ids = [];
    $files = $_FILES ?? [];
    foreach ( $files as $key => $file ) {
        if ( strpos( $key, 'file_' ) !== 0 ) continue;
        if ( $file['error'] !== UPLOAD_ERR_OK ) continue;
        $att_id = media_handle_upload( $key, $post_id );
        if ( ! is_wp_error( $att_id ) ) {
            $attachment_ids[] = $att_id;
        }
    }
    if ( $attachment_ids ) {
        update_post_meta( $post_id, 'attachments', $attachment_ids );
    }

    /* Email admin */
    $admin_email = get_option( 'admin_email' );
    $user        = wp_get_current_user();
    $user_label  = $user && $user->ID ? $user->display_name . ' (' . $user->user_email . ')' : 'Anónimo';
    $subject     = "[InkRush Bug] {$title}";
    $body        = "Nuevo reporte de bug\n\n"
        . "Usuario: {$user_label}\n"
        . "Título: {$title}\n\n"
        . "Descripción:\n{$description}\n\n"
        . ( $expected ? "Comportamiento esperado:\n{$expected}\n\n" : '' )
        . "Dispositivo: {$device}\n\n"
        . "Ver reporte: " . admin_url( "post.php?post={$post_id}&action=edit" );
    wp_mail( $admin_email, $subject, $body );

    return rest_ensure_response( [ 'success' => true, 'id' => $post_id ] );
}

/* ──────────────────────────────────────────────────────────────
   COMENTARIOS
────────────────────────────────────────────────────────────── */

function inkrush_api_list_comments( WP_REST_Request $req ) {
    $post_id = (int) $req['id'];
    $post    = get_post( $post_id );
    if ( ! $post || $post->post_type !== 'inkrush_artwork' ) {
        return new WP_Error( 'not_found', 'Obra no encontrada.', [ 'status' => 404 ] );
    }

    $comments = get_comments( [
        'post_id'  => $post_id,
        'type'     => 'inkrush',
        'status'   => 'approve',
        'number'   => 50,
        'order'    => 'ASC',
        'orderby'  => 'comment_date',
    ] );

    $me = get_current_user_id();
    $data = array_map( function( $c ) use ( $me ) {
        $uid = (int) $c->user_id;
        return [
            'id'        => (int) $c->comment_ID,
            'text'      => $c->comment_content,
            'author'    => $c->comment_author,
            'author_id' => $uid,
            'avatar'    => get_avatar_url( $uid ?: $c->comment_author_email, [ 'size' => 40 ] ),
            'date'      => $c->comment_date_gmt,
            'isOwn'     => $me > 0 && $me === $uid,
        ];
    }, $comments );

    return rest_ensure_response( [ 'comments' => $data ] );
}

function inkrush_api_post_comment( WP_REST_Request $req ) {
    $post_id = (int) $req['id'];
    $post    = get_post( $post_id );
    if ( ! $post || $post->post_type !== 'inkrush_artwork' ) {
        return new WP_Error( 'not_found', 'Obra no encontrada.', [ 'status' => 404 ] );
    }

    $text = sanitize_textarea_field( $req->get_json_params()['text'] ?? '' );
    if ( strlen( $text ) < 1 || strlen( $text ) > 500 ) {
        return new WP_Error( 'invalid_text', 'El comentario debe tener entre 1 y 500 caracteres.', [ 'status' => 400 ] );
    }

    $user   = wp_get_current_user();
    $cid    = wp_insert_comment( [
        'comment_post_ID'      => $post_id,
        'comment_content'      => $text,
        'comment_type'         => 'inkrush',
        'comment_approved'     => 1,
        'user_id'              => $user->ID,
        'comment_author'       => $user->display_name,
        'comment_author_email' => $user->user_email,
    ] );

    if ( ! $cid || is_wp_error( $cid ) ) {
        return new WP_Error( 'insert_failed', 'No se pudo guardar el comentario.', [ 'status' => 500 ] );
    }

    $count = (int) get_post_meta( $post_id, 'inkrush_comment_count', true );
    update_post_meta( $post_id, 'inkrush_comment_count', $count + 1 );

    // Notificar al autor de la obra
    $post_author = (int) get_post_field( 'post_author', $post_id );
    inkrush_push_notification( $post_author, $user->ID, 'comment', $post_id, $text );

    return rest_ensure_response( [
        'id'        => (int) $cid,
        'text'      => $text,
        'author'    => $user->display_name,
        'author_id' => $user->ID,
        'avatar'    => get_avatar_url( $user->ID, [ 'size' => 40 ] ),
        'date'      => current_time( 'mysql', true ),
        'isOwn'     => true,
    ] );
}

/* ──────────────────────────────────────────────────────────────
   NOTIFICACIONES
────────────────────────────────────────────────────────────── */

function inkrush_api_get_notifications( WP_REST_Request $req ) {
    global $wpdb;
    $me    = get_current_user_id();
    $table = $wpdb->prefix . 'inkrush_notifications';

    $rows = $wpdb->get_results( $wpdb->prepare(
        "SELECT * FROM {$table} WHERE user_id = %d ORDER BY created_at DESC LIMIT 50",
        $me
    ), ARRAY_A );

    $unread = 0;
    $notifs = [];
    foreach ( $rows as $r ) {
        if ( ! (int) $r['is_read'] ) $unread++;

        $from_user = get_userdata( (int) $r['from_user_id'] );
        $handle    = get_user_meta( (int) $r['from_user_id'], 'inkrush_handle', true );
        $from_name = $from_user ? ( $from_user->display_name ?: $from_user->user_login ) : 'Alguien';

        $thumb = null;
        if ( $r['post_id'] ) {
            $att_ids  = json_decode( get_post_meta( (int) $r['post_id'], 'inkrush_image_ids', true ) ?: '[]', true );
            $thumb    = ! empty( $att_ids )
                ? wp_get_attachment_image_url( $att_ids[0], 'thumbnail' )
                : get_the_post_thumbnail_url( (int) $r['post_id'], 'thumbnail' );
        }

        $notifs[] = [
            'id'         => (int) $r['id'],
            'type'       => $r['type'],
            'is_read'    => (bool) (int) $r['is_read'],
            'excerpt'    => $r['excerpt'],
            'created_at' => $r['created_at'],
            'post_id'    => $r['post_id'] ? (int) $r['post_id'] : null,
            'thumb'      => $thumb ?: null,
            'from' => [
                'id'     => (int) $r['from_user_id'],
                'name'   => $from_name,
                'handle' => $handle ?: null,
                'avatar' => $from_user ? get_avatar_url( $from_user->ID, ['size' => 48] ) : null,
            ],
        ];
    }

    return rest_ensure_response( [ 'notifications' => $notifs, 'unread' => $unread ] );
}

function inkrush_api_mark_notifications_read() {
    global $wpdb;
    $me    = get_current_user_id();
    $table = $wpdb->prefix . 'inkrush_notifications';
    $wpdb->update( $table, [ 'is_read' => 1 ], [ 'user_id' => $me ], [ '%d' ], [ '%d' ] );
    return rest_ensure_response( [ 'success' => true ] );
}

function inkrush_api_delete_comment( WP_REST_Request $req ) {
    $post_id    = (int) $req['id'];
    $comment_id = (int) $req['comment_id'];
    $comment    = get_comment( $comment_id );

    if ( ! $comment || (int) $comment->comment_post_ID !== $post_id ) {
        return new WP_Error( 'not_found', 'Comentario no encontrado.', [ 'status' => 404 ] );
    }

    $me = get_current_user_id();
    if ( (int) $comment->user_id !== $me && ! current_user_can( 'manage_options' ) ) {
        return new WP_Error( 'forbidden', 'No puedes eliminar este comentario.', [ 'status' => 403 ] );
    }

    wp_delete_comment( $comment_id, true );

    $count = max( 0, (int) get_post_meta( $post_id, 'inkrush_comment_count', true ) - 1 );
    update_post_meta( $post_id, 'inkrush_comment_count', $count );

    return rest_ensure_response( [ 'success' => true ] );
}

/* ──────────────────────────────────────────────────────────────
   RECUPERAR CONTRASEÑA
────────────────────────────────────────────────────────────── */

function inkrush_api_forgot_password( WP_REST_Request $req ) {
    $email = sanitize_email( $req->get_param( 'email' ) ?? '' );
    if ( ! is_email( $email ) ) {
        return new WP_Error( 'invalid_email', 'Email inválido.', [ 'status' => 400 ] );
    }

    $user = get_user_by( 'email', $email );
    if ( $user ) {
        $key = get_password_reset_key( $user );
        if ( ! is_wp_error( $key ) ) {
            $reset_link = network_site_url(
                'wp-login.php?action=rp&key=' . rawurlencode( $key ) . '&login=' . rawurlencode( $user->user_login ),
                'login'
            );
            $site_name = get_bloginfo( 'name' );
            $subject   = "[{$site_name}] Recuperar contraseña";
            $message   = "Hola {$user->display_name},\n\n"
                       . "Alguien solicitó restablecer la contraseña de tu cuenta.\n\n"
                       . "Haz clic en el siguiente enlace para crear una nueva contraseña:\n\n"
                       . $reset_link . "\n\n"
                       . "Este enlace expirará en 24 horas.\n\n"
                       . "Si no solicitaste esto, ignora este correo.\n\n"
                       . "— {$site_name}";
            wp_mail( $email, $subject, $message );
        }
    }

    // Always return success for security (don't reveal if email exists)
    return rest_ensure_response( [ 'success' => true ] );
}

/* ──────────────────────────────────────────────────────────────
   BÚSQUEDA
────────────────────────────────────────────────────────────── */

function inkrush_api_search_users( WP_REST_Request $req ) {
    $q = sanitize_text_field( $req->get_param( 'q' ) ?? '' );
    if ( strlen( $q ) < 2 ) return rest_ensure_response( [ 'users' => [] ] );

    $by_name = get_users( [
        'search'         => "*{$q}*",
        'search_columns' => [ 'display_name', 'user_login' ],
        'number'         => 15,
        'fields'         => 'all',
    ] );

    $by_handle = get_users( [
        'meta_key'     => 'inkrush_handle',
        'meta_value'   => $q,
        'meta_compare' => 'LIKE',
        'number'       => 10,
        'fields'       => 'all',
    ] );

    $seen   = [];
    $result = [];
    foreach ( array_merge( $by_name, $by_handle ) as $user ) {
        if ( in_array( $user->ID, $seen, true ) ) continue;
        $seen[] = $user->ID;
        $challenges = (int) get_user_meta( $user->ID, 'inkrush_challenges_completed', true );
        $result[] = [
            'id'                  => $user->ID,
            'displayName'         => $user->display_name,
            'handle'              => get_user_meta( $user->ID, 'inkrush_handle', true ) ?: '',
            'avatarUrl'           => get_user_meta( $user->ID, 'inkrush_avatar_url', true ) ?: '',
            'completedChallenges' => $challenges,
        ];
    }

    return rest_ensure_response( [ 'users' => $result ] );
}

function inkrush_api_search_posts( WP_REST_Request $req ) {
    $q = sanitize_text_field( $req->get_param( 'q' ) ?? '' );
    if ( strlen( $q ) < 2 ) return rest_ensure_response( [ 'artworks' => [] ] );

    $args = [
        'post_type'      => 'inkrush_artwork',
        'post_status'    => [ 'publish' ],
        's'              => $q,
        'posts_per_page' => 20,
        'meta_query'     => [
            'relation' => 'OR',
            [ 'key' => 'inkrush_hidden', 'compare' => 'NOT EXISTS' ],
            [ 'key' => 'inkrush_hidden', 'value' => '1', 'compare' => '!=' ],
        ],
    ];

    $query    = new WP_Query( $args );
    $me       = get_current_user_id();
    $artworks = [];

    foreach ( $query->posts as $post ) {
        $uid         = (int) $post->post_author;
        $author_data = get_userdata( $uid );

        $user_reacted = [ 'like' => false, 'inspire' => false, 'try' => false ];
        if ( $me ) {
            foreach ( $user_reacted as $type => $_ ) {
                $user_reacted[ $type ] = (bool) get_user_meta( $me, "inkrush_reacted_{$type}_{$post->ID}", true );
            }
        }

        $artworks[] = [
            'id'           => $post->ID,
            'author_id'    => $uid,
            'prompt'       => $post->post_title,
            'description'  => $post->post_content,
            'username'     => $author_data ? $author_data->display_name : 'Artista',
            'handle'       => $uid ? ( get_user_meta( $uid, 'inkrush_handle', true ) ?: '' ) : '',
            'avatar_url'   => $uid ? ( get_user_meta( $uid, 'inkrush_avatar_url', true ) ?: '' ) : '',
            'technique'    => get_post_meta( $post->ID, 'inkrush_technique', true ),
            'variables'    => inkrush_get_post_variables( $post->ID ),
            'rarity'       => get_post_meta( $post->ID, 'inkrush_rarity', true ) ?: 'Común',
            'likes'        => (int) get_post_meta( $post->ID, 'inkrush_likes', true ),
            'inspires'     => (int) get_post_meta( $post->ID, 'inkrush_inspires', true ),
            'tries'        => (int) get_post_meta( $post->ID, 'inkrush_tries', true ),
            'comment_count'=> (int) get_post_meta( $post->ID, 'inkrush_comment_count', true ),
            'userReacted'  => $user_reacted,
            'hidden'       => false,
            'image'        => get_the_post_thumbnail_url( $post->ID, 'medium' ) ?: '',
            'images'       => array_values( array_filter( array_map(
                fn( $id ) => wp_get_attachment_image_url( $id, 'large' ) ?: '',
                json_decode( get_post_meta( $post->ID, 'inkrush_image_ids', true ) ?: '[]', true )
            ) ) ),
            'date'         => $post->post_date,
        ];
    }

    return rest_ensure_response( [ 'artworks' => $artworks ] );
}

/* ──────────────────────────────────────────────────────────────
   TRADUCCIÓN CON IA (Claude Haiku)
────────────────────────────────────────────────────────────── */

function inkrush_api_translate( WP_REST_Request $req ) {
    $api_key = get_option( 'inkrush_anthropic_key', '' );
    if ( empty( $api_key ) ) {
        return new WP_Error( 'no_api_key', 'API key not configured.', [ 'status' => 400 ] );
    }

    $text        = sanitize_textarea_field( $req->get_param( 'text' ) ?? '' );
    $target_lang = sanitize_text_field( $req->get_param( 'target_lang' ) ?? 'en' );

    if ( empty( $text ) ) {
        return new WP_Error( 'invalid_text', 'Text is required.', [ 'status' => 400 ] );
    }
    if ( strlen( $text ) > 2000 ) {
        return new WP_Error( 'text_too_long', 'Text exceeds 2000 characters.', [ 'status' => 400 ] );
    }
    if ( ! in_array( $target_lang, [ 'en', 'es' ], true ) ) {
        $target_lang = 'en';
    }

    $lang_name = $target_lang === 'en' ? 'English' : 'Spanish';

    $response = wp_remote_post( 'https://api.anthropic.com/v1/messages', [
        'timeout' => 15,
        'headers' => [
            'x-api-key'         => $api_key,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ],
        'body' => wp_json_encode( [
            'model'      => 'claude-haiku-4-5-20251001',
            'max_tokens' => 1024,
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => "Translate the following text to {$lang_name}. Return ONLY the translation, no explanations, no quotes.\n\n{$text}",
                ],
            ],
        ] ),
    ] );

    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'api_error', 'Translation service unavailable.', [ 'status' => 503 ] );
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    $translation = $body['content'][0]['text'] ?? '';

    if ( empty( $translation ) ) {
        return new WP_Error( 'empty_response', 'Empty translation response.', [ 'status' => 503 ] );
    }

    return rest_ensure_response( [ 'translation' => $translation ] );
}

/* ──────────────────────────────────────────────────────────────
   TRADUCCIÓN MASIVA DE PARÁMETROS (admin only)
────────────────────────────────────────────────────────────── */

function inkrush_api_translate_missing_params( WP_REST_Request $req ) {
    $api_key = get_option( 'inkrush_anthropic_key', '' );
    if ( empty( $api_key ) ) {
        return new WP_Error( 'no_api_key', 'API key not configured.', [ 'status' => 400 ] );
    }

    $vars    = inkrush_get_variables();
    $missing = array_filter( $vars, fn( $v ) => empty( $v['value_en'] ) );

    if ( empty( $missing ) ) {
        return rest_ensure_response( [ 'translated' => 0, 'message' => 'All parameters already have English translations.' ] );
    }

    // Build a batch of values to translate in a single API call (max 80 items per request)
    $batch_size = 80;
    $chunks     = array_chunk( array_values( $missing ), $batch_size );
    $translated = 0;
    $errors     = [];

    foreach ( $chunks as $chunk ) {
        // Build a numbered list for the prompt
        $lines = [];
        foreach ( $chunk as $i => $v ) {
            $lines[] = ( $i + 1 ) . '. ' . $v['value'];
        }
        $prompt = "Translate each item in this numbered list from Spanish to English. " .
                  "Return ONLY the numbered list with translations, same format, no extra text.\n\n" .
                  implode( "\n", $lines );

        $response = wp_remote_post( 'https://api.anthropic.com/v1/messages', [
            'timeout' => 30,
            'headers' => [
                'x-api-key'         => $api_key,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ],
            'body' => wp_json_encode( [
                'model'      => 'claude-haiku-4-5-20251001',
                'max_tokens' => 2048,
                'messages'   => [ [ 'role' => 'user', 'content' => $prompt ] ],
            ] ),
        ] );

        if ( is_wp_error( $response ) ) {
            $errors[] = 'API request failed for a batch.';
            continue;
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        $raw  = trim( $body['content'][0]['text'] ?? '' );

        if ( empty( $raw ) ) {
            $errors[] = 'Empty response for a batch.';
            continue;
        }

        // Parse "1. translated text" lines
        $result_lines = preg_split( '/\r?\n/', $raw );
        $translations = [];
        foreach ( $result_lines as $line ) {
            $line = trim( $line );
            if ( preg_match( '/^\d+\.\s+(.+)$/', $line, $m ) ) {
                $translations[] = trim( $m[1] );
            }
        }

        // Map translations back to variables by matching IDs
        foreach ( $chunk as $i => $v ) {
            $en = $translations[ $i ] ?? '';
            if ( empty( $en ) ) continue;
            foreach ( $vars as &$stored ) {
                if ( $stored['id'] === $v['id'] ) {
                    $stored['value_en'] = sanitize_text_field( strtolower( $en ) );
                    $translated++;
                    break;
                }
            }
            unset( $stored );
        }
    }

    inkrush_save_variables( $vars );

    $result = [ 'translated' => $translated ];
    if ( ! empty( $errors ) ) $result['errors'] = $errors;
    return rest_ensure_response( $result );
}

function inkrush_api_translate_single_param( WP_REST_Request $req ) {
    $api_key = get_option( 'inkrush_anthropic_key', '' );
    if ( empty( $api_key ) ) {
        return new WP_Error( 'no_api_key', 'API key not configured.', [ 'status' => 400 ] );
    }

    $id   = sanitize_text_field( $req->get_param( 'id' ) );
    $vars = inkrush_get_variables();

    $target = null;
    foreach ( $vars as $v ) {
        if ( $v['id'] === $id ) { $target = $v; break; }
    }

    if ( ! $target ) {
        return new WP_Error( 'not_found', 'Parameter not found.', [ 'status' => 404 ] );
    }

    $response = wp_remote_post( 'https://api.anthropic.com/v1/messages', [
        'timeout' => 15,
        'headers' => [
            'x-api-key'         => $api_key,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ],
        'body' => wp_json_encode( [
            'model'      => 'claude-haiku-4-5-20251001',
            'max_tokens' => 128,
            'messages'   => [ [
                'role'    => 'user',
                'content' => "Translate this short Spanish art term to English. Return ONLY the translation, no quotes, no explanation.\n\n" . $target['value'],
            ] ],
        ] ),
    ] );

    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'api_error', 'Translation service unavailable.', [ 'status' => 503 ] );
    }

    $body    = json_decode( wp_remote_retrieve_body( $response ), true );
    $en_val  = sanitize_text_field( strtolower( trim( $body['content'][0]['text'] ?? '' ) ) );

    if ( empty( $en_val ) ) {
        return new WP_Error( 'empty_response', 'Empty translation response.', [ 'status' => 503 ] );
    }

    foreach ( $vars as &$v ) {
        if ( $v['id'] === $id ) {
            $v['value_en'] = $en_val;
            break;
        }
    }
    unset( $v );

    inkrush_save_variables( $vars );

    return rest_ensure_response( [ 'success' => true, 'id' => $id, 'value_en' => $en_val ] );
}

/* ──────────────────────────────────────────────────────────────
   MAILCHIMP — suscripción automática al registrarse
────────────────────────────────────────────────────────────── */

/**
 * Suscribe un email a la audiencia Mailchimp configurada.
 * Usa PUT /members/{hash} (upsert) para que sea idempotente:
 * si el email ya existe no falla ni sobreescribe el estado.
 * Cualquier error se silencia — nunca debe bloquear el registro.
 */
function inkrush_mailchimp_subscribe( $email, $name = '' ) {
    $api_key = get_option( 'inkrush_mailchimp_api_key', '' );
    $list_id = get_option( 'inkrush_mailchimp_list_id', '' );

    if ( ! $api_key || ! $list_id ) return;

    // El data center está al final de la clave: "xxxxxxxx-us14" → "us14"
    $dc = substr( $api_key, strrpos( $api_key, '-' ) + 1 );
    if ( ! $dc || $dc === $api_key ) return;

    $subscriber_hash = md5( strtolower( trim( $email ) ) );
    $url = "https://{$dc}.api.mailchimp.com/3.0/lists/{$list_id}/members/{$subscriber_hash}";

    $body = [
        'email_address' => $email,
        'status_if_new' => 'subscribed', // no cambia el estado si ya existe
    ];

    if ( $name ) {
        $parts = explode( ' ', $name, 2 );
        $body['merge_fields'] = [
            'FNAME' => $parts[0],
            'LNAME' => $parts[1] ?? '',
        ];
    }

    wp_remote_request( $url, [
        'method'  => 'PUT',
        'timeout' => 8,
        'headers' => [
            'Authorization' => 'Basic ' . base64_encode( 'musai:' . $api_key ),
            'Content-Type'  => 'application/json',
        ],
        'body' => wp_json_encode( $body ),
    ] );
    // Resultado ignorado — los errores de Mailchimp no deben afectar el registro
}

/* ──────────────────────────────────────────────────────────────
   GET /music-srcs — URLs de audio por track
────────────────────────────────────────────────────────────── */
function inkrush_api_get_music_srcs() {
    $srcs = get_option( 'inkrush_music_srcs', [] );
    return rest_ensure_response( (object) $srcs );
}

/* ──────────────────────────────────────────────────────────────
   GET /config — niveles, temporadas y rareza para el frontend
────────────────────────────────────────────────────────────── */
function inkrush_api_get_config() {

    $levels = [
        [ 'id'=>1, 'name'=>'Nuevo Artista',     'name_en'=>'New Artist',         'minChallenges'=>0  ],
        [ 'id'=>2, 'name'=>'Artista Activo',    'name_en'=>'Active Artist',      'minChallenges'=>5  ],
        [ 'id'=>3, 'name'=>'Creador Constante', 'name_en'=>'Consistent Creator', 'minChallenges'=>10 ],
        [ 'id'=>4, 'name'=>'Inspirador',        'name_en'=>'Inspirer',           'minChallenges'=>20 ],
        [ 'id'=>5, 'name'=>'Maestro del Reto',  'name_en'=>'Challenge Master',   'minChallenges'=>30 ],
    ];

    $season_labels = [
        'Primavera'    => 'Spring',
        'Verano'       => 'Summer',
        'Otoño'        => 'Autumn',
        'Invierno'     => 'Winter',
        'Halloween'    => 'Halloween',
        'Navidad'      => 'Christmas',
        'San Valentín' => "Valentine's",
    ];

    $rarity_labels = [
        'Común'      => [ 'name'=>'Susurro',     'name_en'=>'Whisper'     ],
        'Raro'       => [ 'name'=>'Visión',      'name_en'=>'Vision'      ],
        'Épico'      => [ 'name'=>'Éxtasis',     'name_en'=>'Ecstasy'     ],
        'Legendario' => [ 'name'=>'✦ Epifanía',  'name_en'=>'✦ Epiphany'  ],
    ];

    return rest_ensure_response( [
        'levels'       => $levels,
        'seasonLabels' => $season_labels,
        'rarityLabels' => $rarity_labels,
    ] );
}

/* ──────────────────────────────────────────────────────────────
   PUSH SUBSCRIPTION ENDPOINTS
────────────────────────────────────────────────────────────── */

function inkrush_api_push_subscribe( WP_REST_Request $req ) {
    global $wpdb;
    $uid      = get_current_user_id();
    $endpoint = sanitize_text_field( $req->get_param('endpoint') ?? '' );
    $p256dh   = sanitize_text_field( $req->get_param('p256dh')   ?? '' );
    $auth     = sanitize_text_field( $req->get_param('auth')      ?? '' );

    if ( ! $endpoint || ! $p256dh || ! $auth )
        return new WP_Error( 'invalid', 'Datos de suscripción incompletos.', [ 'status' => 400 ] );

    $table = $wpdb->prefix . 'inkrush_push_subs';
    $wpdb->delete( $table, [ 'endpoint' => $endpoint ] );
    $wpdb->insert( $table, [
        'user_id'    => $uid,
        'endpoint'   => $endpoint,
        'p256dh'     => $p256dh,
        'auth'       => $auth,
        'created_at' => current_time( 'mysql', true ),
    ], [ '%d', '%s', '%s', '%s', '%s' ] );

    return rest_ensure_response( [ 'success' => true ] );
}

function inkrush_api_push_unsubscribe( WP_REST_Request $req ) {
    global $wpdb;
    $uid      = get_current_user_id();
    $endpoint = sanitize_text_field( $req->get_param('endpoint') ?? '' );

    $table = $wpdb->prefix . 'inkrush_push_subs';
    if ( $endpoint ) {
        $wpdb->delete( $table, [ 'user_id' => $uid, 'endpoint' => $endpoint ] );
    } else {
        $wpdb->delete( $table, [ 'user_id' => $uid ] );
    }

    return rest_ensure_response( [ 'success' => true ] );
}

function inkrush_api_push_status( WP_REST_Request $req ) {
    global $wpdb;
    $uid   = get_current_user_id();
    $table = $wpdb->prefix . 'inkrush_push_subs';
    $count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$table} WHERE user_id = %d", $uid ) );

    return rest_ensure_response( [
        'subscribed' => $count > 0,
        'musaiHour'  => get_user_meta( $uid, 'inkrush_musai_hour', true ) ?: '',
    ] );
}

function inkrush_api_push_musai_hour( WP_REST_Request $req ) {
    $uid  = get_current_user_id();
    $hour = sanitize_text_field( $req->get_param('hour') ?? '' );

    if ( $hour && ! preg_match( '/^\d{2}:\d{2}$/', $hour ) )
        return new WP_Error( 'invalid', 'Formato de hora inválido.', [ 'status' => 400 ] );

    if ( $hour ) {
        update_user_meta( $uid, 'inkrush_musai_hour', $hour );
    } else {
        delete_user_meta( $uid, 'inkrush_musai_hour' );
    }

    return rest_ensure_response( [ 'success' => true ] );
}
