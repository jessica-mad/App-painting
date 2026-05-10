<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#DFFF23">
    <title><?php bloginfo( 'name' ); ?> — InkRush</title>
    <?php wp_head(); ?>
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; background: #DFFF23; overflow-x: hidden; }
        body > * { display: none !important; } /* ocultar todo excepto el root */
        #inkrush-root { display: block !important; min-height: 100vh; min-height: 100svh; }
    </style>
</head>
<body>
    <?php the_content(); /* renderiza el shortcode [inkrush_app] */ ?>
    <?php wp_footer(); ?>
</body>
</html>
