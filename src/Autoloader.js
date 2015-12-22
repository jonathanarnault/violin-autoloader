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

        /**
         * Autoloader namespaces to register
         * @type {Map<string, Namespace>}
         */
        this._namespaces = new Map();

        /**
         * Cached proxies
         * @private
         * @type {Map}
         */
        this._cache = new Map();

        /**
         * Whether this autoloader is registered
         * @type {boolean}
         */
        this._registered = false;
    }

    /**
     * Load a file or a directory
     * This method will require all files and directories
     * @public
     * @param  {String} file - The file or directory to load
     * @param  {Function} done - The function called when the loading is done
     * @param  {Function=} callback - A function called when a file is required
     */
    static load(file, done, callback) {
        var self = this;
        fs.stat(file, function (err, stats) {
            if (err) {
                return done(err);
            }
            if (stats.isDirectory()) {
                fs.readdir(file, function (err, files) {
                    async.each(files, function (f, cb) {
                        self.load(path.resolve(file, f), cb, callback);
                    }, function (err) {
                        return done(err);
                    });
                });
            } else {
                try {
                    let r = require(file);
                    callback && callback(r);
                    return done();
                } catch (err) {
                    done(err);
                }
            }
        });
    }

    /**
     * Register autoloader
     * This method add registered namespaces to global context
     * @public
     */
    register() {
        if (Autoloader._registered) {
            throw new Error("An autoloader is already registered");
        }
        Autoloader._registered = true;
        this._registered = true;
        for (let name of this._namespaces.keys()) {
            global[name] = this._createProxy(this._namespaces.get(name));
        }
    }

    /**
     * Unregister autoloader
     * @public
     */
    unregister() {
        if (!this._registered) {
            throw new Error("Autoloader is not registered");
        }
        for (let name of this._namespaces.keys()) {
            delete global[name];
        }
        this._registered = false;
        Autoloader._registered = false;
    }

    /**
     * Register a namespace
     * @public
     * @param  {string} namespace - Namespace name
     * @param  {string=} directory - Namespace directory
     * @return {Namespace}
     */
    namespace(namespace, directory) {
        if (this._registered) {
            throw new Error("Autoloader is registered");
        }
        let namespaces = namespace.split("."),
            ns;

        for (let i = 0; i < namespaces.length; i++) {
            if (0 === i) { // Root namespace
                if (this._namespaces.has(namespaces[0])) {
                    ns = this._namespaces.get(namespaces[0]);
                } else {
                    ns = new Namespace(namespaces[0], null, null);
                    this._namespaces.set(namespaces[0], ns);
                }
            } else { // Child namespace
                try {
                    ns = ns.child(namespaces[i]);
                } catch (err) {
                    ns = new Namespace(namespaces[i], ns, null);
                }
            }
            if ((namespaces.length - 1) === i) {
                try {
                    ns.directory = directory;
                } catch (err) {}
            }
        }
        return ns;
    }

    /**
     * Create a proxy for a namespace
     * @private
     * @param  {Namespace} n - The namespace
     * @return {Namespace}
     */
    _createProxy(n) {
        if (!this._cache.has(n)) {
            let self = this,
                proto = Object.getPrototypeOf(n);

            this._cache.set(n, Proxy.create({
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
                    if (Autoloader.NAMESPACE_ACCESSOR_KEY == key) {
                        return n;
                    }

                    let child = n.child(key);
                    if (!(child instanceof Namespace)) {
                        return child;
                    }
                    return self._createProxy(child);
                }
            }, proto));
        }
        return this._cache.get(n);
    }
}

/**
 * Provide access to namespace object through proxy
 * @private
 * @type {string}
 */
Autoloader.NAMESPACE_ACCESSOR_KEY = "__NAMESPACE_ACCESSOR_KEY__";

/**
 * Whether an autoloader has been registered
 * @type {boolean}
 */
Autoloader._registered = false;

module.exports = Autoloader;
