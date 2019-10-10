/**
 *
 * @param config
 * @constructor
 */
function PayoneAutoCcDetection(config)
{
    // Apply config defaults.
    this._config = Object.assign({}, {
        iconsSelector: '.payone-cc-icon',
        iconClickableClass: 'payone-cc-icon--clickable',
        iconSelectedClass: 'payone-cc-icon--selected',
        messageSelector: '.payone-cc-message-wrap',
    }, config);

    // Setup auto credit card detection config.
    this._config.hostedIframesConfig.config.autoCardtypeDetection = {
        deactivate: false,
        supportedCardtypes: this._config.supportedCardTypes,
        callback: this._handleDetectionResult.bind(this),
    };

    // Create hosted IFrames object.
    this._hostedIframe = new Payone.ClientApi.HostedIFrames(this._config.hostedIframesConfig.config, this._config.hostedIframesConfig.request);

    // Register credit card check callback.
    this._creditCardCheckCallbackName = 'payone_cc_check_callback_' + Math.random().toString().substr(2);
    window[this._creditCardCheckCallbackName] = this._creditCardCheckCallback.bind(this);

    // Keeps state of manually set card type in fallback scenario.
    this._cardTypeSetManually = false;
}

/**
 *
 * @returns {jQuery}
 * @private
 */
PayoneAutoCcDetection.prototype._$icons = function () {
    return $(this._config.iconsSelector);
};

/**
 *
 * @returns {jQuery}
 * @private
 */
PayoneAutoCcDetection.prototype._$msg = function () {
    return $(this._config.messageSelector);
};

/**
 *
 * @param {string} type
 * @private
 */
PayoneAutoCcDetection.prototype._changeIcon = function (type) {
    this._$icons()
        .removeClass(this._config.iconSelectedClass)
        .filter('[data-cc-type="' + type + '"]')
        .addClass(this._config.iconSelectedClass);
};

PayoneAutoCcDetection.prototype._clearIconSelection = function () {
    this._$icons().removeClass(this._config.iconSelectedClass);
};

/**
 *
 * @param {string} level The message level.
 * @param {string} message The message text.
 * @private
 */
PayoneAutoCcDetection.prototype._showMessage = function (level, message) {
    this._$msg()
        .find('.alert')
        .removeClass()
        .addClass('alert alert-' + level)
        .html(message);

    this._$msg().fadeIn(400);
};

PayoneAutoCcDetection.prototype._hideMessage = function () {
    this._$msg().fadeOut(200);
};

/**
 *
 * @param type
 * @private
 */
PayoneAutoCcDetection.prototype._handleDetectionResult = function (type) {
    type = type.toUpperCase();

    switch (type) {
        case '?':
            this._handleUnknownCardType(type);
            break;
        case '-':
            this._handleUnsupportedCardType(type);
            break;
        default:
            this._handleValidCardType(type);
            break;
    }
};

PayoneAutoCcDetection.prototype._handleValidCardType = function (type) {
    this._changeIcon(type);
    this._hideMessage();

    // Disable manual selection if card type was not set manually already.
    if (!this._cardTypeSetManually) {
        this._disableManualSelection();
    }
};

PayoneAutoCcDetection.prototype._handleUnknownCardType = function (type) {
    this._clearIconSelection();
    this._showMessage('warning', 'The card type cannot be detected automatically. Please specify your card type by clicking the corresponding icon.');
    this._enableManualSelection();
};

PayoneAutoCcDetection.prototype._handleUnsupportedCardType = function (type) {
    this._clearIconSelection();
    this._showMessage('danger', 'The card type is not supported. Please specify a card type corresponding to the icon brands above.');

    // Disable manual selection if card type was not set manually already.
    if (!this._cardTypeSetManually) {
        this._disableManualSelection();
    }
};

PayoneAutoCcDetection.prototype._renderResponse = function (response) {
    $('#cc-check-response-wrap pre').html(JSON.stringify(response, null, 2));
};

PayoneAutoCcDetection.prototype._enableManualSelection = function () {
    var _this = this;

    this._$icons()
        .addClass(this._config.iconClickableClass)
        .on('click.payone', function () {
            var type = $(this).data('ccType').toUpperCase();
            _this._cardTypeSetManually = true;
            _this._hostedIframe.setCardType(type);
            _this._changeIcon(type);
            _this._hideMessage();
        });
};

PayoneAutoCcDetection.prototype._disableManualSelection = function () {
    this._$icons()
        .removeClass(this._config.iconClickableClass)
        .off('click.payone');
};

/**
 *
 * @param response
 * @private
 */
PayoneAutoCcDetection.prototype._creditCardCheckCallback = function (response) {
    this._renderResponse(response);

    switch (response.status) {
        case 'VALID':
            this._showMessage('success', 'Success! Credit card check was valid.');
            break;
        case 'INVALID':
        case 'ERROR':
            this._showMessage('danger', 'Error ' + response.errorcode + ': ' + response.errormessage);
            break;
        default:
            this._showMessage('warning', 'API returned an unexpected status.');
            break;
    }
};

/**
 *
 */
PayoneAutoCcDetection.prototype.performCreditCardCheck = function () {
    if (this._hostedIframe.isComplete()) {
        this._hostedIframe.creditCardCheck(this._creditCardCheckCallbackName);
    }
    else {
        this._showMessage('danger', 'Please fill out the form completely.');
    }
};
