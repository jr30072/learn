/*****************************************************************
 * 
 * Closures
 * 
 *****************************************************************/

function makeAdder(increment) {
    // The function "add" has access to the "increment" variable (it has a closure to that variable); this variable is accessible to "add" function even after the makeAdder function has finished
    // From "Thinking in Java": A closure is a callable thing that retains information from the scope in which it was created
    // Multiple calls to makeAdder create multiple instances of the "add" function
    function add(to) {
        var sum = to + increment;
        console.log("%d + %d = %d", to, increment, sum);
        to = sum;
    }
    // The changeIncrement function also has access to the same "increment" variable after makeAdder has finished
    function changeIncrement(newIncrement) {
        increment = newIncrement;
    }
    // When the caller of makeAdder saves the "add" and changeIncrement functions, it will have functions that have a reference to the same "increment" variable that was created when invoking this function. Further calls to makeAdder will create other "increment" variables 
    return [add, changeIncrement];
}

// We get an array of functions: an "add" function instance, that has a reference to an "increment" variable, whose value is 1, and a changer function, that allows for changing the increment variable
var adder = makeAdder(1);
var plusOne = adder[0];
var changePlusOne = adder[1];
// We get another array of functions: an "add" function instance, that has a reference to another "increment" variable, whose value this time is 10, and a changer function, that allows for changing the second increment variable
adder = makeAdder(10)
var plusTen = adder[0];

plusOne(5); // Adds 1 to 5
plusTen(7); // Adds 10 to 7

// Now let's ruin plusOne by changing its increment...
changePlusOne(2);
plusOne(5); // Adds 2 to 5 this time...

plusTen(7); // Still adds 10 to 7, because plusOne and plusTen have references to different instances of the "increment" variable; to change plusTen's increment we would have to retain a reference to its changer function from the "adder" array above, and call it - or call it directly from the array:
adder[1](9); // call plusTen's increment changer directly from the array returned by makeAdder
plusTen(7); // Now we've ruined plusTen, too: it adds 9 to 7


//// Demonstration that a function has a "closure" on the variables in its scope, even when those variables are gone once their scope is finished

function foo() {
    var a = 2;

    function bar() {
        console.log("I have a closure on this variable whose value is %d", a);
    }

    return bar;
}

var baz = foo();

baz(); // 2 -- Whoa, closure was just observed, man.
// Calling bar via baz as above produces 2 because bar is a callable thing (a function) that retains information (e.g. variables) from the scope in which it was created (the scope of foo())

// console.log("I'm trying to access that variable that baz (which is a reference to bar) said to have a closure on, a = ", a); // ReferenceError, a is not declared in this scope; although baz still has access to it thanks to its closure (=reference) on it


//// Another closure example from the YDKJS book - trying to print incremented numbers at 1-second intervals using setTimeout

var timeout;

timeout = 100;
setTimeout(function log1() {
    console.log("Try 1 I'm not counting numbers correctly")
}, timeout);
for (var i=1; i<=5; i++) {
    setTimeout( function timer(){
        console.log("Try 1 No %d", i);
    }, timeout + i );
}
// The above code does not count correctly, because each call to setTimeout gives it a new function called "timer", and each "timer" functions have a closure on the same "i" variable. Whenever a "timer" function is called, it uses whatever value is in "i" at that time. By the time the for loop finishes, no timer function would have been called (not even if the interval would be 0). So when all timer functions are called, i is already 6

// Let's fix it. The idea is to create a new scope for each "timer" function, scope that would make sure each "timer" function retains a reference to a variable with the proper value. To achieve this we use an Immediately Invoked Function Expression (IIFE), that creates a new scope. In this new scope we declare a new variable that has its value set to i's value. Because the IIFE is executed right-away, it will save in j the value of i at the moment of creating the timer. And since in the "timer" function we now use j, it will have the correct value. Since each time the loop is entered a new IIFE is created and executed, we effectively have 5 IIFEs, which create 5 scopes, each one with a "j" variable and a "timer" function passed to setTimeout
// In ECMAScript 6 and above, we would have achieved the same efect *without* and IIFE but replacing "var j" with "let j". "let" turns a scopeless block into a scope (normally, only function blocks have a scope)
timeout = 200;
setTimeout(function log2() {
    console.log("Try 2 Now I'm counting numbers correctly")
}, timeout);
for (var i=1; i<=5; i++) {
    (function createAVariableInANewScope() {
        var j = i; // use "let" instead of "var" here and the code works without the createAVariableInANewScope function declaration
        setTimeout( function timer(){
            console.log("Try 2 No %d", j); // Must use j here, as j is set to the current value of i, and it will keep its value for the "timer" function
        }, timeout + i ) // I don't need to use j here as this expression is executed right away. I need to use j only in the function that will be executed later, function that will make use of the closured variable
    })();
}

