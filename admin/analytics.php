<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/* ──────────────────────────────────────────────────────────────
   DB TABLE
────────────────────────────────────────────────────────────── */

function inkrush_create_analytics_table() {
    global $wpdb;
    $table   = $wpdb->prefix . 'inkrush_events';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE {$table} (
        id         bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id    bigint(20) UNSIGNED NOT NULL,
        session_id varchar(36)         NOT NULL,
        event      varchar(100)        NOT NULL,
        props      longtext            DEFAULT NULL,
        device     varchar(20)         DEFAULT 'mobile',
        created_at datetime            NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_user_event (user_id, event),
        KEY idx_event_date (event, created_at),
        KEY idx_session (session_id),
        KEY idx_date (created_at)
    ) {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

/* ──────────────────────────────────────────────────────────────
   ADMIN PAGE
────────────────────────────────────────────────────────────── */

function inkrush_page_analytics() {
    global $wpdb;

    /* ── Save excluded users ── */
    if ( isset( $_POST['inkrush_save_exclude'] ) && check_admin_referer( 'inkrush_analytics_exclude' ) ) {
        $raw = sanitize_text_field( $_POST['exclude_user_ids'] ?? '' );
        $ids = implode( ',', array_filter( array_map( 'intval', explode( ',', $raw ) ) ) );
        update_option( 'inkrush_analytics_exclude_users', $ids );
    }

    $range = isset( $_GET['range'] ) ? (int) $_GET['range'] : 30;
    if ( ! in_array( $range, [ 7, 30, 90 ], true ) ) $range = 30;

    $table    = $wpdb->prefix . 'inkrush_events';
    $since    = gmdate( 'Y-m-d H:i:s', strtotime( "-{$range} days" ) );

    /* ── Exclusion list ── */
    $excluded_raw = get_option( 'inkrush_analytics_exclude_users', '' );
    $excluded_ids = array_filter( array_map( 'intval', explode( ',', $excluded_raw ) ) );
    $excl_sql     = $excluded_ids
        ? 'AND user_id NOT IN (' . implode( ',', $excluded_ids ) . ')'
        : '';

    /* ── KPI queries ── */
    $active_users = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(DISTINCT user_id) FROM {$table} WHERE created_at >= %s {$excl_sql}", $since
    ) );
    $sessions = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(DISTINCT session_id) FROM {$table} WHERE created_at >= %s {$excl_sql}", $since
    ) );
    $total_events = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM {$table} WHERE created_at >= %s {$excl_sql}", $since
    ) );
    $avg_sessions = $active_users > 0 ? round( $sessions / $active_users, 1 ) : 0;

    /* ── Daily active users chart ── */
    $daily_rows = $wpdb->get_results( $wpdb->prepare(
        "SELECT DATE(created_at) as day, COUNT(DISTINCT user_id) as users
         FROM {$table}
         WHERE created_at >= %s {$excl_sql}
         GROUP BY day ORDER BY day",
        $since
    ) );

    /* ── Top screens ── */
    $screen_rows = $wpdb->get_results( $wpdb->prepare(
        "SELECT props, COUNT(*) as n
         FROM {$table}
         WHERE event='screen_view' AND created_at >= %s {$excl_sql}
         GROUP BY props ORDER BY n DESC LIMIT 10",
        $since
    ) );
    $screen_labels = [];
    $screen_counts = [];
    foreach ( $screen_rows as $row ) {
        $decoded = json_decode( $row->props, true );
        $label   = is_array( $decoded ) && isset( $decoded['screen'] ) ? $decoded['screen'] : $row->props;
        $screen_labels[] = esc_js( $label );
        $screen_counts[] = (int) $row->n;
    }

    /* ── Top events table ── */
    $event_rows = $wpdb->get_results( $wpdb->prepare(
        "SELECT event, COUNT(*) as total, COUNT(DISTINCT user_id) as users
         FROM {$table}
         WHERE created_at >= %s {$excl_sql}
         GROUP BY event ORDER BY total DESC LIMIT 15",
        $since
    ) );

    /* ── Pomodoro funnel ── */
    $funnel_events = [ 'roll', 'idea_saved', 'timer_started', 'timer_completed', 'upload_completed' ];
    $funnel_counts = [];
    foreach ( $funnel_events as $fe ) {
        $funnel_counts[ $fe ] = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE event = %s AND created_at >= %s {$excl_sql}",
            $fe, $since
        ) );
    }
    $funnel_first = $funnel_counts['roll'] ?: 1;

    /* ── Music popularity ── */
    $music_rows = $wpdb->get_results( $wpdb->prepare(
        "SELECT props, COUNT(*) as n
         FROM {$table}
         WHERE event='music_selected' AND created_at >= %s {$excl_sql}
         GROUP BY props ORDER BY n DESC",
        $since
    ) );
    $music_labels = [];
    $music_counts = [];
    foreach ( $music_rows as $row ) {
        $decoded = json_decode( $row->props, true );
        $label   = is_array( $decoded ) && isset( $decoded['track'] ) ? $decoded['track'] : $row->props;
        $music_labels[] = esc_js( $label );
        $music_counts[] = (int) $row->n;
    }

    /* ── Events by session (pivot) ── */
    // Top event types to show as columns (max 10)
    $col_events = $wpdb->get_col( $wpdb->prepare(
        "SELECT event FROM {$table}
         WHERE created_at >= %s {$excl_sql}
         GROUP BY event ORDER BY COUNT(*) DESC LIMIT 10",
        $since
    ) );

    // Per-session, per-event counts + metadata
    $session_meta = $wpdb->get_results( $wpdb->prepare(
        "SELECT session_id, user_id, device,
                MIN(created_at) as first_seen,
                MAX(created_at) as last_seen
         FROM {$table}
         WHERE created_at >= %s {$excl_sql}
         GROUP BY session_id, user_id, device
         ORDER BY last_seen DESC
         LIMIT 30",
        $since
    ) );

    // Per-session, per-event counts
    $session_ids = array_column( $session_meta, 'session_id' );
    $session_events = [];
    if ( $session_ids ) {
        $placeholders = implode( ',', array_fill( 0, count( $session_ids ), '%s' ) );
        $args = array_merge( [ $since ], $session_ids );
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT session_id, event, COUNT(*) as n
             FROM {$table}
             WHERE created_at >= %s AND session_id IN ({$placeholders})
             GROUP BY session_id, event",
            ...$args
        ) );
        foreach ( $rows as $r ) {
            $session_events[ $r->session_id ][ $r->event ] = (int) $r->n;
        }
    }

    /* Inline styles */
    $card_style = 'border:2px solid #111;border-radius:12px;background:#FFFDF3;padding:20px 24px;';
    $accent     = '#DFFF23';
    $btn_base   = 'border:2px solid #111;border-radius:8px;padding:6px 16px;font-weight:800;font-size:13px;cursor:pointer;';
    ?>
    <div class="wrap" style="font-family:sans-serif;max-width:1200px;">
      <h1 style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        📊 Analytics
      </h1>

      <!-- Exclude users -->
      <div style="<?php echo $card_style; ?>margin-bottom:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <span style="font-weight:800;font-size:13px;white-space:nowrap;">🚫 Excluir usuarios</span>
        <form method="post" style="display:flex;align-items:center;gap:10px;flex:1;min-width:240px;">
          <?php wp_nonce_field( 'inkrush_analytics_exclude' ); ?>
          <input type="text" name="exclude_user_ids"
            value="<?php echo esc_attr( $excluded_raw ); ?>"
            placeholder="IDs separados por coma, ej: 1,5,12"
            style="flex:1;height:34px;border:2px solid #111;border-radius:8px;padding:0 10px;font-family:monospace;font-size:13px;">
          <button type="submit" name="inkrush_save_exclude" style="<?php echo $btn_base; ?>background:<?php echo $accent; ?>">
            Guardar
          </button>
        </form>
        <span style="font-size:12px;color:#666;">
          Tu ID: <strong><?php echo get_current_user_id(); ?></strong>
          (<?php echo esc_html( wp_get_current_user()->user_login ); ?>)
          <?php if ( $excluded_ids ) : ?>
            · Excluyendo: <strong><?php echo implode( ', ', $excluded_ids ); ?></strong>
          <?php endif; ?>
        </span>
      </div>

      <!-- Date range selector -->
      <form method="get" style="margin-bottom:24px;">
        <input type="hidden" name="page" value="inkrush-analytics"/>
        <?php foreach ( [ 7, 30, 90 ] as $r ) :
            $active = $r === $range;
            echo '<button type="submit" name="range" value="' . $r . '" style="'
                . $btn_base
                . ( $active
                    ? 'background:' . $accent . ';border-color:#111;margin-right:6px;'
                    : 'background:#fff;margin-right:6px;' )
                . '">Últimos ' . $r . ' días</button>';
        endforeach; ?>
      </form>

      <!-- Row 1: KPI cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
        <?php
        $kpis = [
            [ 'Usuarios activos', $active_users, '👤' ],
            [ 'Sesiones',          $sessions,     '🔄' ],
            [ 'Eventos totales',   $total_events, '⚡' ],
            [ 'Sesiones/usuario',  $avg_sessions, '📈' ],
        ];
        foreach ( $kpis as $kpi ) :
        ?>
        <div style="<?php echo $card_style; ?>text-align:center;">
          <div style="font-size:28px;margin-bottom:4px;"><?php echo $kpi[2]; ?></div>
          <div style="font-size:32px;font-weight:900;line-height:1;"><?php echo esc_html( $kpi[1] ); ?></div>
          <div style="font-size:12px;color:#555;margin-top:4px;"><?php echo esc_html( $kpi[0] ); ?></div>
        </div>
        <?php endforeach; ?>
      </div>

      <!-- Row 2: Daily active users chart -->
      <div style="<?php echo $card_style; ?>margin-bottom:24px;">
        <h3 style="margin:0 0 16px;">Usuarios activos diarios</h3>
        <canvas id="inkrush-chart-daily" height="80"></canvas>
      </div>

      <!-- Row 3: Screens + Events -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">

        <!-- Top screens chart -->
        <div style="<?php echo $card_style; ?>">
          <h3 style="margin:0 0 16px;">Top pantallas</h3>
          <canvas id="inkrush-chart-screens" height="180"></canvas>
        </div>

        <!-- Top events table -->
        <div style="<?php echo $card_style; ?>">
          <h3 style="margin:0 0 16px;">Top eventos</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="border-bottom:2px solid #111;">
                <th style="text-align:left;padding:4px 8px;">Evento</th>
                <th style="text-align:right;padding:4px 8px;">Total</th>
                <th style="text-align:right;padding:4px 8px;">Usuarios</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ( $event_rows as $er ) : ?>
              <tr style="border-bottom:1px solid #e8e1d0;">
                <td style="padding:5px 8px;font-weight:600;"><?php echo esc_html( $er->event ); ?></td>
                <td style="padding:5px 8px;text-align:right;"><?php echo (int) $er->total; ?></td>
                <td style="padding:5px 8px;text-align:right;color:#555;"><?php echo (int) $er->users; ?></td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Row 4: Pomodoro funnel -->
      <div style="<?php echo $card_style; ?>margin-bottom:24px;">
        <h3 style="margin:0 0 16px;">Embudo Pomodoro</h3>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <?php
          $funnel_labels = [
              'roll'             => '🎲 Roll',
              'idea_saved'       => '💾 Idea guardada',
              'timer_started'    => '⏱ Timer iniciado',
              'timer_completed'  => '✅ Timer completado',
              'upload_completed' => '🚀 Obra publicada',
          ];
          foreach ( $funnel_events as $fe ) :
              $count = $funnel_counts[ $fe ];
              $pct   = round( ( $count / $funnel_first ) * 100 );
          ?>
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="width:160px;font-size:13px;font-weight:700;"><?php echo esc_html( $funnel_labels[ $fe ] ); ?></span>
            <div style="flex:1;background:#e8e1d0;border-radius:999px;height:22px;overflow:hidden;border:1.5px solid #111;">
              <div style="width:<?php echo min( 100, $pct ); ?>%;height:100%;background:<?php echo $accent; ?>;border-radius:999px;"></div>
            </div>
            <span style="width:90px;font-size:13px;font-weight:700;text-align:right;"><?php echo $count; ?> <span style="color:#888;font-weight:400;">(<?php echo $pct; ?>%)</span></span>
          </div>
          <?php endforeach; ?>
        </div>
      </div>

      <!-- Row 5: Music popularity -->
      <div style="<?php echo $card_style; ?>margin-bottom:24px;">
        <h3 style="margin:0 0 12px;">Música popular</h3>
        <?php if ( empty( $music_rows ) ) : ?>
          <p style="color:#888;font-size:13px;">Sin datos de música en el período seleccionado.</p>
        <?php else : ?>
          <canvas id="inkrush-chart-music" height="40"></canvas>
        <?php endif; ?>
      </div>

      <!-- Row 6: Sessions × events -->
      <div style="<?php echo $card_style; ?>margin-bottom:24px;overflow-x:auto;">
        <h3 style="margin:0 0 4px;">Sesiones recientes</h3>
        <p style="font-size:12px;color:#888;margin:0 0 16px;">Últimas 30 · top 10 eventos como columnas</p>
        <?php if ( empty( $session_meta ) ) : ?>
          <p style="color:#888;font-size:13px;">Sin datos en el período seleccionado.</p>
        <?php else : ?>
        <table style="width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap;">
          <thead>
            <tr style="border-bottom:2px solid #111;">
              <th style="text-align:left;padding:5px 10px;min-width:110px;">Usuario</th>
              <th style="text-align:left;padding:5px 8px;font-family:monospace;">Sesión</th>
              <th style="text-align:left;padding:5px 8px;">Dispositivo</th>
              <th style="text-align:right;padding:5px 8px;background:#f5f0e0;font-weight:900;">Total</th>
              <?php foreach ( $col_events as $ce ) : ?>
              <th style="text-align:right;padding:5px 8px;font-size:11px;color:#555;" title="<?php echo esc_attr( $ce ); ?>">
                <?php echo esc_html( $ce ); ?>
              </th>
              <?php endforeach; ?>
              <th style="text-align:left;padding:5px 8px;color:#888;font-weight:400;">Última actividad</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ( $session_meta as $sr ) :
                $user      = get_userdata( $sr->user_id );
                $login     = $user ? $user->user_login : 'ID:' . $sr->user_id;
                $edit      = $user ? get_edit_user_link( $sr->user_id ) : '#';
                $evts      = $session_events[ $sr->session_id ] ?? [];
                $row_total = array_sum( $evts );
                $short_sid = substr( $sr->session_id, 0, 8 );
            ?>
            <tr style="border-bottom:1px solid #e8e1d0;">
              <td style="padding:5px 10px;">
                <a href="<?php echo esc_url( $edit ); ?>" style="font-weight:700;color:#111;text-decoration:none;">
                  <?php echo esc_html( $login ); ?>
                </a>
              </td>
              <td style="padding:5px 8px;font-family:monospace;color:#888;"><?php echo esc_html( $short_sid ); ?>…</td>
              <td style="padding:5px 8px;"><?php echo esc_html( $sr->device ); ?></td>
              <td style="padding:5px 8px;text-align:right;font-weight:900;background:#f5f0e0;"><?php echo $row_total; ?></td>
              <?php foreach ( $col_events as $ce ) :
                  $val = $evts[ $ce ] ?? 0;
                  $opacity = $val > 0 ? min( 1, 0.15 + ( $val / max( 1, $row_total ) ) * 0.85 ) : 0;
              ?>
              <td style="padding:5px 8px;text-align:right;<?php echo $val > 0 ? "background:rgba(223,255,35,{$opacity});font-weight:700;" : 'color:#ccc;'; ?>">
                <?php echo $val > 0 ? $val : '—'; ?>
              </td>
              <?php endforeach; ?>
              <td style="padding:5px 8px;color:#888;"><?php echo esc_html( $sr->last_seen ); ?></td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
        <?php endif; ?>
      </div>

    </div>

    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
    <script>
    (function() {
      var ACCENT = '<?php echo $accent; ?>';

      /* ── Daily active users ── */
      (function() {
        var labels = <?php echo wp_json_encode( array_column( $daily_rows, 'day' ) ); ?>;
        var data   = <?php echo wp_json_encode( array_map( function( $r ) { return (int) $r->users; }, $daily_rows ) ); ?>;
        var ctx = document.getElementById('inkrush-chart-daily');
        if (!ctx) return;
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Usuarios activos',
              data: data,
              backgroundColor: ACCENT,
              borderColor: '#111',
              borderWidth: 1.5,
              borderRadius: 4,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, ticks: { precision: 0 } },
            },
          },
        });
      })();

      /* ── Top screens (horizontal bar) ── */
      (function() {
        var labels = <?php echo wp_json_encode( $screen_labels ); ?>;
        var data   = <?php echo wp_json_encode( $screen_counts ); ?>;
        var ctx = document.getElementById('inkrush-chart-screens');
        if (!ctx) return;
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Vistas',
              data: data,
              backgroundColor: ACCENT,
              borderColor: '#111',
              borderWidth: 1.5,
              borderRadius: 4,
            }],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, ticks: { precision: 0 } },
              y: { grid: { display: false } },
            },
          },
        });
      })();

      /* ── Music doughnut ── */
      (function() {
        var labels = <?php echo wp_json_encode( $music_labels ); ?>;
        var data   = <?php echo wp_json_encode( $music_counts ); ?>;
        var ctx = document.getElementById('inkrush-chart-music');
        if (!ctx || !labels.length) return;
        var colors = [ACCENT, '#A8D8EA', '#C7B8EA', '#FFB3C6', '#B5EAD7', '#FFDAC1', '#FF9AA2'];
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: colors.slice(0, labels.length),
              borderColor: '#111',
              borderWidth: 1.5,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'right' },
            },
          },
        });
      })();
    })();
    </script>
    <?php
}

