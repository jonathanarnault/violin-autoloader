"use strict";

/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var fs = require("fs"),
    path = require("path"),
    async = require("async");

var Namespace = require("./Namespace.js");

class Autoloader {

    constructor() {

    }

    register(namespace, directory) {
        global[namespace] = this._createProxy(new Namespace(namespace, null, directory));
    }

    _createProxy(n) {
        var self = this,
            proto = Object.getPrototypeOf(n);
        return Proxy.create({
            getOwnPropertyDescriptor: function () {
                return Object.getOwnPropertyDescriptor(n)
            },
            getOwnPropertyNames: function () {
                return Object.getOwnPropertyNames(n)
            },
            keys: function () {
                return n.children;
            },
            hasOwn: function (key) {
                return n.hasOwnProperty(key);
            },
            get: function (receiver, key) {
                if (n.hasOwnProperty(key) || proto.hasOwnProperty(key)) {
                    return n[key];
                }
                var child = n.child(key);
                if (!(child instanceof Namespace)) {
                    return child;
                }
                return self._createProxy(child);
            }
        }, proto)
    }
}
module.exports = Autoloader;