// As stated above, in ECMAScript 6 we can use "let" to declare j and solve the problem without the need for an IIFE. Even better, if we use "let" in the for loop, the variable "i" will be declared not just once for the loop, but once for each iteration, setting it with the right value. This way the original code works in ECMAScript 6 if we just replace "var" with "let":
timeout = 300;
setTimeout(function log3() {
    console.log("Try 3 I'm counting numbers correctly using 'let' in ECMAScript 6")
}, timeout);
for (let i=1; i<=5; i++) {
    setTimeout( function timer(){
        console.log("Try 3 No %d", i);
    }, timeout + i );
}


//// Closures used to create modules

function Robot() {
    var name;
    var ability;
    
    // closure function: it has references to the name and ability variables that were created when Robot() was called; multiple calls to Robot() create multiple instances of the name and ability variables
    function doInit(_name, _ability) {
        name = _name;
        ability = _ability;
    }
    
    // similar closure function
    function doPerform() {
        console.log("%s is executing %s", name, ability);
    }
    
    // public interface: we define two function variables, and assign them to our implementations; this way we can change the implementation function by simply modifying the values of the function variables to point to some other functions
    var robot = {
        init: doInit,
        perform: doPerform
    }
    
    // return the public interface, so that the caller of this function gets an object that can do stuff
    return robot;
}

var robot = Robot();
robot.init("robo", "cleaning");
robot.perform();

// robot.doInit("illegal", "illegal"); // Fires a TypeError exception: doInit is not accessible


/*****************************************************************
 * 
 * "this"
 * 
 *****************************************************************/


//// What "this" is NOT

var id = "not awesome";

(function wrongTimeout1() {
    var obj = {
        id: "awesome 1",
        cool: function coolFn() {
            console.log( this.id );
        }
    };

    obj.cool(); // awesome

    setTimeout( obj.cool, 400 ); // not awesome. "this" is NOT a reference to the "class" the function is "member of", because JavaScript is NOT Object-Oriented (at least at the time of this writing)
})();

(function wrongTimeout2() {
    var obj = {
        id: "awesome 2",
        cool: function coolFn() {
            console.log( this.id );
        },
        coolTimeout: function coolTimeoutFn() {
            setTimeout(this.cool, 500);
        }
    };

    obj.coolTimeout(); // not awesome. Trying to call setTimeout from "inside" the "class" yields the same result, for the same reason: JS is NOT OO
})();

(function rightTimeout() {
    var obj = {
        id: "awesome 3",
        cool: function coolFn() {
            console.log( this.id );
        },
        coolTimeout: function coolTimeoutFn() {
            setTimeout(this.cool.bind(this), 600);
        }
    };

    obj.coolTimeout(); // awesome 3. As is explained below, it works correctly because of "this" binding by using Function.prototype.bind()
})();


// "this" is a binding made in the activation record (execution context) of a function. The activation record is created at the call-site of the function, and makes "this" to point to the object from where the function is called. In JavaScript, everything is an object (except simple primitives - string, number, boolean, null, and undefined), including the global script (variables declared in the global scope are actually part of the global object) and functions.


//// 1. default binding
function defaultBinding() {
    console.log(this.defBind); // "this" points to the global object
}
var defBind = "(1) defBind is in fact <global object>.defBind (in browsers <global object> is window)";
defaultBinding(); // "(1) ..."

// default binding in strict mode
function defaultBindingInStrictMode() {
    "use strict";
    console.log( this.defBind ); // "this" is undefined, because in strict mode the global object is not eligible for default binding
}
// defaultBindingInStrictMode(); // TypeError: this is undefined, because of strict mode
(function immediatelyCalled() {
    "use strict";
    /*var*/ defBind = "(2) although we use strict mode here, the defaultBinding() function does not use strict mode, so 'this' is allowed to bind to the global object";
    // Note: if we uncomment the "var" above, we will get at runtime the value of defBind "(1) ..." instead of "(2) ..." (!!!). Why? Because the IIFE creates its own scope, and putting "var" above will create a new variable in the scope of this IIFE. See below when using a normal function for an explanation.
    defaultBinding();
})();

// default binding from another function
function usingDefaultBinding() {
    var defBind = "(3) I'm a function so I'm an object that can be passed as 'this'";
    defaultBinding();
}
usingDefaultBinding(); // Will we get "(3) ..." ? NO!!! because not LEXICAL SCOPE is what determines "this" binding, but the OBJECT used when calling the function. In our case, although we call the function from usingDefaultBinding, we don't pass the usingDefaultBinding Function object when calling defaultBinding. So DEFAULT binding is performed.

