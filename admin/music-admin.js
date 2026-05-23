/* global wp */
jQuery(function ($) {
    // Botón "📁 Biblioteca" — abre el media picker de WordPress
    $(document).on('click', '.inkrush-media-pick', function () {
        if (typeof wp === 'undefined' || typeof wp.media === 'undefined') {
            alert('El selector de medios de WordPress no está disponible. Pega la URL directamente en el campo.');
            return;
        }

        var targetId = $(this).data('target');

        var frame = wp.media({
            title: 'Seleccionar archivo de audio',
            button: { text: 'Usar este archivo' },
            multiple: false,
        });

        frame.on('select', function () {
            var attachment = frame.state().get('selection').first().toJSON();
            var url = attachment.url || attachment.link || '';
            $('#' + targetId).val(url).trigger('change');
        });

        frame.open();
    });
});
