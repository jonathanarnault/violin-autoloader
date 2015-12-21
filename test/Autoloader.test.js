/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var path = require("path");

var Autoloader = require("../src/Autoloader.js"),
    Namespace = require("../src/Namespace.js");

const NAMESPACE_DIRECTORY = path.resolve(__dirname, "rt");

describe("Autoloader", function () {
    describe("#register()", function () {
        it ("should register autoloader", function () {
            var autoloader = new Autoloader();
            autoloader.namespace("rt", path.resolve(__dirname, "use-case"));
            (function () {
                autoloader.register();
                autoloader.unregister();
            }).should.not.throw;
            (root instanceof Namespace).should.be.true;
        });

        it("should throw an error if an autoloader is already registered", function () {
            var autoloader1 =  new Autoloader(),
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
            var autoloader = new Autoloader();
            autoloader.namespace("rt", path.resolve(__dirname, "use-case"));
            autoloader.register();
            autoloader.unregister();
            (function () {
                root;
            }).should.throw;
        });

        it("should throw an error if an autoloader is not registered", function () {
            var autoloader =  new Autoloader();
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
            var autoloader =  new Autoloader();
            autoloader.namespace("rt", path.resolve(__dirname, "rt"));
            autoloader.namespace("namespace.sub.sub", path.resolve(__dirname, "use-case"));

            autoloader.register();
            (root instanceof Namespace).should.be.true;
            (namespace instanceof Namespace).should.be.true;
            (namespace.sub instanceof Namespace).should.be.true;
            (namespace.sub.sub instanceof Namespace).should.be.true;
            autoloader.unregister();
        });

        it("should update unset directories for existing namespaces", function () {
            var autoloader =  new Autoloader();
            autoloader.namespace("rt.c", NAMESPACE_DIRECTORY);
            autoloader.namespace("rt", NAMESPACE_DIRECTORY);
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
            var autoloader =  new Autoloader();
            autoloader.namespace("rt", path.resolve(__dirname, "use-case"));
            autoloader.register();
            (function () {
                autoloader.namespace("ns", path.resolve(__dirname, "use-case"));
            }).should.throw;
            autoloader.unregister();
        });
    });
});
