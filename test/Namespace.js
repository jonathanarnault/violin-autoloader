/**
 * This file is part of the Violin package.
 *
 * (c) Jonathan ARNAULT <contact@jonathanarnault.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var path = require("path"),
    should = require("should");

var Namespace = require("../src/Namespace.js");

describe("Namespace", function () {
    var A = function () {},
        B = function () {};

    var a = new Namespace("a", path.join(__dirname, "namespaces", "a")),
        b = new Namespace("b", a),
        d = new Namespace("d", a),
        c = new Namespace("c", [path.join(__dirname, "namespaces", "c", "d"), path.join(__dirname, "namespaces", "c", "e")], b);

    a.addClass("A", A);
    a.addClass("B", B);

    describe("#getName()", function () {
        it("should return a String", function () {
            a.getName().should.be.a.String;
            b.getName().should.be.a.String;
            c.getName().should.be.a.String;
        });

        it("should return the name of the namespace", function () {
            a.getName().should.be.exactly("a");
            b.getName().should.be.exactly("b");
            c.getName().should.be.exactly("c");
        });
    });

    describe("#getFullName()", function () {
        it("should return a String", function () {
            a.getFullName().should.be.a.String;
            b.getFullName().should.be.a.String;
            c.getFullName().should.be.a.String;
        });

        it("should return the full name of the namespace", function () {
            a.getFullName().should.be.exactly("a");
            b.getFullName().should.be.exactly("a.b");
            c.getFullName().should.be.exactly("a.b.c");
        });
    });

    describe("#getParent()", function () {
        it("should return null if no parent are given", function () {
            (a.getParent() === null).should.be.true;
        });

        it("should return the parent if given", function () {
            (b.getParent() === null).should.be.false;
            b.getParent().getName().should.be.exactly("a");
        });
    });

    describe("#getDirectories()", function () {
        it("should return an Array or a String", function () {
            a.getDirectories().should.be.a.String;
            b.getDirectories().should.be.a.String;
            c.getDirectories().should.be.an.Array;
        });

        it("should return autoload directories for the namespace", function () {
            a.getDirectories().should.equal(path.join(__dirname, "namespaces", "a"));
            b.getDirectories().should.equal(path.join(__dirname, "namespaces", "a", "b"));
            c.getDirectories().should.eql([path.join(__dirname, "namespaces", "c", "d"), path.join(__dirname, "namespaces", "c", "e")]);
        });
    });

    describe("#hasChild()", function () {
        it("should return whether the namespace has a child of the given name", function () {
            a.hasChild("b").should.be.true;
            a.hasChild("c").should.be.false;
            b.hasChild("c").should.be.true;
        });
    });

    describe("#getChild()", function () {
        it("should return a namespace or undefined", function () {
            (a.getChild("c") === undefined).should.be.true;
            a.getChild("b").should.be.an.instanceOf(Namespace);
            a.getChild("b").getName().should.be.exactly("b");
        });

        it("should return the namespace of the given name", function () {
            a.getChild("b").getName().should.be.exactly("b");
            b.getChild("c").getName().should.be.exactly("c");
        });
    });

    describe("#getChildren()", function () {
        it("should return an Array", function () {
            a.getChildren().should.be.an.Array;
            b.getChildren().should.be.an.Array;
            c.getChildren().should.be.an.Array;
        });

        it("should return all children", function () {
            a.getChildren().length.should.be.exactly(2);
            b.getChildren().length.should.be.exactly(1);
            b.getChildren()[0].getName().should.be.exactly("c");
            c.getChildren().length.should.be.exactly(0);
        });
    });

    describe("#getClass()", function () {
        it("should return a Function or undefined", function () {
            a.getClass("A").should.be.a.Function;
            (b.getClass("A") === undefined).should.be.true;
        });

        it("should return the Function associated with the key", function () {
            a.getClass("A").should.be.exactly(A);
            a.getClass("A").should.not.be.exactly(B);
            a.getClass("B").should.be.exactly(B);
        });
    });

    describe("#getClasses()", function () {
        it("should return an Array", function () {
            a.getClasses().should.be.an.Array;
        });

        it("should return all children", function () {
            a.getClasses().length.should.be.exactly(2);
            b.getClasses().length.should.be.exactly(0);
        });
    });
});