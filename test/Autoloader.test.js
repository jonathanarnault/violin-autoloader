/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var path = require("path");

var Autoloader = require("../src/Autoloader.js"),
    Namespace = require("../src/Namespace.js");

describe("Autoloader", function () {
    var autoloader =  new Autoloader();
    autoloader.register("root", path.resolve(__dirname, "use-case"));
});