// default binding from another function
function usingFunctionObjectBindingExplicitly() {
    arguments.callee.defBind = "(4) Now we really pass the Function object as 'this'";
    // Note: We want to pass the function object as "this", so we need defBind to be a part of that function object. If we say "var defBind = ..." above instead of "arguments.callee.defBind = ...", then defBind will be a variable partaining to the functions local LEXICAL SCOPE. So we need to make defBind part of the function object itself, so we use the above syntax 
    defaultBinding.call(arguments.callee);
}
usingFunctionObjectBindingExplicitly();


//// 2. implicit binding, when calling from a context object

function showA() {
    console.log("a is ", this.a);
}

var obj = {
    a: 2,
    showA: showA
};

var obj2 = {
    a: 42,
    obj: obj
};

obj2.obj.showA(); // 2, only the last object matters

var defaultBindingByMistake = obj.showA; // function reference/alias!

var a = "oops, global"; // `a` also property on global object

defaultBindingByMistake(); // "oops, global", because we call it without a context object

setTimeout(obj.showA, 700); // "oops, global", because setTimeout() has a function reference which it calls without a context object

// another default binding by mistake
(obj2.showA = obj.showA)(); // "oops, global", as "this" points to the global object. Why did it get to the global object? Because the result value of the assignment expression p.foo = o.foo is a reference to just the underlying function object. As such, the effective call-site is just foo(), not p.foo() or o.foo() as you might expect


//// 3. explicit binding

showA.call(obj); // 2
showA.call(obj2); // 42

// Hard binding pattern
function showAOfObj() {
    return showA.apply(obj, arguments);
}

showAOfObj(); // 2
setTimeout(showAOfObj, 710); // 2, because of hard binding: showAOfObj() always passes obj as "this"

// Hard binding helper
function bind(func, obj) {
    return function() { // we return a function, as our purpose is to have a function that always has "this" set to obj
        return func.apply(obj, arguments); // the function we return simply calls the function we receive as the first argument with all arguments
    }
}

setTimeout(bind(showA, obj2), 720); // 42, because the hard binding helper bind() will always call showA() with a "this" set to obj2

setTimeout(showA.bind(obj2), 730); // 42, this time using Function.prototype.bind(), introduced in ECMAScript 5

// Function.prototype.bind() can also be used for default arguments or "partial function application"
function sum(a, b, c) {
    console.log("the sum is", a + b + c);
}
// s4() is a partial function application of sum(): s4(b, c) = sum(4, b, c)
// Note that partial function application is different than (and not a subset of, as YDKJS says) currying: if bind() would produce currying, then s4 would return another function (say s43) that would have the parameter for b fixed (say to 3). Calling s43(c) would return the sum 4+3+c.
var s4 = sum.bind(null, 4); // "this" is set to null, 'cause we don't care for it, we just use the default arguments
s4(3, 2); // 9

// Setting "this" to null can be dangerous. If you ever use that against a function call (for instance, a third-party library function that you don't control), and that function does make a "this" reference, the default binding rule means it might inadvertently reference (or worse, mutate!) the global object (window in the browser).
// A safer way to do this is to create an empty object, specifically for this purpose. It might be a good idea to name it ø (option+o on a Mac keyboard)
var ø = Object.create(null);
var saferS4 = sum.bind(ø, 4);
saferS4(3, 2); // 9


//// 4. "new" binding

function dummy() {
    this.a = 57;
}

var d = new dummy(); // "new" does the following: 1) creates a new object; 2) sets it's prototype (not used here); 3) sets "this" to point to the newly created object for the dummy() function; 4) makes dummy() return the newly created object (unless dummy() returns something else)
console.log("my dummy is", d.a);


//// Precedence of bindings

// explicit has precedence over implicit
obj.showA.call(obj2); // 42; explicit binding has precedence over implicit binding; although we called showA via obj, it uses obj2 as "this"

var dummyObj = {
    a: 5,
    dummy: dummy
};

d = new dummyObj.dummy(); // 57
console.log("'new' has precedence over implicit binding: dummyObj's a is %d, d's a is %d", dummyObj.a, d.a);

// d = new dummyObj.dummy.call(obj2); // TypeError: new and call/apply cannot be used together

var f = dummy.bind(dummyObj);
d = new f();
console.log("'new' has precedence over hard (explicit) binding: dummyObj's a is %d, d's a is %d", dummyObj.a, d.a); // 57

