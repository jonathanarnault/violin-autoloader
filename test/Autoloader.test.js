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
        LOAD_DIRECTORY = path.resolve(__dirname, "use-case", "load"),
        BINDING_DIRECTORY = path.resolve(__dirname, "use-case", "binding");

describe("Autoloader", () => {
    describe("#register()", () => {
        it ("should register autoloader", () => {
            let autoloader = new Autoloader();
            autoloader.namespace(NAMESPACE_NAME, NAMESPACE_DIRECTORY);
            (() => {
                autoloader.register();
                autoloader.unregister();
            }).should.not.throw;
            (root instanceof Namespace).should.be.true;
        });

        it("should throw an error if an autoloader is already registered", () => {
            let autoloader1 =  new Autoloader(),
                autoloader2 = new Autoloader();
            autoloader1.register();
            (() => {
                autoloader1.register();
            }).should.throw;
            (() => {
                autoloader2.register();
            }).should.throw;
            autoloader1.unregister();
        });
    });

    describe("#unregister()", () => {
        it ("should unregister autoloader", () => {
            let autoloader = new Autoloader();
            autoloader.namespace(NAMESPACE_NAME, NAMESPACE_DIRECTORY);
            autoloader.register();
            autoloader.unregister();
            (() => {
                root;
            }).should.throw;
        });

        it("should throw an error if an autoloader is not registered", () => {
            let autoloader =  new Autoloader();
            (() => {
                autoloader.unregister();
            }).should.throw;

            (() => {
                autoloader.register();
                autoloader.unregister();
            }).should.not.throw;
        });
    });

    describe("#load()", () => {
        it("should load a file", () => {
            Autoloader.load(path.resolve(LOAD_DIRECTORY, "A.js"));
            global.__A_LOADED__.should.be.true;
        });

        it("should load a directory recursively", () => {
            Autoloader.load(path.resolve(LOAD_DIRECTORY, "dir"));
            global.__B_LOADED__.should.be.true;
            global.__C_LOADED__.should.be.true;
            global.__D_LOADED__.should.be.true;
        });

        it("should apply a callback for each require if provided", () => {
            let callback = sinon.spy();
            Autoloader.load(path.resolve(LOAD_DIRECTORY, "A.js"), callback);
            callback.should.be.calledWith("export");
            callback.should.have.callCount(1);

            Autoloader.load(path.resolve(LOAD_DIRECTORY, "dir"), callback);
            callback.should.be.calledWith("export");
            callback.should.have.callCount(1 + 3);
        });

        it("should throw an error if a file cannot be loaded", () => {
            (() => {
                Autoloader.load(path.resolve(LOAD_DIRECTORY, "B.js"))
            }).should.throw;
            (() => {
                Autoloader.load(path.resolve(LOAD_DIRECTORY, "unexisting"))
            }).should.throw;
        });

        it("should only load javascript files", () => {
            let callback = sinon.spy();
            Autoloader.load(path.resolve(LOAD_DIRECTORY, "js"), callback);
            callback.should.be.calledWith("export");
            callback.should.have.callCount(1);

            Autoloader.load(path.resolve(LOAD_DIRECTORY, "js", "A.txt"), callback);
            callback.should.have.callCount(1);
        });
    });

    describe("#namespace()", () => {
        it("should register a namespace", () => {
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

        it("should update unset directories for existing namespaces", () => {
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

        it("should throw an error if autoloader is registered", () => {
            let autoloader =  new Autoloader();
            autoloader.namespace(NAMESPACE_NAME, NAMESPACE_DIRECTORY);
            autoloader.register();
            (() => {
                autoloader.namespace("ns", NAMESPACE_DIRECTORY);
            }).should.throw;
            autoloader.unregister();
        });
    });

    describe("#binding()", () => {
        it("should load a binding", () => {
            let autoloader =  new Autoloader();
            autoloader.binding("bindings.hw", BINDING_DIRECTORY);
            autoloader.register();
            let hello = bindings.hw.hello; // Cannot be used immediately
            hello().should.be.equal("world");
            autoloader.unregister();
        });

        it("should throw an error while trying to load an unexisting binding", () => {
            let autoloader =  new Autoloader();
            (() => {
                autoloader.binding("bindings.hw", path.resolve(BINDING_DIRECTORY, "unexisting"));
            }).should.throw;
        });
    });
});
