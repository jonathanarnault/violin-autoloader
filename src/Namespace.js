/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var path = require('path'),
    fs = require('fs');

/**
 * Class autoloader
 * @author Jonathan ARNAULT
 */
var Namespace = function (name, directories, parent) {

    if (directories instanceof Namespace) {
        parent = directories;
        directories = undefined;
    }

    this.name = name;
    this.children = {};
    this.classes = {};
    this.parent = parent || null;

    if (null !== this.parent) {
        this.parent.addChild(this);
    }

    if (null !== this.parent && undefined === directories) { // Inherits directories from parent
        this.calculateDirectories();

    } else { // Define directories using directories parameter
        if (undefined === directories) {
            this.directories = [];
        } else if (Array.isArray(directories)) {
            this.directories = directories.filter(function (directory) {
                return fs.existsSync(path.join(directory));
            });
        } else {
            this.directories = directories;
        }
    }
};

Namespace.prototype = {

    /**
     * Namespace parent
     * @type {Namespace}
     * @private
     */
    parent: null,

    /**
     * Namespace name
     * @type {String}
     * @private
     */
    name: null,

    /**
     * Namespace directories
     * @type {Array}
     * @private
     */
    directories: [],

    /**
     * Namespace children
     * @type {Object}
     * @private
     */
    children: {},

    /**
     * Namespace classes
     * @type {Object}
     */
    classes: {}
};


/**
 * Get namespace parent
 * @return {Namespace}
 * @public
 */
Namespace.prototype.getParent = function () {
    return this.parent;
};


/**
 * Get namespace name
 * @return {String}
 * @public
 */
Namespace.prototype.getName = function () {
    return this.name;
};


/**
 * Get namespace fullname
 * @return {String}
 * @public
 */
Namespace.prototype.getFullName = function () {
    var name = '';
    if (null !== this.parent) {
        name = this.parent.getFullName();
        name += (name !== '') ? '.' : '';
    }
    return name + this.name;
};


/**
 * Get namespace autoload directories
 * @return {Array}
 * @public
 */
Namespace.prototype.getDirectories = function () {
    return this.directories;
};


/**
 * Add directories to the namespace directories
 * @param {Array|String} directories
 * @public
 */
Namespace.prototype.setDirectories = function (directories) {
    this.directories = directories;
    this.propagateDirectories();
};


/**
 * Propagate directories updates to children
 * @public
 */
Namespace.prototype.propagateDirectories = function () {
    if (this.directories.length === 0) {
        this.calculateDirectories();
    }

    for (var i in this.children) {
        this.children[i].propagateDirectories();
    }
};


/**
 * Calculate directories path from parent directories
 * @private 
 */
Namespace.prototype.calculateDirectories = function () {
    if (Array.isArray(directories = this.parent.getDirectories())) {
        this.directories = directories.filter(function (directory) {
            return fs.existsSync(path.join(directory, this.name));
        });

        if (this.directories.length === 1) {
            this.directories = path.join(this.directories[0], this.name);
        } else {
            this.directories = this.directories.map(function (directory) {
                return path.join(directory, this.name);
            });
        }
    } else {
        fs.existsSync(this.directories = path.join(directories, this.name));
    }
};


/**
 * Whether the namespace has a child of the given name
 * @param  {String}  child
 * @return {Boolean}
 * @public
 */
Namespace.prototype.hasChild = function (child) {
    return undefined !== this.children[child];
};


/**
 * Get child
 * @param  {String} child
 * @return {Namespace}
 * @public
 */
Namespace.prototype.getChild = function (child) {
    return this.children[child];
};


/**
 * Add child to namespace
 * @param {Namespace} namespace
 * @public
 */
Namespace.prototype.addChild = function (namespace) {
    this.children[namespace.getName()] = namespace;
};


/**
 * Get namespace children
 * @return {Array}
 * @public
 */
Namespace.prototype.getChildren = function () {
    var children = this.children;
    return Object.keys(children).map(function (key) {
        return children[key];
    });
};


/**
 * Add class to namespace
 * @param {String} c
 * @param {Function} C
 * @public
 */
Namespace.prototype.addClass = function (c, C) {
    this.classes[c] = C;
};


/**
 * Get child
 * @param  {String} child
 * @return {Namespace}
 * @public
 */
Namespace.prototype.getClass = function (c) {
    return this.classes[c];
};


/**
 * Get namespace classes
 * @return {Array}
 * @public
 */
Namespace.prototype.getClasses = function () {
    var classes = this.classes;
    return Object.keys(classes).map(function (c) {
        return classes[c];
    });
};

module.exports = Namespace;