//// Precedence of bindings: new, explicit, implicit, default


/*****************************************************************
 * 
 * Objects
 * 
 *****************************************************************/

// There are six primitive types: number, boolean, string, null, undefined, object.
// ECMAScript 6 adds a new primitive type: Symbol
// Leaving null and undefined aside, this means that everything that's not a number, boolean or string, is an object. So a function is an object, a callable one.

// YDKJS does not define what is a JavaScript object. Since some well-known languages that have objects are OO languages (e.g. C++, Java, Python), the common assumption might be that JS is OO too. It's NOT OO, as the above discussion on "this" has pointed out. So, what's an object in JS?

// Try my own definition: a JS object is a structure that can have data and functions, and which is passed around by reference. - this is not very accurate, as an object is closer to a hash (dictionary) than to a data structure
// YDKJS mentions that the contents of an object consist of values (any type) stored at specifically named locations, which we call properties. It also mentions that: The engine stores values in implementation-dependent ways, and may very well not store them in some object container. What is stored in the container are these property names, which act as pointers (technically, references) to where the values are stored.

// So a DEFINITION: An object is a collection of named references to values of any type. These references are called properties. The values and the object itself with its references content are stored by the Engine in an implementation-dependent way. The object is passed around by reference.

// Built-in objects: Number, Boolean, String, Object, Function; Array, Date, RegExp, Error
// Although they might have the appearance of types or "classes", they are NOT.
// Instead, they are FUNCTIONS.


//// Primitive Types and their Corresponding Objects

function showTypeofAndValue(x, msg) {
    var s;
    if ( (msg == null) || (msg === undefined) ) {
        s = "x";
    } else {
        s = msg;
    }
    console.log(s, "is a", typeof x, "and has the value", x);
}
var n;

// primitive number type
n = 2;
showTypeofAndValue(n, "n"); // number 2
// Number is actually a function that returns the primitive number type
n = Number(3);
showTypeofAndValue(n, "now n"); // number 3

// Because of the "new" operator seen above, the Number() function can also be called as a constructor (but not a "class" constructor)
n = new Number(4);
showTypeofAndValue(n, "again, n"); // Number {4}
// This can be explained if we remember that "new" constructs a new object, sets its prototype (that's where Number is coming from), sets "this" to the newly created object, and calls the given function (in this case Number) making it return the new object (instead of its primitive type number)

// primitive types are not objects, but we can call methods of their corresponding object type on them. How come?
var pi = 3.1415926;
showTypeofAndValue(pi, "pi"); // it is a primitive number type
console.log("pi is a %s with the value ~ %s", typeof pi, pi.toFixed(2)); // when we call a function of the corresponding object type, the Engine coerces the primitive type to the corresponding type; it automatically creates an object of that type (in our case Number), for that call ONLY; we don't have access to that object in our code, and it is garbage collected after our function call; our variable still remains a primitive number

// console.log("pi is a %s with the string value %s", typeof pi, pi.big()); // TypeError: pi.big is not a function; so we can't call functions of an object type that does not correspond to this primitive type

(function invokedRightAway() {
    // We can, however, "hijack" the object created by the Engine when calling functions of an object type that correspond to a primitive
    // "use strict"; // but not in strict mode
    String.prototype.returnMe = function() {
        return this;
    }
    
    var sPrimitive = "abc";
    var sObject = sPrimitive.returnMe();  
    
    showTypeofAndValue(sPrimitive, "sPrimitive"); // string abc
    showTypeofAndValue(sObject, "sObject"); // object abc
})();


//// ECMAScript 6: Computed property names and new primitive data type: Symbol
var prefix = "foo";
var myObject = {
    [prefix + "bar"]: "hello",
    [prefix + "baz"]: "world",
    [Symbol.something]: "I'm a symbol-keyed property"
};
console.log(myObject["foobar"], myObject["foobaz"], myObject[Symbol.something]);


//// Arrays
var myArray = [ "foo", 42, "bar" ];
myArray.baz = "Arrays are full-fledged objects, so I can add named properties on an array, although this is not recommended.";
console.log("My array has length %d. Some values: %s %s.", myArray.length, myArray[0], myArray[2]);
console.log(myArray.baz);
myArray["4"] = "baz";
console.log("oops, \"4\" was coerced to 4, so we ended up with an array of length %d (item at position 3 was added, too, and is %s)", myArray.length, myArray[3]); // ... and is undefined)


