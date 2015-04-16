# violin-autoloader

Autoloader for Node.Js

## Installation

`npm install violin-autoloader`

Will install the latest version of violin-autoloader (currently 0.5.0)

## Example

```js
var Autoloader = require("violin-autoloader"),
    autoloader = new Autoloader();

autoloader.registerNamespace("mynamespace", "directory");
autoloader.load("filename.js");

autoloader.load("dir", true, function (exp) { // called for each file loaded

    // Do something with exp 
    
}, function () { // Called when load is done
    autoloader.register(function () { // Register autoloader
        var myclass = new mynamespace.MyClass();
    });
});
```