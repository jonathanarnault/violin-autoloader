/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var fs = require('fs'),
    path = require('path');

var Namespace = require('./Namespace.js');

/**
 * Class autoloader
 * @author Jonathan ARNAULT
 */
var Autoloader = function () {

    this.frozen = false;
    this.namespace = new Namespace('', []);
    this.proxy = this.namespaceProxy(this.namespace);
};

Autoloader.prototype = {

    /**
     * Whether autoloader is frozen or not
     * @type {Boolean}
     * @private
     */
    frozen: false,

    /**
     * Root namespace
     * @type {Namespace}
     * @private
     */
    namespace: null,

    /**
     * Root namespace proxy
     * @type {Proxy}
     */
    proxy: null
};


/**
 * Register a new namespace
 * @param  {String} namespace
 * @param  {Array|String} directories
 * @public
 */
Autoloader.prototype.registerNamespace = function (namespace, directories) {
    if (this.frozen) {
        throw new Error("Autoloader is frozen");
    }

    var ns = namespace.split('.'),
        n;

    if (namespace === '') {
        this.namespace.setDirectories(directories);
        return;
    }

    namespace = this.namespace;
    for (var i=0; i < ns.length; i++) {
        if (undefined === (n = namespace.getChild(ns[i]))) {
            if (i === ns.length - 1) {
                n = new Namespace(ns[i], directories, namespace);
            } else {
                n = new Namespace(ns[i], namespace);
            }
            
        } else {
            if (i === ns.length - 1) {
                n.setDirectories(directories);
            }
        }
        namespace = n;
    }
}

/**
 * Register autoloader
 * @param  {Function} cb
 * @public
 */
Autoloader.prototype.register = function (cb) {
    var autoloader = this;

    if (this.frozen) {
        throw new Error("Autoloader is already registered");
    }

    global.__proto__ = this.createProxy(global, function (key) {
        return autoloader.proxy[key];
    });

    // Freeze Autoloader
    this.frozen = true;

    // Call callback
    cb.call(null);
};


/**
 * Create a proxy for an Object
 * @param  {Object}   target
 * @param  {Function} callback
 * @return {Proxy}
 * @private
 */
Autoloader.prototype.createProxy = function (obj, callback) {
    var target = obj.__proto__;
    
    return Proxy.create({
        getPropertyDescriptor: Object.getOwnPropertyDescriptor.bind(null, target),
        getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor.bind(null, target),
        getOwnPropertyNames: Object.getOwnPropertyNames.bind(null, target),
        getPropertyNames: Object.getOwnPropertyNames.bind(null, target),
        keys: Object.keys.bind(null, target),
        defineProperty: Object.defineProperty.bind(null, target),
        
        set: function (r, key, value) {
            target[key] = value;
            return true;
        },
        has: function (key) { 
            return key in target;
        },
        hasOwn: function (key) { 
            return target.hasOwnProperty(key);
        },
        delete: function (key) {
            delete target[key];
            return true;
        },
        enumerate: function () {
            var i = 0,
                k = []; 
            for (k[i++] in target);
            return k;
        },
        get: function (r, key) {
            if (key != 'v8debug' && target[key] === undefined) {
                return callback(key);
            }
            return target[key];
        }
    }, Object.getPrototypeOf(target));
};


/**
 * Create a proxy for a namespace
 * @param  {Namespace} namespace
 * @return {Proxy}
 * @private
 */
Autoloader.prototype.namespaceProxy = function (namespace) {
    var autoloader = this;

    return autoloader.createProxy(namespace, function (key) {

        if (undefined !== (c = namespace.getClass(key))) {
            return c;
        }

        if (undefined !== (child = namespace.getChild(key))) {
            return autoloader.namespaceProxy(child);
        }

        // Classes
        var directories = namespace.getDirectories(),
            filename = key + '.js',
            file;
        if (Array.isArray(directories)) {
            directories = directories.filter(function (directory) {
                return fs.existsSync(path.join(directory, filename));
            });

            if (directories.length > 0) {
                file = path.join(directories[0], filename);
            }
        } else {
            file = path.join(directories, filename);
        }

        if (undefined !== file && fs.existsSync(file)) {
            var C = require(file);
            namespace.addClass(key, C);
            return C;
        }

        // Namespaces
        var ns = new Namespace(key, namespace);
        directories = ns.getDirectories();

        return autoloader.namespaceProxy(ns);
    });
};


/**
 * Get root namespace
 * @param  {String} name
 * @return {Namespace}
 * @public
 */
Autoloader.prototype.getNamespace = function () {
    return this.namespace;
};

module.exports = Autoloader;