//// Object copies
function anotherFunction() { /*..*/ }
var anotherObject = {
    c: true
};
var anotherArray = [];
var myObject = {
    a: 2,
    b: anotherObject,   // reference, not a copy!
    c: anotherArray,    // another reference!
    d: anotherFunction
};
anotherArray.push( anotherObject, myObject ); // circular reference!
console.log(myObject, myObject.c[0], myObject.c[1]);

// ECMAScript 6: Shallow object copy
var newObj = Object.assign( {}, myObject );
console.log("newObj has exactly references to the same objects as myObject: %s %s %s",
    newObj.b === anotherObject,
    newObj.c === anotherArray,
    newObj.d === anotherFunction); // we can also see here how to display data types for which there's no string substitution %: use %s and type coercion will do the rest


//// Property descriptors
var myObject = {
    a: 2,
    b: 7
};

myObject.a = 3;
console.log(" I changed a property that's by default writable: %d", myObject.a);

Object.defineProperty( myObject, "a", {
    value: myObject.a, // I can use it's previous value
    writable: false, // not writable
    configurable: false, // not configurable. This is a one-way road, you cannot revert it!
    enumerable: true // whether it appears in for ... in loops and other enumerations
} ); // This property also happens to be an object CONSTANT (non-writable, non-configurable)

myObject.a = 5; // useless, no change will be perfomed
console.log(" I changed a property that's NOT writable anymore: %d", myObject.a);
// Object.defineProperty( myObject, "a", {value: 6, writable: true, configurable: true, enumerable: true} ); // TypeError, can't configure a non-configurable property


//// "delete" operator: it attempts to delete a property on an object. IF that was the last reference to that object, the object might actually be garbage collected. BUT there's NO resembling of C++'s delete operator
delete myObject.a; // a non configurable property cannot be deleted
console.log(" I deleted a property that's not configurable: %d", myObject.a);


//// Immutability

myObject = {
    a: 8,
    b: 9
};

Object.preventExtensions(myObject); // Immutability Level 1: Prevent adding new properties
// Note that I cannot say myObject.preventExtensions() because this method is part of Object, not of Object.prototype. If it were the latter case, then I could call it via myObject, because delegation would look it up and find it in myObject's prototype, which is Object.prototype
myObject.a = 10;
myObject.c = 6;
console.log("I added a property on an object that prevents extensions: %s, I also modified an existing property: %d", myObject.c, myObject.a);

Object.seal(myObject); // Immutability Level 2: Level 1 + Prevent configuring its properties
myObject.a = 11;
console.log("I modified a property on a sealed object: %d", myObject.a);

// Object.defineProperty( myObject, "b", {value: 6, writable: true, configurable: true, enumerable: true} ); // TypeError: now b is not configurable because of the seal() call

Object.freeze(myObject); // Immutability Level 3: Level 2 + Prevent modifying its properties
myObject.b = 12;
console.log("I modified a property on a frozen object: %d", myObject.b);


//// [[Get]] and [[Set]]
/*
These are two built-in operations that are used whenever accessing object properties.
[[Get]] returns the property that was requested to be accesed on the object with this algorithm:
- If a property with this name is found on the current object, it is returned
- Else, if a property with this name is found in the prototype chain, it is returned
- Else, it returns undefined
[[Set]] attempts to save the requested property on the given object, with the following algorithm:
- If a setter with the same name is found on this object, call it
- Else, if a non-writable property with the same name is found on this object, then adding it on this object is disallowed (silently in normal mode, with error in strict mode)
- Else, if a writable property with the same name is found in the prototype chain, it is added on this object, shadowing the existing one
- Else, if a non-writable property with the same name is found in the prototype chain, then adding it on this object is disallowed (silently in normal mode, with error in strict mode)
- Else, if a setter is found in the prototype chain, it is called
- Else (no property with the same name is found, anywhere) it is added to the current object
The first three rules refer to this object, the last three ones refer to its prototype chain.
*/

var someObj = {
    a: undefined // undefined doesn't necessarily mean that the property does not exist
};
console.log("Distinguishing between undefined property or property explicitly set to undefined requires a method call: a is %s, b is %s, a is%s own property, b is%s own property",
    someObj.a, // undefined by authoring
    someObj.b, // undefined as returned from the [[Get]] operation
    someObj.hasOwnProperty("a") ? "" : " not", // Object.prototype.hasOwnProperty()
    Object.prototype.hasOwnProperty.call(someObj, "b") ? "" : " not"); // another way of calling hasOwnProperty (useful for objects that don't have a prototype, or whose prototype does not go back to Object)


//// Getters and Setters

var x = {
    get a() { // getter defined in the literal notation
        return this._a; // use "this" to make sure its bound to this object rather than a global variable
    },
    set a(v) {
        this._a = v;
    }
}

