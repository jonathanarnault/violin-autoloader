# violin-autoloader

Simple class autoloader for Node.Js

## Installation

`npm install violin-autoloader`

Will install the latest version of violin-autoloader (currently 1.0.0)

## Documentation

### Usage
```js
var Autoloader = require("violin-autoloader"),
    autoloader = new Autoloader();

    // Register namespaces, bindings, ...

    // This will add namespaces to global context
    autoloader.register();

    // Unregister autoloader (this will remove namespaces from global context)
    autoloader.unregister();
```

### Register a namespace
```js
// Register a root namespace
autoloader.namespace("violin", "directory");

// Register a sub-namespace directly
autoloader.namespace("violin.autoloader", "another-directory");

// This can be done for multiple levels
autoloader.namespace("violin.sub.sub.sub", "sub-directory");
```

If a sub-namespace is registered before one of its parents, the directory for all non-existing namespace will be set to null. Registering one of his parents later will update the directory of the latter.


### Load bindings

```js
autoloader.binding("binding", "directory");
```

This method will load a binding and create namespaces if required. It will then add all the key-value pairs to the namespace as children.


### Load files or directories

```js
// Load a file
Autoloader.load("filename.js");

// Load a directory recursively
Autoloader.load("directory");

// Apply a callback for each loaded file
Autoloader.load("directory", (exp) => {
    // Do something
});
```

### Load modules
```js
// Require module-name/autoload.js
autoloader.module("module-name");
```

```js
// module-name/autoload.js
module.exports = {
    namespaces: {
        "namespace": "directory"
    },
    bindings: {
        "binding": "directory"
    },
    loads: [
        "directory"
    ],
    modules: [
        "another-module"
    ]
};

```
