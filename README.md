# violin-autoloader

Autoloader for Node.Js

## Installation

`npm install violin-autoloader`

Will install the latest version of violin-autoloader (currently 0.3.1)

## Example

```js
var Autoloader = require("violin-autoloader"),
    autoloader = new Autoloader();

autoloader.registerNamespace("mynamespace", "directory");

autoloader.register(function () {
    var myclass = new mynamspace.MyClass();
});
```