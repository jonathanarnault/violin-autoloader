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
    this.namespaces = {};
    this.global = {};
};

Autoloader.prototype = {

    /**
     * Whether autoloader is frozen or not
     * @type {Boolean}
     * @private
     */
    frozen: false,

    /**
     * Registered namespaces
     * @type {Object}
     * @private
     */
    namespaces: {},

    /**
     * Global scope
     * @type {Object}
     */
    global: {}
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
        n,
        ds = [];

    if (!this.namespaces[ns[0]]) {
        if (ns.length === 1) {
            ds = directories;
        }
        this.namespaces[ns[0]] = new Namespace(ns[0], ds);
    } else if (ns.length === 1) {
        this.namespaces[ns[0]].setDirectories(directories);
        this.namespaces[ns[0]].propagateDirectories();
    }
    namespace = this.namespaces[ns[0]];

    for (var i=1; i < ns.length; i++) {
        if (!namespace.hasChild(ns[i])) {
            if (i === ns.length - 1) {
                n = new Namespace(ns[i], directories, namespace);
            } else {
                n = new Namespace(ns[i], namespace);
            }
            
        } else {
            n = namespace.getChild(ns[i]);

            if (i === ns.length - 1) {
                n.setDirectories(directories);
            }
        }
        namespace = n;
    }
};


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

    for (var i in global) {
        autoloader.global[i] = global[i];
    }

    global.__proto__ = this.createProxy(global, function (key) {
        if (autoloader.global[key]) {
            return autoloader.global[key];
        }

        if (autoloader.namespaces[key]) {
            return autoloader.namespaceProxy(autoloader.namespaces[key]);
        }
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
            if (key != 'v8debug' && target[key] == undefined) {
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

        if (Array.isArray(directories)) {
            if (directories.length > 0) {
                return autoloader.namespaceProxy(ns);
            }
        } else {
            if (fs.existsSync(directories)) {
                return autoloader.namespaceProxy(ns);
            }
        }

        throw new Error('Impossible to load namespace "' + namespace.getFullName() + '.' + key + '"')
    });
};


/**
 * Get a registered namespace
 * @param  {String} name
 * @return {Namespace}
 * @public
 */
Autoloader.prototype.getNamespace = function (name) {
    return this.namespaces[name];
};

/**
 * Get registered namespaces
 * @return {Array}
 * @public
 */
Autoloader.prototype.getNamespaces = function () {
    var namespaces = this.namespaces;
    return Object.keys(namespaces).map(function (key) {
        return namespaces[key];
    });
};

module.exports = Autoloader;