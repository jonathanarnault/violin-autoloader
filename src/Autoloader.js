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

/**
 * Class autoloader
 * @author Jonathan ARNAULT
 */
var Autoloader = function () {

    this.frozen = false;
    this.namespace = new Namespace("", []);
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
    var ns = namespace.split("."),
        n;

    if (namespace === "") {
        this.namespace.setDirectories(directories);
        return;
    }

    namespace = this.namespace;
    for (var i = 0; i < ns.length; i++) {
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
    var target = obj.__proto__,
        o = {};
    for (var i in target) {
        o[i] = obj[i];
    }
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
            if (target[key] == undefined) {
                return callback(key);
            }
            return o[key];
        }
    }, target);
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
        if (namespace.getName() === "") {
            var exclude = ["v8debug", "setup", "suiteSetup", "suiteTeardown", "teardown", "constuctor", "suite", "test"];
            if (-1 != exclude.indexOf(key)) {
                return undefined;
            }
        }

        if (undefined !== (c = namespace.getClass(key))) {
            return c;
        }

        if (undefined !== (child = namespace.getChild(key))) {
            return autoloader.namespaceProxy(child);
        }

        // Classes
        var directories = namespace.getDirectories(),
            filename = key + ".js",
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

            C._autoloader = {};
            C._autoloader.filename = file;
            C._autoloader.namespace = namespace;

            namespace.addClass(key, C);
            return C;
        }

        // Namespaces
        var ns = new Namespace(key, namespace);
        ns.calculateDirectories();

        return autoloader.namespaceProxy(ns);
    });
};


/**
 * Get a registered namespace
 * @param  {String} name
 * @return {Namespace}
 * @public
 */
Autoloader.prototype.getNamespace = function (name) {
    return this.namespace.getChild(name);
};


/**
 * Get registered namespaces
 * @return {Array}
 */
Autoloader.prototype.getNamespaces = function () {
    return this.namespace.getChildren();
};


/**
 * Autoload a directory or a file
 * @param p Directoryor file  to load
 * @param recursive Whether load should be recursive or not
 * @param callback A callback applied for each require
 * @param done Callback called when load is done
 */
Autoloader.prototype.load = function (p, recursive, callback, done) {

    if (typeof recursive === "function") {
        callback = recursive;
        recursive = undefined;
    }

    var self = this,
        stats = fs.statSync(p),
        fileStats,
        exp;

    if (stats.isFile()) {
        exp = require(p);
        if (undefined !== callback) {
            callback(exp);
        }
    } else {
        var files = fs.readdirSync(p);
        async.eachSeries(files, function (file, cb) {
            var fpath = path.join(p, file);

            if (file == "." || file == "..") {
                return cb();
            }

            fileStats = fs.statSync(fpath);
            if (fileStats.isFile()) {
                exp = require(fpath);
                if (undefined !== callback) {
                    callback(exp);
                }
                return cb();
            }

            if (recursive) {
                return self.load(fpath, recursive, callback, function () {
                    return cb();
                });
            }
        }, function () {
            if (undefined !== done) {
                done();
            }
        });
    }
};

module.exports = Autoloader;