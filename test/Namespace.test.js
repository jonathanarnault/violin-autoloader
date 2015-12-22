"use strict";

/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var path = require("path");

var Namespace = require("../src/Namespace.js");

const   NAMESPACE_NAME = "rt",
        NAMESPACE_PARENT = null,
        NAMESPACE_DIR = path.resolve(__dirname, "use-case", "namespaces");

describe("Namespace", function () {

    describe("#constructor()", function () {
        var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
        it("should set the namespace name", function () {
            n._name.should.be.equal(NAMESPACE_NAME);
            n.child("a")._name.should.be.equal("a");
        });

        it("should set the namespace parent", function () {
            (NAMESPACE_PARENT === n._parent).should.be.true;
            n.child("a")._parent.should.be.equal(n);
        });

        it("should set the namespace directory", function () {
            n._directory.should.be.equal(NAMESPACE_DIR);
            n.child("a")._directory.should.be.equal(path.resolve(NAMESPACE_DIR, "a"));
        });
    });

    describe("#child()", function () {
        it("should return sub-namespace", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            n.child("a").should.be.an.instanceOf(Namespace);
            n.child("b").should.be.an.instanceOf(Namespace);
            n.child("a").child("c").should.be.an.instanceOf(Namespace);
        });

        it("should set a sub-namespace", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR),
                child = new Namespace(NAMESPACE_NAME, n, path.resolve(NAMESPACE_DIR, NAMESPACE_NAME));

            n.child(NAMESPACE_NAME, child);
            n.child(NAMESPACE_NAME).should.be.equal(child);
        });

        it("should return a class", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            n.child("A").should.be.a.function;
            n.child("a").child("C").should.be.a.function;
            n.child("a").child("c").child("D").should.be.a.function;
            n.child("b").child("B").should.be.a.function;
        });

        it("should set a class", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR),
                E = function E () {};

            n.child("E", E);
            n.child("E").should.be.equal(E);
        });

        it("should throw an exception if there is no directory set when accessing a non cached child", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT),
                b = new Namespace(NAMESPACE_NAME, n);
            (function () {
                n.child("a")
            }).should.throw;

            (function () {
                n.child("b")
            }).should.throw;
        });
    });

    describe("#children", function () {
        it("should be a getter", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            (function () {
                n.children = "";
            }).should.throw;
        });
        it("should return an array of string", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            n.child("a");
            n.child("b");

            n.children.should.be.an.Array;
            for (let child of n.children) {
                child.should.be.a.String;
            }
        });
    });

    describe("#directory", function () {
        it("should be a setter", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            (undefined === n.directory).should.be.true;
        });
        it("should set a directory if not already set", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT);
            (function () {
                n.directory = __dirname;
            }).should.not.throw;
        });
        it("should throw an error if directory is already set", function () {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            (function () {
                n.directory = __dirname;
            }).should.throw;
        });
    });
});
