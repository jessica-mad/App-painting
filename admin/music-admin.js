/* global wp */
jQuery(function ($) {
    // Botón "📁 Biblioteca" — abre el media picker de WordPress
    $(document).on('click', '.inkrush-media-pick', function () {
        var targetId = $(this).data('target');

        var frame = wp.media({
            title: 'Seleccionar archivo de audio',
            button: { text: 'Usar este archivo' },
            library: { type: 'audio' },
            multiple: false,
        });

        frame.on('select', function () {
            var attachment = frame.state().get('selection').first().toJSON();
            $('#' + targetId).val(attachment.url).trigger('change');
        });

        frame.open();
    });
});
