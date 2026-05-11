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

    $author = (int) $req->get_param('author');

    $args = [
        'post_type'      => 'inkrush_artwork',
        'post_status'    => 'publish',
        'posts_per_page' => 20,
        'paged'          => $page,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'meta_query'     => [],
    ];

    if ( $author )    $args['author']        = $author;
    if ( $technique ) $args['meta_query'][] = [ 'key'=>'inkrush_technique', 'value'=>$technique ];
    if ( $rarity )    $args['meta_query'][] = [ 'key'=>'inkrush_rarity',    'value'=>$rarity    ];

    $query = new WP_Query($args);
    $posts = [];

    foreach ( $query->posts as $post ) {
        $uid    = (int) $post->post_author;
        $author = get_userdata($uid);
        $posts[] = [
            'id'         => $post->ID,
            'author_id'  => $uid,
            'prompt'     => $post->post_title,
            'username'   => $author ? $author->display_name : 'Artista',
            'avatar_url' => $uid ? ( get_user_meta( $uid, 'inkrush_avatar_url', true ) ?: '' ) : '',
            'technique'  => get_post_meta( $post->ID, 'inkrush_technique', true ),
            'variables' => json_decode( get_post_meta( $post->ID, 'inkrush_variables', true ) ?: '[]', true ),
            'rarity'    => get_post_meta( $post->ID, 'inkrush_rarity', true ) ?: 'Común',
            'likes'     => (int) get_post_meta( $post->ID, 'inkrush_likes', true ),
            'inspires'  => (int) get_post_meta( $post->ID, 'inkrush_inspires', true ),
            'tries'     => (int) get_post_meta( $post->ID, 'inkrush_tries', true ),
            'image'     => get_the_post_thumbnail_url( $post->ID, 'large' ) ?: '',
            'images'    => array_values( array_filter( array_map(
                fn($id) => wp_get_attachment_image_url( $id, 'large' ) ?: '',
                json_decode( get_post_meta( $post->ID, 'inkrush_image_ids', true ) ?: '[]', true )
            ) ) ),
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

/* ──────────────────────────────────────────────────────────────
   REGISTRO
────────────────────────────────────────────────────────────── */

function inkrush_api_register( WP_REST_Request $req ) {
    $email    = sanitize_email( $req->get_param('email') ?? '' );
    $password = $req->get_param('password') ?? '';
    $name     = sanitize_text_field( $req->get_param('displayName') ?? 'Artista' );

    if ( ! is_email( $email ) )
        return new WP_Error('invalid_email', 'Email inválido.', ['status'=>400]);
    if ( strlen( $password ) < 6 )
        return new WP_Error('weak_password', 'Contraseña mínimo 6 caracteres.', ['status'=>400]);
    if ( email_exists( $email ) )
        return new WP_Error('email_exists', 'Este email ya está registrado.', ['status'=>409]);

    $username = sanitize_user( explode('@', $email)[0] . '_' . wp_rand(100,999) );
    $user_id  = wp_create_user( $username, $password, $email );
    if ( is_wp_error( $user_id ) ) return $user_id;

    wp_update_user( ['ID' => $user_id, 'display_name' => $name] );
    ( new WP_User( $user_id ) )->set_role( 'ilustrador' );
    update_user_meta( $user_id, 'inkrush_bio', '' );

    /* Login automático */
    wp_set_auth_cookie( $user_id, false );

    return rest_ensure_response( [
        'success'     => true,
        'userId'      => $user_id,
        'displayName' => $name,
        'username'    => $username,
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

    return rest_ensure_response( ['success' => true] );
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

    return rest_ensure_response( [
        'userId'      => $uid,
        'username'    => $user->user_login,
        'displayName' => $user->display_name,
        'bio'         => get_user_meta( $uid, 'inkrush_bio', true ) ?: '',
        'avatarUrl'   => get_user_meta( $uid, 'inkrush_avatar_url', true ) ?: get_avatar_url( $uid, ['size'=>96] ),
        'level'       => (int) get_user_meta( $uid, 'inkrush_level', true ) ?: 1,
        'challenges'  => (int) get_user_meta( $uid, 'inkrush_challenges_completed', true ),
        'streak'      => (int) get_user_meta( $uid, 'inkrush_streak', true ),
        'followers'   => (int) get_user_meta( $uid, 'inkrush_followers_count', true ),
        'following'   => (int) get_user_meta( $uid, 'inkrush_following_count', true ),
        'isFollowing' => $is_following,
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
