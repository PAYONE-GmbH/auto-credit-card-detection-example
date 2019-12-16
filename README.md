Auto Credit Card Type Detection Example
=======================================

This project is an example implementation of the
auto card type detection provided by the PAYONE
Client API.

The project follows our
[official documentation](https://docs.payone.com/display/public/INT/Modern+Credit+Card+Checkout)
how a modern credt card checkout should be implemented.

What Are the Requirements?
--------------------------

 - PHP Version 7.2 or above
 - Composer Package Manager
 - PAYONE API Credentials

How to Get Started?
-------------------

Clone or download this repository to your desired location.

```bash
$ git clone https://github.com/PAYONE-GmbH/auto-credit-card-detection-example.git
$ cd auto-credit-card-detection-example
```

Install project dependencies via Composer:

```bash
$ composer install
```

Copy `.env.example` to `.env` and configure your
PAYONE API credentials as well as your supported
credit card types.

Run a webserver with document root set to the `public`
directory. You can make use of the PHP built-in
webserver for this:

```bash
$ cd public
$ php -S 127.0.0.1:8080
```
