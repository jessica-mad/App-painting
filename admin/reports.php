<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/* ──────────────────────────────────────────────────────────────
   Página de moderación de reportes — WP Admin > InkRush > Reportes
────────────────────────────────────────────────────────────── */

function inkrush_page_reports() {
    $notice = '';
    $notice_type = 'success';

    /* ── Procesar acciones individuales ── */
    if (
        isset( $_POST['inkrush_report_action'], $_POST['post_id'] )
        && check_admin_referer( 'inkrush_report_action' )
    ) {
        $post_id = (int) $_POST['post_id'];
        $action  = sanitize_text_field( $_POST['inkrush_report_action'] );
        $post    = get_post( $post_id );

        if ( $post && $post->post_type === 'inkrush_artwork' ) {
            switch ( $action ) {
                case 'approve':
                    delete_post_meta( $post_id, 'inkrush_hidden' );
                    delete_post_meta( $post_id, 'inkrush_reports' );
                    delete_post_meta( $post_id, 'inkrush_reports_detail' );
                    $notice = '✅ Obra aprobada y reportes eliminados.';
                    break;
                case 'hide':
                    update_post_meta( $post_id, 'inkrush_hidden', '1' );
                    delete_post_meta( $post_id, 'inkrush_reports' );
                    delete_post_meta( $post_id, 'inkrush_reports_detail' );
                    $notice = '👁 Obra ocultada al público. Reportes limpiados.';
                    break;
                case 'delete':
                    wp_delete_post( $post_id, true );
                    $notice = '🗑 Obra eliminada permanentemente.';
                    break;
            }
        } else {
            $notice      = '⚠ Obra no encontrada.';
            $notice_type = 'error';
        }
    }

    /* ── Acción masiva: limpiar todas las obras con 0 contenido dañino ── */
    if ( isset( $_POST['inkrush_bulk_action'] ) && check_admin_referer( 'inkrush_bulk_reports' ) ) {
        $bulk    = sanitize_text_field( $_POST['inkrush_bulk_action'] );
        $ids     = array_map( 'intval', (array) ( $_POST['bulk_ids'] ?? [] ) );
        $count   = 0;
        foreach ( $ids as $pid ) {
            if ( ! get_post( $pid ) ) continue;
            if ( $bulk === 'approve_all' ) {
                delete_post_meta( $pid, 'inkrush_hidden' );
                delete_post_meta( $pid, 'inkrush_reports' );
                delete_post_meta( $pid, 'inkrush_reports_detail' );
                $count++;
            } elseif ( $bulk === 'delete_all' ) {
                wp_delete_post( $pid, true );
                $count++;
            }
        }
        $notice = "✅ Acción masiva aplicada a {$count} obra(s).";
    }

    /* ── Query de obras reportadas ── */
    $paged = max( 1, (int) ( $_GET['paged'] ?? 1 ) );
    $query = new WP_Query( [
        'post_type'      => 'inkrush_artwork',
        'post_status'    => [ 'publish', 'private' ],
        'posts_per_page' => 20,
        'paged'          => $paged,
        'meta_query'     => [
            [ 'key' => 'inkrush_reports', 'value' => '0', 'compare' => '>', 'type' => 'NUMERIC' ],
        ],
        'orderby'  => 'meta_value_num',
        'meta_key' => 'inkrush_reports',
        'order'    => 'DESC',
    ] );

    $total_pages = $query->max_num_pages;
    $total_found = $query->found_posts;

    /* conteo de auto-ocultas */
    $hidden_count = (int) ( new WP_Query( [
        'post_type'      => 'inkrush_artwork',
        'post_status'    => [ 'publish', 'private' ],
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'meta_query'     => [ [ 'key' => 'inkrush_hidden', 'value' => '1' ] ],
    ] ) )->found_posts;

    ?>
    <div class="wrap">
        <h1>🚨 InkRush — Reportes y moderación</h1>

        <?php if ( $notice ) : ?>
            <div class="notice notice-<?php echo $notice_type === 'error' ? 'error' : 'success'; ?> is-dismissible">
                <p><?php echo esc_html( $notice ); ?></p>
            </div>
        <?php endif; ?>

        <!-- Resumen de estado -->
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;">
            <?php
            $stats = [
                [ 'n' => $total_found, 'l' => 'obras reportadas', 'c' => $total_found > 0 ? '#FFE9A8' : '#C9F2D6', 'i' => '🚨' ],
                [ 'n' => $hidden_count,'l' => 'obras ocultas',    'c' => '#F0EDE0',  'i' => '👁' ],
            ];
            foreach ( $stats as $s ) : ?>
                <div style="display:inline-flex;align-items:center;gap:12px;background:<?php echo $s['c']; ?>;border:2px solid #111;border-radius:10px;padding:12px 20px;">
                    <span style="font-size:24px;"><?php echo $s['i']; ?></span>
                    <div>
                        <strong style="font-size:28px;line-height:1;"><?php echo $s['n']; ?></strong><br>
                        <small style="color:#555;font-size:12px;"><?php echo esc_html( $s['l'] ); ?></small>
                    </div>
                </div>
            <?php endforeach; ?>
            <?php if ( $total_found === 0 ) : ?>
                <div style="display:inline-flex;align-items:center;gap:12px;background:#C9F2D6;border:2px solid #111;border-radius:10px;padding:12px 20px;">
                    <span style="font-size:24px;">✅</span>
                    <div>
                        <strong style="font-size:16px;">Todo limpio</strong><br>
                        <small style="color:#555;">No hay obras reportadas</small>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <?php if ( $query->have_posts() ) : ?>

        <!-- Formulario de acciones masivas -->
        <form method="post" id="inkrush-reports-form">
            <?php wp_nonce_field( 'inkrush_bulk_reports' ); ?>

            <!-- Barra de acciones masivas -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px 14px;background:#f9f6ef;border:2px solid #111;border-radius:10px;">
                <select name="inkrush_bulk_action" style="height:34px;border:2px solid #111;border-radius:7px;padding:0 10px;font-weight:700;min-width:200px;">
                    <option value="">— Acción masiva —</option>
                    <option value="approve_all">✅ Aprobar seleccionadas (limpiar reportes)</option>
                    <option value="delete_all">🗑 Eliminar seleccionadas permanentemente</option>
                </select>
                <button type="submit" name="inkrush_bulk_action_submit"
                    onclick="return document.querySelectorAll('input[name=\'bulk_ids[]\']:checked').length > 0 || (alert('Selecciona al menos una obra.'), false)"
                    style="height:34px;padding:0 16px;background:#DFFF23;border:2px solid #111;border-radius:7px;font-weight:800;cursor:pointer;">
                    Aplicar
                </button>
                <span style="color:#888;font-size:12px;margin-left:8px;">
                    Total: <?php echo $total_found; ?> obra(s) en página <?php echo $paged; ?>/<?php echo max(1,$total_pages); ?>
                </span>
            </div>

            <!-- Tabla de obras reportadas -->
            <table class="widefat fixed" style="border:2px solid #111;border-radius:12px;overflow:hidden;border-collapse:separate;">
                <thead>
                    <tr style="background:#111;color:#DFFF23;">
                        <th style="width:36px;padding:10px 14px;">
                            <input type="checkbox" id="inkrush-check-all" title="Seleccionar todas"
                                onclick="document.querySelectorAll('input[name=\'bulk_ids[]\']').forEach(c=>c.checked=this.checked)">
                        </th>
                        <th style="width:90px;padding:10px 14px;">Imagen</th>
                        <th style="padding:10px 14px;">Obra / Artista</th>
                        <th style="width:90px;padding:10px 14px;text-align:center;">Reportes</th>
                        <th style="padding:10px 14px;">Motivos</th>
                        <th style="width:60px;padding:10px 14px;text-align:center;">Estado</th>
                        <th style="width:240px;padding:10px 14px;text-align:center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <?php $i = 0; while ( $query->have_posts() ) : $query->the_post();
                        $post_id  = get_the_ID();
                        $author   = get_userdata( (int) get_post_field( 'post_author', $post_id ) );
                        $reports  = (int) get_post_meta( $post_id, 'inkrush_reports', true );
                        $hidden   = (bool) get_post_meta( $post_id, 'inkrush_hidden', true );
                        $detail   = json_decode( get_post_meta( $post_id, 'inkrush_reports_detail', true ) ?: '[]', true );
                        $img      = get_the_post_thumbnail_url( $post_id, 'thumbnail' ) ?: '';
                        $bg       = $i % 2 === 0 ? '#FFFDF3' : '#F8F4E9';
                        $i++;
                    ?>
                    <tr style="background:<?php echo $bg; ?>;vertical-align:top;">
                        <!-- Checkbox -->
                        <td style="padding:12px 14px;text-align:center;">
                            <input type="checkbox" name="bulk_ids[]" value="<?php echo $post_id; ?>">
                        </td>

                        <!-- Imagen -->
                        <td style="padding:12px 14px;">
                            <?php if ( $img ) : ?>
                                <a href="<?php echo esc_url( get_edit_post_link( $post_id ) ); ?>" target="_blank">
                                    <img src="<?php echo esc_url( $img ); ?>" alt="" style="width:70px;height:90px;object-fit:cover;border:2px solid #111;border-radius:8px;display:block;">
                                </a>
                            <?php else : ?>
                                <div style="width:70px;height:90px;background:#e8e4d9;border:2px solid #aaa;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;">🖼</div>
                            <?php endif; ?>
                        </td>

                        <!-- Obra / Artista -->
                        <td style="padding:12px 14px;">
                            <strong style="display:block;font-size:13px;line-height:1.3;">
                                <a href="<?php echo esc_url( get_edit_post_link( $post_id ) ); ?>" target="_blank" style="color:#111;text-decoration:none;">
                                    <?php echo esc_html( get_the_title() ?: '(sin título)' ); ?>
                                </a>
                            </strong>
                            <span style="font-size:11px;color:#777;display:block;margin-top:3px;">
                                por <strong><?php echo $author ? esc_html( $author->display_name ) : 'Desconocido'; ?></strong>
                                <?php if ( $author ) : ?>
                                    · <a href="<?php echo esc_url( get_edit_user_link( $author->ID ) ); ?>" target="_blank" style="color:#888;font-size:10px;">ver usuario</a>
                                <?php endif; ?>
                            </span>
                            <span style="font-size:10px;color:#aaa;margin-top:2px;display:block;">
                                <?php echo esc_html( get_the_date( 'd M Y · H:i', $post_id ) ); ?>
                            </span>
                        </td>

                        <!-- Contador -->
                        <td style="padding:12px 14px;text-align:center;">
                            <span style="display:inline-block;background:<?php echo $reports >= 5 ? '#FF8A8A' : '#FFE9A8'; ?>;border:2px solid #111;border-radius:999px;padding:4px 12px;font-size:14px;font-weight:900;">
                                <?php echo $reports; ?>
                            </span>
                        </td>

                        <!-- Motivos -->
                        <td style="padding:12px 14px;">
                            <?php if ( empty( $detail ) ) : ?>
                                <span style="color:#aaa;font-size:11px;">—</span>
                            <?php else :
                                $no_cumple = count( array_filter( $detail, fn($d) => ($d['reason'] ?? '') === 'no_cumple' ) );
                                $denuncia  = count( array_filter( $detail, fn($d) => ($d['reason'] ?? '') === 'denuncia' ) );
                            ?>
                                <div style="font-size:11px;line-height:1.8;">
                                    <?php if ( $no_cumple ) : ?>
                                        <span style="background:#FFE9A8;border:1.5px solid #111;border-radius:999px;padding:2px 8px;font-weight:700;">
                                            ⚠ No cumple el reto × <?php echo $no_cumple; ?>
                                        </span><br>
                                    <?php endif; ?>
                                    <?php if ( $denuncia ) : ?>
                                        <span style="background:#FF8A8A;border:1.5px solid #111;border-radius:999px;padding:2px 8px;font-weight:700;">
                                            🚨 Denuncia × <?php echo $denuncia; ?>
                                        </span>
                                    <?php endif; ?>
                                </div>
                                <!-- Últimos 3 reportes con fecha -->
                                <details style="margin-top:6px;">
                                    <summary style="font-size:10px;color:#888;cursor:pointer;">Ver detalle (<?php echo count($detail); ?>)</summary>
                                    <div style="margin-top:4px;max-height:100px;overflow-y:auto;">
                                    <?php foreach ( array_slice( array_reverse($detail), 0, 10 ) as $d ) :
                                        $date_str = ! empty($d['date']) ? date_i18n( 'd M H:i', strtotime($d['date']) ) : '';
                                    ?>
                                        <div style="font-size:10px;color:#666;border-bottom:1px solid #eee;padding:2px 0;">
                                            <?php echo $d['reason'] === 'no_cumple' ? '⚠ No cumple' : '🚨 Denuncia'; ?>
                                            <?php if ( $date_str ) echo ' · ' . esc_html( $date_str ); ?>
                                            · uid:<?php echo (int)($d['uid']??0); ?>
                                        </div>
                                    <?php endforeach; ?>
                                    </div>
                                </details>
                            <?php endif; ?>
                        </td>

                        <!-- Estado -->
                        <td style="padding:12px 14px;text-align:center;">
                            <?php if ( $hidden ) : ?>
                                <span style="background:#111;color:#DFFF23;border-radius:999px;padding:3px 10px;font-size:10px;font-weight:800;">OCULTA</span>
                            <?php else : ?>
                                <span style="background:#C9F2D6;border:1.5px solid #111;border-radius:999px;padding:3px 10px;font-size:10px;font-weight:700;">Visible</span>
                            <?php endif; ?>
                        </td>

                        <!-- Acciones individuales -->
                        <td style="padding:10px 12px;text-align:center;">
                            <div style="display:flex;flex-direction:column;gap:6px;">

                                <!-- Aprobar -->
                                <form method="post" style="margin:0;">
                                    <?php wp_nonce_field( 'inkrush_report_action' ); ?>
                                    <input type="hidden" name="post_id" value="<?php echo $post_id; ?>">
                                    <input type="hidden" name="inkrush_report_action" value="approve">
                                    <button type="submit" style="width:100%;height:30px;background:#C9F2D6;border:2px solid #111;border-radius:7px;font-weight:800;font-size:11px;cursor:pointer;" title="Marcar como OK: quitar reportes y mostrar la obra">
                                        ✅ Aprobar
                                    </button>
                                </form>

                                <!-- Ocultar -->
                                <?php if ( ! $hidden ) : ?>
                                <form method="post" style="margin:0;">
                                    <?php wp_nonce_field( 'inkrush_report_action' ); ?>
                                    <input type="hidden" name="post_id" value="<?php echo $post_id; ?>">
                                    <input type="hidden" name="inkrush_report_action" value="hide">
                                    <button type="submit" style="width:100%;height:30px;background:#FFE9A8;border:2px solid #111;border-radius:7px;font-weight:800;font-size:11px;cursor:pointer;" title="Ocultar del feed público">
                                        👁 Ocultar
                                    </button>
                                </form>
                                <?php endif; ?>

                                <!-- Eliminar -->
                                <form method="post" style="margin:0;" onsubmit="return confirm('¿Eliminar permanentemente esta obra? Esta acción no se puede deshacer.')">
                                    <?php wp_nonce_field( 'inkrush_report_action' ); ?>
                                    <input type="hidden" name="post_id" value="<?php echo $post_id; ?>">
                                    <input type="hidden" name="inkrush_report_action" value="delete">
                                    <button type="submit" style="width:100%;height:30px;background:#FF8A8A;border:2px solid #111;border-radius:7px;font-weight:800;font-size:11px;cursor:pointer;">
                                        🗑 Eliminar
                                    </button>
                                </form>

                            </div>
                        </td>
                    </tr>
                    <?php endwhile; wp_reset_postdata(); ?>
                </tbody>
            </table>
        </form>

        <!-- Paginación -->
        <?php if ( $total_pages > 1 ) :
            $base_url = admin_url( 'admin.php?page=inkrush-reports' );
        ?>
        <div style="display:flex;gap:8px;margin-top:20px;align-items:center;">
            <?php for ( $p = 1; $p <= $total_pages; $p++ ) :
                $active = $p === $paged;
            ?>
                <a href="<?php echo esc_url( add_query_arg( 'paged', $p, $base_url ) ); ?>"
                    style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:2px solid #111;border-radius:8px;font-weight:800;font-size:13px;text-decoration:none;
                    background:<?php echo $active ? '#DFFF23' : '#fff'; ?>;color:#111;">
                    <?php echo $p; ?>
                </a>
            <?php endfor; ?>
        </div>
        <?php endif; ?>

        <?php else : /* sin reportes */ ?>
            <div style="background:#C9F2D6;border:2px solid #111;border-radius:12px;padding:24px 28px;max-width:480px;">
                <p style="font-size:20px;font-weight:900;margin:0 0 8px;">✅ Sin reportes pendientes</p>
                <p style="color:#555;font-size:13px;margin:0;">
                    Todas las obras están limpias. Los reportes aparecerán aquí en cuanto los usuarios marquen contenido inapropiado.
                </p>
            </div>
        <?php endif; ?>

        <!-- Leyenda / info -->
        <div style="margin-top:32px;border:2px solid #111;border-radius:12px;padding:16px 20px;max-width:760px;background:#111;color:#fff;">
            <p style="font-weight:900;margin:0 0 10px;color:#DFFF23;">📋 Cómo funciona la moderación automática</p>
            <ul style="margin:0;padding-left:18px;line-height:2.2;font-size:13px;color:rgba(255,255,255,.75);">
                <li>Una obra se <strong style="color:#fff;">auto-oculta</strong> cuando acumula <strong style="color:#DFFF23;">≥ 5 reportes</strong>.</li>
                <li><strong style="color:#fff;">Aprobar</strong> limpia todos los reportes y vuelve a mostrar la obra en el feed.</li>
                <li><strong style="color:#fff;">Ocultar</strong> la retira del feed pero la conserva en la base de datos.</li>
                <li><strong style="color:#fff;">Eliminar</strong> borra permanentemente la obra y sus imágenes asociadas.</li>
            </ul>
        </div>
    </div>
    <?php
}
