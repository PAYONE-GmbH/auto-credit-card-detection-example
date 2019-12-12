/**
 * The PAYONE auto card type detection class constructor.
 *
 * @param config The auto card type detection config.
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
    this._hostedIframe = new Payone.ClientApi.HostedIFrames(
        this._config.hostedIframesConfig.config,
        this._config.hostedIframesConfig.request
    );

    // Register credit card check callback.
    // The hosted IFrames API expects a callback provided as string,
    // therefore we cannot use a function value reference directly.
    // As a workaround we register the actual handler method as global
    // function with a random unique name which will be provided to the
    // hosted IFrames API later.
    this._creditCardCheckCallbackName = 'payone_cc_check_callback_' + Math.random().toString().substr(2);
    window[this._creditCardCheckCallbackName] = this._creditCardCheckCallback.bind(this);

    // Keeps state of manually set card type in fallback scenario.
    this._cardTypeSetManually = false;
}

/**
 * Returns the card brand icons jQuery element list.
 *
 * @returns {jQuery} The card brand icons jQuery element list.
 * @private
 */
PayoneAutoCcDetection.prototype._$icons = function () {
    return $(this._config.iconsSelector);
};

/**
 * Returns the message jQuery element.
 *
 * @returns {jQuery} The message jQuery element.
 * @private
 */
PayoneAutoCcDetection.prototype._$msg = function () {
    return $(this._config.messageSelector);
};

/**
 * Changes the current selected icon in accordance
 * to the provided type.
 *
 * @param {string} type The new card type.
 * @private
 */
PayoneAutoCcDetection.prototype._changeIcon = function (type) {
    this._$icons()
        .removeClass(this._config.iconSelectedClass)
        .filter('[data-cc-type="' + type + '"]')
        .addClass(this._config.iconSelectedClass);
};

/**
 * @todo remove
 * @private
 */
PayoneAutoCcDetection.prototype._clearIconSelection = function () {
    this._$icons().removeClass(this._config.iconSelectedClass);
};

/**
 * Shows the provided message to the user.
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

/**
 * Hides any visible message.
 *
 * @private
 */
PayoneAutoCcDetection.prototype._hideMessage = function () {
    this._$msg().fadeOut(200);
};

/**
 * Handles automatically detected card types.
 * This is the handler that will be called by the hosted iFrames API
 * if a card type detection result is available.
 *
 * @param {string} type The detection result of the hosted IFrames API.
 * @private
 */
PayoneAutoCcDetection.prototype._handleDetectionResult = function (type) {
    type = type.toUpperCase();

    // Delegate further processing to dedicated handlers.
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

/**
 * Handles detection results of valid card types.
 *
 * @param {string} type The detected valid card type.
 * @private
 */
PayoneAutoCcDetection.prototype._handleValidCardType = function (type) {
    this._changeIcon(type);
    this._hideMessage();

    // Disable manual selection if card type was not set manually already.
    if (!this._cardTypeSetManually) {
        this._disableManualSelection();
    }
};

/**
 * Handles unknown card type detection results.
 *
 * @private
 */
PayoneAutoCcDetection.prototype._handleUnknownCardType = function () {
    this._clearIconSelection();
    this._showMessage('warning', 'The card type cannot be detected automatically. Please specify your card type by clicking the corresponding icon.');
    this._enableManualSelection();
};

/**
 * Handles unsupported card type detection results.
 *
 * @private
 */
PayoneAutoCcDetection.prototype._handleUnsupportedCardType = function () {
    this._clearIconSelection();
    this._showMessage('danger', 'The card type is not supported. Please specify a card type corresponding to the icon brands above.');

    // Disable manual selection if card type was not set manually already.
    if (!this._cardTypeSetManually) {
        this._disableManualSelection();
    }
};

/**
 * Renders the credit card check response.
 *
 * @param {object} response
 * @private
 */
PayoneAutoCcDetection.prototype._renderResponse = function (response) {
    $('#cc-check-response-wrap pre').html(JSON.stringify(response, null, 2));
};

/**
 * Enables the manual selection of credit card types.
 *
 * @private
 */
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

/**
 * Disables the manual selection of credit card types.
 *
 * @private
 */
PayoneAutoCcDetection.prototype._disableManualSelection = function () {
    this._$icons()
        .removeClass(this._config.iconClickableClass)
        .off('click.payone');
};

/**
 * Handles the credit card check result.
 *
 * @param {object} response The credit card check result from the hosted IFrame API.
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
 * Performs the credit card check.
 */
PayoneAutoCcDetection.prototype.performCreditCardCheck = function () {
    if (this._hostedIframe.isComplete()) {
        this._hostedIframe.creditCardCheck(this._creditCardCheckCallbackName);
    }
    else {
        this._showMessage('danger', 'Please fill out the form completely.');
    }
};
