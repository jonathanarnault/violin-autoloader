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
 * Proxy Handler
 * @constructor
 */
Autoloader.ProxyHandler = function (target, callback) {
    this.target = target;
    this.proto = Object.getPrototypeOf(target);
    this.callback = callback;
};

Autoloader.ProxyHandler.prototype = {
    getPropertyDescriptor: function () {
        Object.getPr
        return Object.getOwnPropertyDescriptor(this.target)
    },
    getOwnPropertyDescriptor: function () {
        return Object.getOwnPropertyDescriptor(this.target)
    },
    getOwnPropertyNames: function () {
        return Object.getOwnPropertyNames(this.target)
    },
    getPropertyNames: function () {
        return Object.getPropertyNames(this.target)
    },
    keys: function () {
        return Object.keys(this.target);
    },
    defineProperty: function (r, prop, desc) {
        return Object.defineProperty(this.target, prop, desc)
    },
    set: function (r, key, value) {
        this.target[key] = value;
        return true;
    },
    has: function (key) {
        return key in this.target;
    },
    hasOwn: function (key) {
        return this.target.hasOwnProperty(key);
    },
    delete: function (key) {
        delete this.target[key];
        return true;
    },
    enumerate: function () {
        var i = 0,
            k = [];
        for (k[i++] in this.target);
        return k;
    },
    get: function (r, key) {
        if (this.target.hasOwnProperty(key) || this.proto.hasOwnProperty(key)) {
            return this.target[key];
        }

        return this.callback(key);
    }
};

/**
 * Register a new namespace
 * @param  {String} namespaceName
 * @param  {Array|String} directories
 * @public
 * @return {Namespace} the newly-created Namespace
 */
Autoloader.prototype.registerNamespace = function (namespaceName, directories) {
    if (this.frozen) {
        throw new Error("Autoloader is frozen");
    }
    var ns = namespaceName.split("."),
        n;

    if (namespaceName === "") {
        this.namespace.setDirectories(directories);
        return this.namespace;
    }

    var namespace = this.namespace;
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
    return namespace;
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

    global.__proto__ = this.createProxy(global.__proto__, function (key) {
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
Autoloader.prototype.createProxy = function (o, callback) {
    return Proxy.create(new Autoloader.ProxyHandler(o, callback), Object.getPrototypeOf(o));
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

        if (namespace.hasOwnProperty(key)) {
            return namespace[key];
        }

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
        if (callback) {
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
                if (callback) {
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
            if (done) {
                done();
            }
        });
    }
};

/**
 * Searches and loads all bindings in a path using the given namespace format.
 * Assumed dir hierarchy is: root/ < binding >/ [<build/|out/] [Debug/|Release/] < binding >.node
 * Registered namespace is namespaceFormat.< binding > [.debug|release] , default is release.
 * @param {String} namespacePrefix the name of the namespace under which we will add the bindings
 * @param {String} rootPath the root path of the bindings
 * @param {Function=} callback when loading is done
 */
Autoloader.prototype.loadBindings = function (namespacePrefix, rootPath, callback) {
    var pathToTry = [
        ["build"],
        ["build", "Release"],
        ["build", "Debug"],
        ["out"],
        ["out", "Release"],
        ["out", "Debug"],
        ["Release"],
        ["Debug"],
        [""]
    ];

    var files = fs.readdirSync(rootPath),
        self = this;

    var bindingNamespace = self.registerNamespace(namespacePrefix, rootPath);

    async.eachSeries(files, function (binding, cb) {
            for (var folder in pathToTry) {
                var bindingFolder = path.resolve(rootPath, binding, pathToTry[folder].join(path.sep)),
                    bindingPath = path.resolve(bindingFolder, binding + ".node");

                if (fs.existsSync(bindingPath)) {
                    //Do we have a suffix like Release or Debug to store our requireObject ?
                    var requireObject;
                    if (pathToTry[folder].indexOf("Release") !== -1) {
                        requireObject = "Release";
                    } else if (pathToTry[folder].indexOf("Debug") !== -1) {
                        requireObject = "Debug";
                    }

                    //Building namespace name
                    var namespaceString = namespacePrefix,
                        namespace;

                    // If the folder doesn't have any Release or Debug one, we use the bindings namespace
                    if (undefined === requireObject) {
                        requireObject = binding;
                        namespace = bindingNamespace;
                    }
                    //otherwise, we build a dedicated namespace for this binding
                    else {
                        namespaceString += "." + binding;
                        namespace = self.registerNamespace(namespaceString, bindingFolder);
                    }

                    // Actual require
                    namespace[requireObject] = require(bindingPath);
                }
            }
            return cb();
        }
        ,
        function () {
            if (callback) {
                return callback();
            }
        }
    )
    ;

};

module.exports = Autoloader;