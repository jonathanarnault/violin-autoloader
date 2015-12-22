"use strict";

/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var path = require("path"),
    sinon = require("sinon");

var Autoloader = require("../src/Autoloader.js"),
    Namespace = require("../src/Namespace.js");

const   NAMESPACE_NAME = "rt",
        NAMESPACE_DIRECTORY = path.resolve(__dirname, "use-case", "namespaces"),
        LOAD_DIRECTORY = path.resolve(__dirname, "use-case", "load");

describe("Autoloader", function () {
    describe("#register()", function () {
        it ("should register autoloader", function () {
            let autoloader = new Autoloader();
            autoloader.namespace(NAMESPACE_NAME, NAMESPACE_DIRECTORY);
            (function () {
                autoloader.register();
                autoloader.unregister();
            }).should.not.throw;
            (root instanceof Namespace).should.be.true;
        });

        it("should throw an error if an autoloader is already registered", function () {
            let autoloader1 =  new Autoloader(),
                autoloader2 = new Autoloader();
            autoloader1.register();
            (function () {
                autoloader1.register();
            }).should.throw;
            (function () {
                autoloader2.register();
            }).should.throw;
            autoloader1.unregister();
        });
    });

    describe("#unregister()", function () {
        it ("should unregister autoloader", function () {
            let autoloader = new Autoloader();
            autoloader.namespace(NAMESPACE_NAME, NAMESPACE_DIRECTORY);
            autoloader.register();
            autoloader.unregister();
            (function () {
                root;
            }).should.throw;
        });

        it("should throw an error if an autoloader is not registered", function () {
            let autoloader =  new Autoloader();
            (function () {
                autoloader.unregister();
            }).should.throw;

            (function () {
                autoloader.register();
                autoloader.unregister();
            }).should.not.throw;
        });
    });

    describe("#namespace()", function () {
        it("should register a namespace", function () {
            let autoloader =  new Autoloader();
            autoloader.namespace(NAMESPACE_NAME, NAMESPACE_DIRECTORY);
            autoloader.namespace("namespace.sub.sub", NAMESPACE_DIRECTORY);

            autoloader.register();
            (root instanceof Namespace).should.be.true;
            (namespace instanceof Namespace).should.be.true;
            (namespace.sub instanceof Namespace).should.be.true;
            (namespace.sub.sub instanceof Namespace).should.be.true;
            autoloader.unregister();
        });

        it("should update unset directories for existing namespaces", function () {
            let autoloader =  new Autoloader();
            autoloader.namespace(`${NAMESPACE_NAME}.c`, NAMESPACE_DIRECTORY);
            autoloader.namespace(NAMESPACE_NAME, NAMESPACE_DIRECTORY);
            autoloader.namespace("namespace.sub.sub.sub", NAMESPACE_DIRECTORY);
            autoloader.namespace("namespace.sub", NAMESPACE_DIRECTORY);

            autoloader.register();
            rt[Autoloader.NAMESPACE_ACCESSOR_KEY]._directory.should.be.equal(NAMESPACE_DIRECTORY);
            rt.c[Autoloader.NAMESPACE_ACCESSOR_KEY]._directory.should.be.equal(NAMESPACE_DIRECTORY);
            (null == namespace[Autoloader.NAMESPACE_ACCESSOR_KEY]._directory).should.be.true;
            namespace.sub[Autoloader.NAMESPACE_ACCESSOR_KEY]._directory.should.be.equal(NAMESPACE_DIRECTORY);
            (null == namespace.sub.sub[Autoloader.NAMESPACE_ACCESSOR_KEY]._directory).should.be.true;
            namespace.sub.sub.sub[Autoloader.NAMESPACE_ACCESSOR_KEY]._directory.should.be.equal(NAMESPACE_DIRECTORY);
            autoloader.unregister();
        });

        it("should throw an error if autoloader is registered", function () {
            let autoloader =  new Autoloader();
            autoloader.namespace(NAMESPACE_NAME, NAMESPACE_DIRECTORY);
            autoloader.register();
            (function () {
                autoloader.namespace("ns", NAMESPACE_DIRECTORY);
            }).should.throw;
            autoloader.unregister();
        });
    });

    describe("#load()", function () {
        it("should load a file", function (done) {
            Autoloader.load(path.resolve(LOAD_DIRECTORY, "A.js"), function (err) {
                global.__A_LOADED__.should.be.true;
                (!err).should.be.true;
                done();
            });
        });

        it("should load a directory recursively", function (done) {
            Autoloader.load(path.resolve(LOAD_DIRECTORY, "dir"), function (err) {
                global.__B_LOADED__.should.be.true;
                global.__C_LOADED__.should.be.true;
                global.__D_LOADED__.should.be.true;
                (!err).should.be.true;
                done();
            });
        });

        it("should apply a callback for each require if provided", function (done) {
            let callback = sinon.spy();
            Autoloader.load(path.resolve(LOAD_DIRECTORY, "A.js"), function (err) {
                callback.should.be.calledWith("export");
                callback.should.have.callCount(1);
                Autoloader.load(path.resolve(LOAD_DIRECTORY, "dir"), function (err) {
                    callback.should.be.calledWith("export");
                    callback.should.have.callCount(1 + 3);
                    done();
                }, callback);
            }, callback);
        });

        it("should return an error if a file cannot be loaded", function (done) {
            Autoloader.load(path.resolve(LOAD_DIRECTORY, "B.js"), function (err) {
                (!!err).should.be.true;
                Autoloader.load(path.resolve(LOAD_DIRECTORY, "unexisting"), function (err) {
                    (!!err).should.be.true;
                    done();
                });
            });
        });

        it("should only load javascript files", function (done) {
            let callback = sinon.spy();
            Autoloader.load(path.resolve(LOAD_DIRECTORY, "js"), function (err) {
                callback.should.be.calledWith("export");
                callback.should.have.callCount(1);
                Autoloader.load(path.resolve(LOAD_DIRECTORY, "js", "A.txt"), function (err) {
                    callback.should.have.callCount(1);
                    done()
                }, callback);
            }, callback);
        });
    });
});