Object.defineProperty(x, "b", {
    get: function() { // getter defined via defineProperty()
        return 7;
    },
    enumerable: true // otherwise it won't appear in the Enumeration for ... in below
});

x.a = 8; // calls a's setter
console.log(x.a, x.b); // calls the getters for a and b


//// Enumeration
for (var k in x) { // using keys
    console.log("x[%s]=%s", k, x[k]);
}

//// ECMAScript 6: iteration
var arr = [1, 2, 3, 4];
var it = arr[Symbol.iterator](); // iterator is a function defined on Arrays, accessible via Symbol.iterator
console.log("array iterator returns", it.next(), it.next(), it.next(), it.next(), it.next());

Object.defineProperty( x, Symbol.iterator, {
    enumerable: false,
    writable: false,
    configurable: true,
    value: function() {
        var o = this;
        var idx = 0;
        var ks = Object.keys( o );
        return {
            next: function() {
                return {
                    value: o[ks[idx++]],
                    done: (idx > ks.length)
                };
            }
        };
    }
} );

for (var v of x) { // ECMAScript 6: call the iterator automatically via for ... of (equivalent to var it = x[Symbol.iterator]; it.next() ...)
    console.log("x property value", v);
}


/*****************************************************************
 * 
 * Prototypes
 * 
 *****************************************************************/

/*
From the ECMAScript 6 specification: "All ordinary objects have an internal slot called [[Prototype]]. The value of this internal slot is either null or an object and is used for implementing inheritance. Data properties of the [[Prototype]] object are inherited (are visible as properties of the child object) for the purposes of get access, but not for set access. Accessor properties are inherited for both get access and set access." Actually inheritance may be a wrong word here, as there's no class to inherit from. It's just that [[Prototype]] is a reference to another object, whose properties are accessible via the current object by means of the internal [[Get]] and [[Set]] operations.
*/

var anotherObject = {
    a: 2,
    b: "hi",
    f: function() {
        console.log("a is %d, b is %s", this.a, this.b);
    }
};

var myObject = Object.create( anotherObject ); // anotherObject is the prototype of myObject. myObject's [[Prototype]] now points to anotherObject
console.log("Property from the prototype chain", anotherObject.a, myObject.a, anotherObject.hasOwnProperty( "a"), myObject.hasOwnProperty("a"));
myObject.f(); // call function from the prototype. Note that "this" is bound to myObject, and that the properties a, b, f are actually part of anotherObject. The internal [[Get]] operation resolves them by inspecting the prototype chain

myObject.a++; // oops, implicit shadowing! This translates to myObject.a = myObject.a + 1, which, by the rules described at the [[Put]] operation, shadows anotherObject.a, setting it's value to anotherObject.a + 1

console.log("implicit shadowing: %d %d %s", anotherObject.a, myObject.a, myObject.hasOwnProperty("a"));

console.log("accesing an object's prototype:", Object.getPrototypeOf(myObject));


//// Constructor
// All functions, being objects, have their [[Prototype]]. Function's prototype are accessible via the "prototype" property.
// From ECMAScript 6 Spec: "Unless otherwise specified every built-in function object has the %FunctionPrototype% object (19.2.3) as the initial value of its [[Prototype]] internal slot. The value of Function.prototype is %FunctionPrototype%, the intrinsic Function prototype object (19.2.3)."
function Foo() {
    // ...
}
var a = new Foo();
console.log("prototype's constructor %s, constructed object's constructor %s prototype %s, instance of %s", Foo.prototype.constructor === Foo, a.constructor === Foo, Object.isProto, a instanceof Foo);
// instanceof answers the following question: in the entire [[Prototype]] chain of a, does the object arbitrarily pointed to by Foo.prototype ever appear?

Foo.prototype = {};
a = new Foo(); // oops, now a's "constructor" is no longer Foo's prototype's constructor, but Object's prototype's constructor
console.log("prototype's constructor %s, constructed object's constructor %s, Object's prototype constructor %s", Foo.prototype.constructor === Foo, a.constructor === Foo, a.constructor === Object.prototype.constructor);
// What happened? a.constructor resolves in a's prototype chain. It resolves to a.prototype.constructor, which in the first case is Foo.prototype.constructor, but in the second case we overrriden Foo.prototype to an empty object, meaning that now Foo.prototype no longer has a "constructor" property, so a.constructor [[Get]] operation goes further in the chain, ending at Object.prototype, which DOES have a "constructor" property.


/*****************************************************************
 * 
 * Behavior Delegation vs "class" with "pseudo-polymorfism" vs ECMAScript 6 class
 * 
 *****************************************************************/

