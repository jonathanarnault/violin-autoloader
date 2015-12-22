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

describe("Namespace", () => {

    describe("#constructor()", () => {
        var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
        it("should set the namespace name", () => {
            n._name.should.be.equal(NAMESPACE_NAME);
            n.child("a")._name.should.be.equal("a");
        });

        it("should set the namespace parent", () => {
            (NAMESPACE_PARENT === n._parent).should.be.true;
            n.child("a")._parent.should.be.equal(n);
        });

        it("should set the namespace directory", () => {
            n._directory.should.be.equal(NAMESPACE_DIR);
            n.child("a")._directory.should.be.equal(path.resolve(NAMESPACE_DIR, "a"));
        });
    });

    describe("#child()", () => {
        it("should return sub-namespace", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            n.child("a").should.be.an.instanceOf(Namespace);
            n.child("b").should.be.an.instanceOf(Namespace);
            n.child("a").child("c").should.be.an.instanceOf(Namespace);
        });

        it("should set a sub-namespace", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR),
                child = new Namespace(NAMESPACE_NAME, n, path.resolve(NAMESPACE_DIR, NAMESPACE_NAME));

            n.child(NAMESPACE_NAME, child);
            n.child(NAMESPACE_NAME).should.be.equal(child);
        });

        it("should return a class", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            n.child("A").should.be.a.function;
            n.child("a").child("C").should.be.a.function;
            n.child("a").child("c").child("D").should.be.a.function;
            n.child("b").child("B").should.be.a.function;
        });

        it("should set a class", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR),
                E = function E () {};

            n.child("E", E);
            n.child("E").should.be.equal(E);
        });

        it("should throw an exception if there is no directory set when accessing a non cached child", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT),
                b = new Namespace(NAMESPACE_NAME, n);
            (() => {
                n.child("a")
            }).should.throw;

            (() => {
                n.child("b")
            }).should.throw;
        });
    });

    describe("#children", () => {
        it("should be a getter", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            (() => {
                n.children = "";
            }).should.throw;
        });
        it("should return an array of string", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            n.child("a");
            n.child("b");

            n.children.should.be.an.Array;
            for (let child of n.children) {
                child.should.be.a.String;
            }
        });
    });

    describe("#directory", () => {
        it("should be a setter", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            (undefined === n.directory).should.be.true;
        });
        it("should set a directory if not already set", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT);
            (() => {
                n.directory = __dirname;
            }).should.not.throw;
        });
        it("should throw an error if directory is already set", () => {
            var n = new Namespace(NAMESPACE_NAME, NAMESPACE_PARENT, NAMESPACE_DIR);
            (() => {
                n.directory = __dirname;
            }).should.throw;
        });
    });
});
