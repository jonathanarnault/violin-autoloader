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
    path = require("path");

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
     * @param  {Function=} callback - This function is called for each file loaded
     * @throws {Error} If the file or directory cannot be loaded
     */
    static load(file, callback) {
        try {
            let stats = fs.statSync(file);
            if (stats.isDirectory()) {
                let files = fs.readdirSync(file);
                for (let f of files) {
                    Autoloader.load(path.resolve(file, f), callback);
                }
            } else if (file.endsWith(".js")) { // Only load javascript files
                let r = require(file);
                callback && callback(r);
           }
        } catch (err) {
            return new Error(`Autoloader cannot load ${file}`, err);
        }
    }

    /**
     * Register autoloader
     * This method add registered namespaces to global context
     * @public
     * @throws {Error} If an autoloader is already registered
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
     * @throws {Error} If the autoloader is not registered
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

        // Root namespace
        if (this._namespaces.has(namespaces[0])) {
            ns = this._namespaces.get(namespaces[0]);
        } else {
            ns = new Namespace(namespaces[0], null, null);
            this._namespaces.set(namespaces[0], ns);
        }

        // Children namespaces
        for (let i = 1; i < namespaces.length; i++) {
            try {
                ns = ns.child(namespaces[i]);
            } catch (err) {
                ns = new Namespace(namespaces[i], ns, null);
            }
        }

        try {
            ns.directory = directory;
        } catch (err) {}
        return ns;
    }

    /**
     * Load a binding
     * @public
     * @param  {string} namespace - The namespace of the binding
     * @param  {string} binding - Binding path
     * @throws {Error} - If the binding cannot be loaded
     */
    binding(namespace, binding) {
        let ns = this.namespace(namespace, null),
            paths = [
                "build/Release",
                "out/Release",
                "Release",
                "build",
                "out",
                ".",
                "build/Debug",
                "out/Debug",
                "Debug"
            ];

        for (let p of paths) {
            try {
                p = path.resolve(binding, p);
                let stats = fs.statSync(p);
                if (stats.isDirectory()) {
                    let files = fs.readdirSync(p).filter((file) => {
                        return file.endsWith(".node");
                    });

                    if (files.length == 0) {
                        continue;
                    }

                    let r = require(path.resolve(p, files[0]));

                    for (let k in r) {
                        ns.child(k, r[k]);
                    }
                    return;
                }
            } catch (err) {
                continue;
            }
        }
        throw new Error(`Autoloader cannot load "${binding} binding`);
    }

    /**
     * Load a module
     * @public
     * @param {string} name - The module name
     * @throw {Error} If the module cannot be loaded
     */
    module(name) {
        let loaded = new Set(),
            modules = [name];
        try {
            while (modules.length > 0) {
                let n = modules.pop(),
                    mod = require(`${n}/autoload.js`);

                if (mod.hasOwnProperty("namespaces")) {
                    for (let ns in mod.namespaces) {
                        this.namespace(ns, mod.namespaces[ns]);
                    }
                }

                if (mod.hasOwnProperty("bindings")) {
                    for (let b in mod.bindings) {
                        this.binding(b, mod.bindings[b]);
                    }
                }

                if (mod.hasOwnProperty("loads")) {
                    for (let l of mod.loads) {
                        Autoloader.load(l);
                    }
                }

                if (mod.hasOwnProperty("modules")) {
                    for (let m of mod.modules) {
                        if (!loaded.has(m)) {
                            modules.push(m);
                            loaded.add(m);
                        }
                    }
                }
            }
        } catch (err) {
            throw new Error(`Autoloader cannot load "${name}" module`, err);
        }
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

            this._cache.set(n, new Proxy(proto, {
                getOwnPropertyDescriptors() {
                    return Object.getOwnPropertyDescriptors(n)
                },
                getOwnPropertyNames() {
                    return n.children;
                },
                keys() {
                    return n.children;
                },
                hasOwn(key) {
                    return -1 !== n.children.indexOf(key);
                },
                get(receiver, key) {
                    if (Autoloader.NAMESPACE_ACCESSOR_KEY == key) {
                        return n;
                    }

                    let child = n.child(key);
                    if (!(child instanceof Namespace)) {
                        return child;
                    }
                    return self._createProxy(child);
                }
            }));
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
