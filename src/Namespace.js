"use strict";

/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var path = require("path").posix,
    fs = require("fs");

/**
 * This class represents a namespace
 * A namespace is composed of of sub-namespaces and classes
 * @author Jonathan ARNAULT
 */
class Namespace {

    /**
     * Create a new Namespace
     * @param  {string} name - The namespace name
     * @param  {Namespace} parent - The namespace parent, can be null
     */
    constructor(name, parent, directory) {

        /**
         * Namespace name
         * @type {string}
         */
        this._name = name;

        /**
         * Namespace parent
         * @type {Namespace}
         */
        this._parent = parent;

        /**
         * Namespace directory
         * @type {string}
         */
        this._directory = directory;

        /**
         * This Map contains loaded classes and sub-namespaces
         * @type {Map<string, Namespace|Function>}
         */
        this._children = new Map();
    }

    /**
     * [children description]
     * @return {[type]} [description]
     */
    get children() {
        var iter = this._children.keys(),
            keys = [],
            next;
        while (!(next = iter.next()).done) {
            keys.push(next.value);
        }
        return keys;
    }

    /**
     * Set a directory for the namespace if not alreay set
     * @param  {string} directory - The namespace directory
     * @throws {Error} If the directory is already set
     */
    set directory(directory) {
        if (undefined != this._directory) {
            throw new Error(`Cannot set the directory for "${this._name}" namespace : it already exist.`);
        }
        this._directory = directory;
    }

    /**
     * Get a child
     * @param {string} child - The child name
     * @param {Namespace|Function=} value - The new child
     * @return {Namespace|Function|undefined} - This methods returns undefined if the child is not found
     * @throws {Error} If child contains "." or when trying to acess a child without a defined directory
     */
    child(child, value) {
        if (-1 !== child.indexOf(".")) {
            throw new Error("A child of a namespace cannot contain \".\".");
        }

        if (undefined != value) {
            this._children.set(child, value);
            return;
        }


            if (undefined == this._directory) {
                throw new Error(`Directory is not set for "${this._name}" namespace.`);
            }

        // Do not reload child if it is cached
        if (!this._children.has(child)) {
            // Load sub-namespace if exists
            try {
                let file = path.resolve(this._directory, child),
                    stats = fs.statSync(file);
                if (stats.isDirectory()) {
                    this._children.set(child, new Namespace(child, this, file));
                    return this._children.get(child);
                }

            } catch (err) {}

            // Load class if exists
            try {
                let file = path.resolve(this._directory, `${child}.js`),
                    stats = fs.statSync(file);
                if (stats.isFile()) {
                    var C = require(file);
                    C._autoload = {
                        file: file,
                        namespace: this
                    };
                    this._children.set(child, C);
                    return this._children.get(child);
                }

            } catch (err) {}
        }
        return this._children.get(child);
    }
}

module.exports = Namespace;
