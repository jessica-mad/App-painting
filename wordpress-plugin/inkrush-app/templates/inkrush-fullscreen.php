<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>InkRush</title>
    <?php wp_head(); ?>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; background: #DFFF23; overflow-x: hidden; }
        #root { min-height: 100vh; min-height: 100svh; }
    </style>
</head>
<body>
    <div id="root"></div>
    <?php wp_footer(); ?>
</body>
</html>