// Demo: Implement a general Widget and a specific Button with all three mechanisms
// Use jQuery for DOM and CSS manipulation

//// Get jQuery into our DOM and wait for it to be loaded
function jQueryLoader(handler) {
    var jqScriptElem = document.createElement("script");
    jqScriptElem.setAttribute("lang", "javascript");
    jqScriptElem.setAttribute("src", "node_modules/jquery/dist/jquery.js");
    document.getElementsByTagName("head")[0].appendChild(jqScriptElem);

    var count = 0;
    function waitForJQLoading(f) {
        if (++count > 9) {
            console.log("jQuery did not load in %d seconds", count);
            return;
        }
        if (typeof jQuery == "undefined") { // What we are doing here? If we would check for undefined without quotes, it will only catch the situation when jQuery is NOT DECLARED. But if jQuery is declared (I don't know how would that happen) and undefined, typeof would return "undefined". When the variable is declared, typeof always returns a string. Now, the test we have catches all situations because of type coercion: if jQuery is declared but is undefined, typeof returns "undefined". If jQuery is not declared, typeof returns undefined, which will be coerced to string "undefined"...
            setTimeout(waitForJQLoading, 1000);
            return;
        }
        handler();
    }
    setTimeout(waitForJQLoading, 1000);
}

function whenJQueryIsReady() {
    
    // Because we need to wait for jQuery to load, all our code is called async, so wrap it up in a function called below via jQueryLoader
    
    // jQuery loaded, say a green bold hi
    $("body").append($("<p>").text("Hi there from jQuery").css("font-weight", "bold").css("color", "darkgreen"));


    //// 1. Widget and Button with classic JS "class"

    (function classicJSClass() {
        function Widget(width, height) {
            this.width = width || 50;
            this.height = height || 50;
            this.$elem = null; // our jQuery HTML element that will represent the widget
        }
        
        // base class render function: put our element where specified and apply its properties
        Widget.prototype.render = function($where) { // prefixed "where" with $ so that I know this function expects a jQuery element
            this.$elem.css({
                width: this.width + "px",
                height: this.height + "px"
            }).appendTo($where);
        }
        
        function Button(width, height, label) {
            Widget.call(this, width, height);
            this.label = label;
            this.$elem = $("<button>").text(label);
            this.$elem.bind("click", Button.prototype.onClick.bind(this)); // YKDJS has this line in Button.prototype.render(), but I'm not sure this is "rendering". In the OOLO version (Objects Linked-to Other Objects, as oppsed to Object Oriented) I moved this to the equivalent of "render", as it seems to fit better there
        }
        
        // inherit from the Widget class
        Button.prototype = Object.create(Widget.prototype);
        
        // derived class render function: call base class version
        Button.prototype.render = function($where) {
            this.$elem.css({
                "font-size": "11pt"
            })
            Widget.prototype.render.call(this, $where);
        }
        
        Button.prototype.onClick = function() {
            alert("I'm a button created using a classic JS 'class' approach: " + this.label);
        }

        var b1 = new Button(150, 30, "Classic JS Class");
        b1.render($("body"));
    })();
    
    
    //// 2. Widget and Button with ECMAScript 6 class syntax
    
    (function ECMAScript6Class() {
        class Widget {
            constructor(width, height) { // equivalent of function Widget from above
                this.width = width || 50;
                this.height = height || 50;
                this.$elem = null; // our jQuery HTML element that will represent the widget            
            }
            
            render($where) {
                this.$elem.css({
                    width: this.width + "px",
                    height: this.height + "px"
                }).appendTo($where);
            }
        }
        
        class Button extends Widget {
            constructor(width, height, label) {
                super(width, height);
                this.label = label;
                this.$elem = $("<button>").text(label);
                this.$elem.bind("click", this.onClick.bind(this)); // YKDJS has this line in Button.prototype.render(), but I'm not sure this is "rendering". In the OOLO version (Objects Linked-to Other Objects, as oppsed to Object Oriented) I moved this to the equivalent of "render", as it seems to fit better there
            }
        
            render($where) {
                this.$elem.css({
                    "font-size": "11pt"
                })
                Widget.prototype.render.call(this, $where);
            }
            
            onClick() {
                alert("I'm a button created using ECMAScript 6 classes: " + this.label);
            }
        }
 
        var b1 = new Button(180, 30, "ECMAScript 6 Class");
        b1.render($("body"));
    })();
    
    
    //// 3. Widget and Button with Behavior Delegation
    
    (function behaviorDelegation() {
        var Widget = { // Widget is just an object with a couple of functions and data. We could have created it with Object.create() for consistency with the way we create Button below
            init: function (width, height) {
                this.width = width || 50;
                this.height = height || 50;
                this.$elem = null; // our jQuery HTML element that will represent the widget            
            },
            placeAndStyle: function($where) {
                 this.$elem.css({
                    width: this.width + "px",
                    height: this.height + "px"
                }).appendTo($where);
           }
        };
        
        var Button = Object.create(Widget); // Button has Widget as its [[Prototype]], so now it can call to Widget functions directly
        Button.setup = function(width, height, label) {
            this.init(width, height);
            this.label = label;
            this.$elem = $("<button>").text(label);
        }
        Button.build = function($where) {
            this.$elem.css({
                "font-size": "11pt"
            })
            this.$elem.bind("click", this.onClick.bind(this));
            this.placeAndStyle($where);
        }
        Button.onClick = function() {
            alert("I'm a button created using ECMAScript 6 classes: " + this.label);
        }
        
        var b1 = Object.create(Button); // b1 has Button as its [[Prototype]], so now it can call Widget and Button functions directly
        b1.setup(180, 30, "Behavior Delegation");
        b1.build($("body"));
    })();

}

