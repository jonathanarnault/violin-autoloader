/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var path = require('path'),
    assert = require('assert'),
    should = require('should');

var Autoloader = require('../src/Autoloader.js'),
    Namespace = require('../src/Namespace.js'),
    autoloader = new Autoloader();

autoloader.registerNamespace('a.b.c', path.join(__dirname, 'namespaces', 'c'));
autoloader.registerNamespace('a.b', path.join(__dirname, 'namespaces', 'b'));
autoloader.registerNamespace('a', path.join(__dirname, 'namespaces', 'a'));
autoloader.registerNamespace('d', path.join(__dirname, 'namespaces', 'd'));
autoloader.registerNamespace('', path.join(__dirname, 'namespaces', 'default'));

autoloader.register(function () {

    describe('Autoloader', function () {
        describe('#getNamespace()', function () {
            it('should return a Namespace', function () {
                autoloader.getNamespace().should.be.instanceOf(Namespace);
            });

            it('should return the root namespace', function () {
                autoloader.getNamespace().getName().should.be.exactly('');
            });
        });

        describe('#register()', function () {
            it('should throw an error if autoloader is frozen', function () {
                (function () {
                    autoloader.register(function () {

                    });
                }).should.throw();
            });

            it('should not throw an error if autoloader is not frozen', function () {
                var auto = new Autoloader();
                (function () {
                    auto.register(function () {

                    });
                }).should.not.throw();
            });
        });

        describe('#registerNamespace()', function () {
            it('should throw an error if autoloader is frozen', function () {
                (function () {
                    autoloader.registerNamespace('e', path.join(__dirname, 'namespaces', 'e'));
                }).should.throw();
            });

            it('should not throw an error if autoloader is not frozen', function () {
                var auto = new Autoloader();
                (function () {
                    auto.registerNamespace('e', path.join(__dirname, 'namespaces', 'e'));
                }).should.not.throw();
            });
        });

        describe('Access a namespace', function () {
            it('should not throw an error if namespace or class exists', function () {
                (function () {
                    var E = new a.b.E(),
                        B = new a.b.c.d.B(),
                        F = new d.F();
                        G = new e.G();
                }).should.not.throw();
            });

            it('should throw an error if class does not exist', function () {
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