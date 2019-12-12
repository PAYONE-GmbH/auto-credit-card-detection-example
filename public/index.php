<?php

// Load bootstrapping stuff.
require_once __DIR__ . '/../bootstrap.php';

$payone = new \Payone\Payone([
    'mode' => 'test',
    'request' => 'creditcardcheck',
    'storecarddata' => 'yes',
]);

?>
<!doctype html>
<html lang="en">
<head>
    <title>Auto Credit Card Type Detection</title>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/css/bootstrap.css">
    <link rel="stylesheet" href="css/style.css">

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.js"></script>
    <script src="https://secure.pay1.de/client-api/js/v1/payone_hosted.js"></script>
    <script src="js/auto-cc-detection.js"></script>
</head>
<body>
    <div class="container">
        <div class="row">
            <div class="col py-5">
                <h1 class="h2">Auto Credit Card Type Detection Example</h1>

                <!-- HTML for displaying CC detection messages. -->
                <div class="payone-cc-message-wrap my-3">
                    <div class="alert alert-success" role="alert"></div>
                </div>

                <!-- Render the CC icons based on supported card types -->
                <div class="payone-cc-icons-wrap my-5">
                    <?php foreach ($payone->getSupportedCardTypes() as $type): ?>
                        <img
                            class="payone-cc-icon"
                            src="https://cdn.pay1.de/cc/<?= strtolower($type) ?>/l/default.png"
                            alt="<?= $type ?> Icon"
                            data-cc-type="<?= $type ?>"
                        >
                    <?php endforeach; ?>
                </div>

                <!-- The form HTML with IFrame fields. -->
                <form id="cc-form" class="my-3" action="#" method="post">
                    <div class="form-group">
                        <label for="payone-cc-pan">Card Number</label>
                        <div class="payone-input-mock payone-input-mock--pan">
                            <!-- Mount element for PAN IFrame. -->
                            <span id="payone-cc-pan"></span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="payone-cc-cvc">CVC</label for="payone-cc-cvc">
                        <div class="payone-input-mock payone-input-mock--cvc">
                            <!-- Mount element for CVC IFrame. -->
                            <span id="payone-cc-cvc"></span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="payone-cc-expire-month">Expire Month (MM)</label>
                        <div class="payone-input-mock payone-input-mock--expire-month">
                            <!-- Mount element for card expire month IFrame. -->
                            <span id="payone-cc-expire-month"></span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="payone-cc-expire-year">Expire Year (YYYY)</label>
                        <div class="payone-input-mock payone-input-mock--expire-year">
                            <!-- Mount element for card expire year IFrame. -->
                            <span id="payone-cc-expire-year"></span>
                        </div>
                    </div>

                    <div class="form-group mt-5">
                        <button id="submit" class="btn btn-primary btn-lg" type="button">Perform CC Check</button>
                    </div>
                </form>

                <hr class="my-5">

                <!-- HTML to render the credit card check response. -->
                <h2 class="h4">Credit Card Check Response</h2>
                <div id="cc-check-response-wrap">
                    <pre></pre>
                </div>
            </div>
        </div>
    </div>

    <script>
        (function () {
            var autoCcDetection = new PayoneAutoCcDetection({
                supportedCardTypes: <?= $payone->buildSupportedCardTypesJson() ?>,
                hostedIframesConfig: {
                    config: {
                        fields: {
                            cardpan: {
                                selector: "payone-cc-pan",
                                type: "input"
                            },
                            cardcvc2: {
                                selector: "payone-cc-cvc",
                                type: "password",
                                size: "4",
                                maxlength: "4",
                                length: { "V": 3, "M": 3 }
                            },
                            cardexpiremonth: {
                                selector: "payone-cc-expire-month",
                                type: "text",
                                size: "2",
                                maxlength: "2",
                            },
                            cardexpireyear: {
                                selector: "payone-cc-expire-year",
                                type: "text",
                            }
                        },
                        defaultStyle: {
                            input: "height: 100%; width: 100%; border: none; font-size: 20px; letter-spacing: 1px;",
                            iframe: {},
                        },

                        language: Payone.ClientApi.Language.en,
                    },
                    request: <?= $payone->buildRequestJson() ?>
                },
            });

            document.querySelector('#submit').addEventListener('click', function (event) {
                event.preventDefault();
                console.log('click!');
                autoCcDetection.performCreditCardCheck();
            });
        })();
    </script>
</body>
</html>
