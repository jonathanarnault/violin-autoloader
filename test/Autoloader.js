/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var path = require("path"),
    assert = require("assert"),
    should = require("should");

var Autoloader = require("../src/Autoloader.js"),
    Namespace = require("../src/Namespace.js"),
    autoloader = new Autoloader();

autoloader.registerNamespace("a.b.c", path.join(__dirname, "namespaces", "c"));
autoloader.registerNamespace("a.b", path.join(__dirname, "namespaces", "b"));
autoloader.registerNamespace("a", path.join(__dirname, "namespaces", "a"));
autoloader.registerNamespace("d", path.join(__dirname, "namespaces", "d"));
autoloader.registerNamespace("", path.join(__dirname, "namespaces", "default"));

autoloader.register(function () {

    describe("Autoloader", function () {

        it("should not override namespaces behavior", function () {
            a.b.getDirectories().should.be.a.string;
            a.b.d.getDirectories().should.be.a.string;
        });

        describe("#getNamespace()", function () {
            it("should return a Namespace or undefined", function () {
                autoloader.getNamespace("a").should.be.instanceOf(Namespace);
                autoloader.getNamespace("d").should.be.instanceOf(Namespace);
                (autoloader.getNamespace("e") === undefined).should.be.true;
            });

            it("should return the namespace of the given name", function () {
                autoloader.getNamespace("a").getName().should.be.exactly("a");
                autoloader.getNamespace("d").getName().should.be.exactly("d");
            });
        });

        describe("#getNamespaces()", function () {
            it("should return an Array", function () {
                autoloader.getNamespaces().should.be.an.Array;
            });

            it("should return registered namespaces", function () {
                autoloader.getNamespaces().length.should.be.exactly(2);
            });
        });

        describe("#register()", function () {
            it("should throw an error if autoloader is frozen", function () {
                (function () {
                    autoloader.register(function () {

                    });
                }).should.throw();
            });

            it("should not throw an error if autoloader is not frozen", function () {
                var auto = new Autoloader();
                (function () {
                    auto.register(function () {

                    });
                }).should.not.throw();
            });
        });

        describe("#registerNamespace()", function () {
            it("should throw an error if autoloader is frozen", function () {
                (function () {
                    autoloader.registerNamespace("e", path.join(__dirname, "namespaces", "e"));
                }).should.throw();
            });

            it("should not throw an error if autoloader is not frozen", function () {
                var auto = new Autoloader();
                (function () {
                    auto.registerNamespace("e", path.join(__dirname, "namespaces", "e"));
                }).should.not.throw();
            });
        });

        describe("Access a namespace", function () {
            it("should not throw an error if namespace or class exists", function () {
                (function () {
                    var E = new a.b.E(),
                        B = new a.b.c.d.B(),
                        F = new d.F();
                    G = new e.G();
                }).should.not.throw();
            });

            it("should throw an error if class does not exist", function () {
                (function () {
                    var E = new d.E();
                }).should.throw();

                (function () {
                    var D = new a.b.D();
                }).should.throw();

                (function () {
                    var G = new k.G();
                }).should.throw();
            });
        });
    });
});