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

//autoloader.loadBindings("bindings", path.resolve("test", "bindings"), function () {
autoloader.register(function () {

    describe("Autoloader", function () {

        it("should not override namespaces behavior", function () {
            a.b.getDirectories().should.be.a.string;
            a.b.d.getDirectories().should.be.a.string;
        });

        it("should add class filename in a static field for each autoloaded class", function () {
            a.b.E._autoloader.filename.should.be.a.String;
        });

        it("should add class namespace in a static field for each autoloaded class", function () {
            a.b.E._autoloader.namespace.should.be.instanceOf(Namespace);
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

        describe("#load()", function () {
            var a = new Autoloader();

            it("should throw an error if file does not exist", function () {
                (function () {
                    a.load(path.join(__dirname, "namespaces", "unexisting"));
                }).should.throw;
            });

            it("should load an existing file", function () {
                (function () {
                    a.load(path.join(__dirname, "namespaces", "load.js"));
                }).should.not.throw;

                a.load(path.join(__dirname, "namespaces", "load.js"))
                global.load.should.be.a.String;
            });

            it("should load an existing directory", function () {
                (function () {
                    a.load(path.join(__dirname, "namespaces", "load"));
                }).should.not.throw;

                a.load(path.join(__dirname, "namespaces", "load"))
                global.loadA.should.be.a.String;
            });

            it("should load an existing directory recursively", function () {
                (function () {
                    a.load(path.join(__dirname, "namespaces", "load"), true);
                }).should.not.throw;

                a.load(path.join(__dirname, "namespaces", "load"), true, function(str) {}, function() {
                    global.loadB.should.be.a.String;
                });
            });

            it("should be able to load a file or a directory with a callback", function () {
                a.load(path.join(__dirname, "namespaces", "load-cb.js"), function (str) {
                    str.should.be.a.String;
                });

                a.load(path.join(__dirname, "namespaces", "load-cb"), true, function (str) {
                    str.should.be.a.String;
                });
            });

            it("should be able to load a file or a directory with a callback asynchronously", function (done) {
                a.load(path.join(__dirname, "namespaces", "load-cb"), true, function (str) {
                    str.should.be.a.String;
                }, function () {
                    done();
                });
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

        /*describe("#loadBindings", function () {
         it("should create namespaces", function () {
         assert(bindings instanceof Namespace);
         assert(!(bindings.printstring instanceof Namespace));
         assert(bindings.printuint32 instanceof Namespace);
         });

         it("created namespaces should be correct", function () {
         bindings.getChildren().should.have.lengthOf(1);
         assert(bindings.printstring);

         bindings.printuint32.getChildren().should.be.empty;
         assert(bindings.printuint32.Release);
         });
         });*/
    });
});
//});