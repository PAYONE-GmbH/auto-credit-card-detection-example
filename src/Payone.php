<?php

declare(strict_types=1);

namespace Payone;

/**
 * This helper class provides the required backend functionality for
 * a working auto credit card detection implementation.
 *
 * @author Fabian Böttcher <fabian.boettcher@payone.com>
 * @since 1.0.0
 */
class Payone
{
    /**
     * This holds common request defaults.
     */
    const REQUEST_DEFAULTS = [
        'responsetype' => 'JSON',
        'encoding' => 'UTF-8',
    ];

    /**
     * @var array The user provided request data.
     */
    protected $request = [];

    /**
     * @var string The merchant ID.
     */
    protected $apiMerchantId;

    /**
     * @var string The portal ID.
     */
    protected $apiPortalId;

    /**
     * @var string The subaccount ID.
     */
    protected $apiSubaccountId;

    /**
     * @var string The API key.
     */
    protected $apiKey;

    /**
     * @var array Holds the supported card types.
     */
    protected $supportedCardTypes = [];

    /**
     * Constructs an instance of this helper class and loads environment data.
     *
     * @param array $request The request data to send.
     */
    public function __construct(array $request)
    {
        $this->request = $request;
        $this->loadApiCredentialsFromEnvironment();
        $this->loadSupportedCardTypesFromEnvironment();
    }

    /**
     * Helper method for loading the API credentials from the environment.
     */
    protected function loadApiCredentialsFromEnvironment(): void
    {
        $this->apiMerchantId = getenv('PAYONE_MERCHANT_ID');
        $this->apiPortalId = getenv('PAYONE_PORTAL_ID');
        $this->apiSubaccountId = getenv('PAYONE_SUBACCOUNT_ID');
        $this->apiKey = getenv('PAYONE_KEY');
    }

    /**
     * Helper method for loading the supported credit card types from the environment.
     */
    protected function loadSupportedCardTypesFromEnvironment(): void
    {
        $cardTypes = getenv('PAYONE_CC_TYPES');
        $this->supportedCardTypes = array_map('trim', explode(',', $cardTypes));
    }

    /**
     * Prepares the actual request data.
     * The method merges the global default parameters, the provided request
     * parameters and the required API parameters.
     *
     * @return array The complete request data.
     */
    protected function prepareRequest(): array
    {
        return array_merge(static::REQUEST_DEFAULTS, $this->request, [
            'mid' => $this->apiMerchantId,
            'aid' => $this->apiSubaccountId,
            'portalid' => $this->apiPortalId,
        ]);
    }

    /**
     * Generates the request parameter hash for API authentication.
     *
     * @return string The calculated hash value in hex format.
     */
    protected function generateHash(): string
    {
        // Obtain complete request params.
        $params = $this->prepareRequest();

        // Sort array by keys (e.g. param names).
        ksort($params);

        // Join parameter values.
        $params = join('', $params);

        // Generate SHA-384 HMAC hash of chained parameter values.
        return hash_hmac('sha384', $params, $this->apiKey);

    }

    /**
     * Builds the final request by combining the complete
     * request data with the calculated hash value.
     *
     * @return array The final request.
     */
    protected function buildRequest(): array
    {
        return array_merge($this->prepareRequest(), ['hash' => $this->generateHash()]);
    }

    /**
     * Builds the final request data and transforms it to a JSON-encoded representation.
     *
     * @return string The JSON-encoded final request data.
     */
    public function buildRequestJson(): string
    {
        return json_encode($this->buildRequest(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Builds the supported card types to JSON-encoded representation.
     *
     * @return string The JSON-encoded supported card types list.
     */
    public function buildSupportedCardTypesJson(): string
    {
        return json_encode($this->supportedCardTypes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Returns the supported card types.
     *
     * @return array The supported card type list.
     */
    public function getSupportedCardTypes(): array
    {
        return $this->supportedCardTypes;
    }
}