jQueryLoader(whenJQueryIsReady);


//// ECMAScript 6 nicer syntax for object functions - has drawbacks, too

var some = {
    doStuff(a) {
        if (a > 4) {
            return a;
        }
        doStuff(a + 1); // oops, the Engine doesn't know who's doStuff(). See commented console.log() below
    }
};
//console.log("recursive calling using ES6 nicer syntax:", some.doStuff(1)); // ReferenceError: doStuff is not defined. Why? Because the ES6 "nicer" syntax doStuff(a) {} actually resolves to doStuff: function() {}, so its an anonymous function, you cannot call it. In this case it is fixed by saying some.doStuff(a + 1); in the function recursive call, but in some other cases it might not be that simple.


/*****************************************************************
 * 
 * Types & Grammar
 * 
 *****************************************************************/

function showTypeof(x) {
    console.log("typeof", x, "is", typeof x);
}

showTypeof(42);
showTypeof("42");
showTypeof(true);
showTypeof(undefined);
showTypeof({a: 2});
showTypeof(null); // surprise: "object", due to an old JS bug that wasn't fixed long enough so that a lot of code depends on it
showTypeof(Symbol()); // "symbol", new ECMAScript 6 type
showTypeof(function() {}); // "function", although a function is an object

console.log(function(a, b) {}.length); // 2; a function has a length property specifying the number of parameters it accepts

// In JavaScript, types are associated with VALUES, not VARIABLES
var showMyType;  showTypeof(showMyType); // it has no value - but this actually means it has the "undefined" value
showMyType = 42;   showTypeof(showMyType); // number
showMyType = "ab";  showTypeof(showMyType); // string

// console.log(someUndeclaredVariable); // ReferenceError. Although the message might be confusing, actually this means the variable is "undeclared", as opposed to being declared and "undefined"

// We can however use typeof to verify if a variable or function is declared or not. This behavior exists in order to allow checking for existence of variables in the code.
console.log(typeof someUndeclaredVariable); // suprise: "undefined"

// undefined cannot be compared with boolean (coercion allowed), but testing it for trueness (or falseness) is allowed and works fine
console.log("'undefined' coerces to 'boolean': %s %s; but applying ! (not) on it gives us %s", undefined == true, undefined == false, !undefined);

console.log("window.DEBUG", window.DEBUG); // undefined
// an undefined value can be tested for trueness or falseness
if (!window.DEBUG) {
    console.log("window.DEBUG is undefined, which we saw earlier that is not equal to either true or false, but still the code got here");
}

// Wrapper objects for primitive types are just that - wrapper objects. The VALUE is still the immutable primitive, so trying to wrap the number in a Number() to allow changing it fails:
function changeSome(x) {
    x = x + 1; // if x is a Number(), what happens here is a de-wrapping: the primitive value is incremented and reassigned-back. This doesn't modify the original variable, which is still passed by VALUE
    console.log("I changed x to", x); // 3
}
var a = 2;
var b = new Number( a ); // or equivalently `Object(a)`
changeSome( b );
console.log("Did I change b?", b == 3); // 2, not 3


//// the || and && operators are not logical ones, but selectors - they select one of their values (much like "or" in Perl)

var c = "a";

var d1 = a && b && c;
console.log("&& selects operands, in this case it selected c:", d1);
var d2 = Boolean(a && b && c);
console.log("to get a similar behavior as in C, we need to wrap the expression in Boolean():", d2);
