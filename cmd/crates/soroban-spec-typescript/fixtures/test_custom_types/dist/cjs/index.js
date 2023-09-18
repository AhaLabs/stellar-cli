"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = exports.RoyalCard = exports.networks = exports.Err = exports.Ok = exports.Address = void 0;
const soroban_client_1 = require("soroban-client");
Object.defineProperty(exports, "Address", { enumerable: true, get: function () { return soroban_client_1.Address; } });
const buffer_1 = require("buffer");
const invoke_js_1 = require("./invoke.js");
__exportStar(require("./invoke.js"), exports);
__exportStar(require("./method-options.js"), exports);
;
;
class Ok {
    constructor(value) {
        this.value = value;
    }
    unwrapErr() {
        throw new Error('No error');
    }
    unwrap() {
        return this.value;
    }
    isOk() {
        return true;
    }
    isErr() {
        return !this.isOk();
    }
}
exports.Ok = Ok;
class Err {
    constructor(error) {
        this.error = error;
    }
    unwrapErr() {
        return this.error;
    }
    unwrap() {
        throw new Error(this.error.message);
    }
    isOk() {
        return false;
    }
    isErr() {
        return !this.isOk();
    }
}
exports.Err = Err;
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || buffer_1.Buffer;
}
const regex = /Error\(Contract, #(\d+)\)/;
function parseError(message) {
    const match = message.match(regex);
    if (!match) {
        return undefined;
    }
    if (Errors === undefined) {
        return undefined;
    }
    let i = parseInt(match[1], 10);
    let err = Errors[i];
    if (err) {
        return new Err(err);
    }
    return undefined;
}
exports.networks = {
    futurenet: {
        networkPassphrase: "Test SDF Future Network ; October 2022",
        contractId: "CBYMYMSDF6FBDNCFJCRC7KMO4REYFPOH2U4N7FXI3GJO6YXNCQ43CDSK",
    }
};
var RoyalCard;
(function (RoyalCard) {
    RoyalCard[RoyalCard["Jack"] = 11] = "Jack";
    RoyalCard[RoyalCard["Queen"] = 12] = "Queen";
    RoyalCard[RoyalCard["King"] = 13] = "King";
<<<<<<< HEAD
})(RoyalCard || (exports.RoyalCard = RoyalCard = {}));
=======
})(RoyalCard = exports.RoyalCard || (exports.RoyalCard = {}));
>>>>>>> main
const Errors = {
    1: { message: "Please provide an odd number" }
};
class Contract {
<<<<<<< HEAD
    options;
    spec;
=======
>>>>>>> main
    constructor(options) {
        this.options = options;
        this.spec = new soroban_client_1.ContractSpec([
            "AAAAAQAAAC9UaGlzIGlzIGZyb20gdGhlIHJ1c3QgZG9jIGFib3ZlIHRoZSBzdHJ1Y3QgVGVzdAAAAAAAAAAABFRlc3QAAAADAAAAAAAAAAFhAAAAAAAABAAAAAAAAAABYgAAAAAAAAEAAAAAAAAAAWMAAAAAAAAR",
            "AAAAAgAAAAAAAAAAAAAAClNpbXBsZUVudW0AAAAAAAMAAAAAAAAAAAAAAAVGaXJzdAAAAAAAAAAAAAAAAAAABlNlY29uZAAAAAAAAAAAAAAAAAAFVGhpcmQAAAA=",
            "AAAAAwAAAAAAAAAAAAAACVJveWFsQ2FyZAAAAAAAAAMAAAAAAAAABEphY2sAAAALAAAAAAAAAAVRdWVlbgAAAAAAAAwAAAAAAAAABEtpbmcAAAAN",
            "AAAAAQAAAAAAAAAAAAAAC1R1cGxlU3RydWN0AAAAAAIAAAAAAAAAATAAAAAAAAfQAAAABFRlc3QAAAAAAAAAATEAAAAAAAfQAAAAClNpbXBsZUVudW0AAA==",
            "AAAAAgAAAAAAAAAAAAAAC0NvbXBsZXhFbnVtAAAAAAUAAAABAAAAAAAAAAZTdHJ1Y3QAAAAAAAEAAAfQAAAABFRlc3QAAAABAAAAAAAAAAVUdXBsZQAAAAAAAAEAAAfQAAAAC1R1cGxlU3RydWN0AAAAAAEAAAAAAAAABEVudW0AAAABAAAH0AAAAApTaW1wbGVFbnVtAAAAAAABAAAAAAAAAAVBc3NldAAAAAAAAAIAAAATAAAACwAAAAAAAAAAAAAABFZvaWQ=",
            "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAQAAABxQbGVhc2UgcHJvdmlkZSBhbiBvZGQgbnVtYmVyAAAAD051bWJlck11c3RCZU9kZAAAAAAB",
            "AAAAAAAAAAAAAAAFaGVsbG8AAAAAAAABAAAAAAAAAAVoZWxsbwAAAAAAABEAAAABAAAAEQ==",
            "AAAAAAAAAAAAAAAEd29pZAAAAAAAAAAA",
            "AAAAAAAAAAAAAAADdmFsAAAAAAAAAAABAAAAAA==",
            "AAAAAAAAAAAAAAAQdTMyX2ZhaWxfb25fZXZlbgAAAAEAAAAAAAAABHUzMl8AAAAEAAAAAQAAA+kAAAAEAAAAAw==",
            "AAAAAAAAAAAAAAAEdTMyXwAAAAEAAAAAAAAABHUzMl8AAAAEAAAAAQAAAAQ=",
            "AAAAAAAAAAAAAAAEaTMyXwAAAAEAAAAAAAAABGkzMl8AAAAFAAAAAQAAAAU=",
            "AAAAAAAAAAAAAAAEaTY0XwAAAAEAAAAAAAAABGk2NF8AAAAHAAAAAQAAAAc=",
            "AAAAAAAAACxFeGFtcGxlIGNvbnRyYWN0IG1ldGhvZCB3aGljaCB0YWtlcyBhIHN0cnVjdAAAAApzdHJ1a3RfaGVsAAAAAAABAAAAAAAAAAZzdHJ1a3QAAAAAB9AAAAAEVGVzdAAAAAEAAAPqAAAAEQ==",
            "AAAAAAAAAAAAAAAGc3RydWt0AAAAAAABAAAAAAAAAAZzdHJ1a3QAAAAAB9AAAAAEVGVzdAAAAAEAAAfQAAAABFRlc3Q=",
            "AAAAAAAAAAAAAAAGc2ltcGxlAAAAAAABAAAAAAAAAAZzaW1wbGUAAAAAB9AAAAAKU2ltcGxlRW51bQAAAAAAAQAAB9AAAAAKU2ltcGxlRW51bQAA",
            "AAAAAAAAAAAAAAAHY29tcGxleAAAAAABAAAAAAAAAAdjb21wbGV4AAAAB9AAAAALQ29tcGxleEVudW0AAAAAAQAAB9AAAAALQ29tcGxleEVudW0A",
            "AAAAAAAAAAAAAAAIYWRkcmVzc2UAAAABAAAAAAAAAAhhZGRyZXNzZQAAABMAAAABAAAAEw==",
            "AAAAAAAAAAAAAAAFYnl0ZXMAAAAAAAABAAAAAAAAAAVieXRlcwAAAAAAAA4AAAABAAAADg==",
            "AAAAAAAAAAAAAAAHYnl0ZXNfbgAAAAABAAAAAAAAAAdieXRlc19uAAAAA+4AAAAJAAAAAQAAA+4AAAAJ",
            "AAAAAAAAAAAAAAAEY2FyZAAAAAEAAAAAAAAABGNhcmQAAAfQAAAACVJveWFsQ2FyZAAAAAAAAAEAAAfQAAAACVJveWFsQ2FyZAAAAA==",
            "AAAAAAAAAAAAAAAHYm9vbGVhbgAAAAABAAAAAAAAAAdib29sZWFuAAAAAAEAAAABAAAAAQ==",
            "AAAAAAAAABdOZWdhdGVzIGEgYm9vbGVhbiB2YWx1ZQAAAAADbm90AAAAAAEAAAAAAAAAB2Jvb2xlYW4AAAAAAQAAAAEAAAAB",
            "AAAAAAAAAAAAAAAEaTEyOAAAAAEAAAAAAAAABGkxMjgAAAALAAAAAQAAAAs=",
            "AAAAAAAAAAAAAAAEdTEyOAAAAAEAAAAAAAAABHUxMjgAAAAKAAAAAQAAAAo=",
            "AAAAAAAAAAAAAAAKbXVsdGlfYXJncwAAAAAAAgAAAAAAAAABYQAAAAAAAAQAAAAAAAAAAWIAAAAAAAABAAAAAQAAAAQ=",
            "AAAAAAAAAAAAAAADbWFwAAAAAAEAAAAAAAAAA21hcAAAAAPsAAAABAAAAAEAAAABAAAD7AAAAAQAAAAB",
            "AAAAAAAAAAAAAAADdmVjAAAAAAEAAAAAAAAAA3ZlYwAAAAPqAAAABAAAAAEAAAPqAAAABA==",
            "AAAAAAAAAAAAAAAFdHVwbGUAAAAAAAABAAAAAAAAAAV0dXBsZQAAAAAAA+0AAAACAAAAEQAAAAQAAAABAAAD7QAAAAIAAAARAAAABA==",
            "AAAAAAAAAB9FeGFtcGxlIG9mIGFuIG9wdGlvbmFsIGFyZ3VtZW50AAAAAAZvcHRpb24AAAAAAAEAAAAAAAAABm9wdGlvbgAAAAAD6AAAAAQAAAABAAAD6AAAAAQ=",
            "AAAAAAAAAAAAAAAEdTI1NgAAAAEAAAAAAAAABHUyNTYAAAAMAAAAAQAAAAw=",
            "AAAAAAAAAAAAAAAEaTI1NgAAAAEAAAAAAAAABGkyNTYAAAANAAAAAQAAAA0=",
            "AAAAAAAAAAAAAAAGc3RyaW5nAAAAAAABAAAAAAAAAAZzdHJpbmcAAAAAABAAAAABAAAAEA==",
            "AAAAAAAAAAAAAAAMdHVwbGVfc3RydWt0AAAAAQAAAAAAAAAMdHVwbGVfc3RydWt0AAAH0AAAAAtUdXBsZVN0cnVjdAAAAAABAAAH0AAAAAtUdXBsZVN0cnVjdAA="
        ]);
    }
<<<<<<< HEAD
    hello = async ({ hello }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    async hello({ hello }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'hello',
            args: this.spec.funcArgsToScVals("hello", { hello }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("hello", xdr);
            },
        });
<<<<<<< HEAD
    };
    woid = async (options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async woid(options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'woid',
            args: this.spec.funcArgsToScVals("woid", {}),
            ...options,
            ...this.options,
            parseResultXdr: () => { },
        });
<<<<<<< HEAD
    };
    val = async (options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async val(options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'val',
            args: this.spec.funcArgsToScVals("val", {}),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("val", xdr);
            },
        });
<<<<<<< HEAD
    };
    u32FailOnEven = async ({ u32_ }, options = {}) => {
        try {
            return await (0, invoke_js_1.invoke)({
=======
    }
    async u32FailOnEven({ u32_ }, options = {}) {
        try {
            return await invoke_js_1.invoke({
>>>>>>> main
                method: 'u32_fail_on_even',
                args: this.spec.funcArgsToScVals("u32_fail_on_even", { u32_ }),
                ...options,
                ...this.options,
                parseResultXdr: (xdr) => {
                    return new Ok(this.spec.funcResToNative("u32_fail_on_even", xdr));
                },
            });
        }
        catch (e) {
            if (typeof e === 'string') {
                let err = parseError(e);
                if (err)
                    return err;
            }
            throw e;
        }
<<<<<<< HEAD
    };
    u32 = async ({ u32_ }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async u32({ u32_ }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'u32_',
            args: this.spec.funcArgsToScVals("u32_", { u32_ }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("u32_", xdr);
            },
        });
<<<<<<< HEAD
    };
    i32 = async ({ i32_ }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async i32({ i32_ }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'i32_',
            args: this.spec.funcArgsToScVals("i32_", { i32_ }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("i32_", xdr);
            },
        });
<<<<<<< HEAD
    };
    i64 = async ({ i64_ }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async i64({ i64_ }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'i64_',
            args: this.spec.funcArgsToScVals("i64_", { i64_ }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("i64_", xdr);
            },
        });
<<<<<<< HEAD
    };
    /**
     * Example contract method which takes a struct
     */
    struktHel = async ({ strukt }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    /**
 * Example contract method which takes a struct
 */
    async struktHel({ strukt }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'strukt_hel',
            args: this.spec.funcArgsToScVals("strukt_hel", { strukt }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("strukt_hel", xdr);
            },
        });
<<<<<<< HEAD
    };
    strukt = async ({ strukt }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async strukt({ strukt }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'strukt',
            args: this.spec.funcArgsToScVals("strukt", { strukt }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("strukt", xdr);
            },
        });
<<<<<<< HEAD
    };
    simple = async ({ simple }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async simple({ simple }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'simple',
            args: this.spec.funcArgsToScVals("simple", { simple }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("simple", xdr);
            },
        });
<<<<<<< HEAD
    };
    complex = async ({ complex }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async complex({ complex }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'complex',
            args: this.spec.funcArgsToScVals("complex", { complex }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("complex", xdr);
            },
        });
<<<<<<< HEAD
    };
    addresse = async ({ addresse }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async addresse({ addresse }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'addresse',
            args: this.spec.funcArgsToScVals("addresse", { addresse }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("addresse", xdr);
            },
        });
<<<<<<< HEAD
    };
    bytes = async ({ bytes }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async bytes({ bytes }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'bytes',
            args: this.spec.funcArgsToScVals("bytes", { bytes }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("bytes", xdr);
            },
        });
<<<<<<< HEAD
    };
    bytesN = async ({ bytes_n }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async bytesN({ bytes_n }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'bytes_n',
            args: this.spec.funcArgsToScVals("bytes_n", { bytes_n }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("bytes_n", xdr);
            },
        });
<<<<<<< HEAD
    };
    card = async ({ card }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async card({ card }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'card',
            args: this.spec.funcArgsToScVals("card", { card }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("card", xdr);
            },
        });
<<<<<<< HEAD
    };
    boolean = async ({ boolean }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async boolean({ boolean }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'boolean',
            args: this.spec.funcArgsToScVals("boolean", { boolean }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("boolean", xdr);
            },
        });
<<<<<<< HEAD
    };
    /**
     * Negates a boolean value
     */
    not = async ({ boolean }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    /**
 * Negates a boolean value
 */
    async not({ boolean }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'not',
            args: this.spec.funcArgsToScVals("not", { boolean }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("not", xdr);
            },
        });
<<<<<<< HEAD
    };
    i128 = async ({ i128 }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async i128({ i128 }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'i128',
            args: this.spec.funcArgsToScVals("i128", { i128 }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("i128", xdr);
            },
        });
<<<<<<< HEAD
    };
    u128 = async ({ u128 }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async u128({ u128 }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'u128',
            args: this.spec.funcArgsToScVals("u128", { u128 }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("u128", xdr);
            },
        });
<<<<<<< HEAD
    };
    multiArgs = async ({ a, b }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async multiArgs({ a, b }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'multi_args',
            args: this.spec.funcArgsToScVals("multi_args", { a, b }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("multi_args", xdr);
            },
        });
<<<<<<< HEAD
    };
    map = async ({ map }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async map({ map }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'map',
            args: this.spec.funcArgsToScVals("map", { map }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("map", xdr);
            },
        });
<<<<<<< HEAD
    };
    vec = async ({ vec }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async vec({ vec }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'vec',
            args: this.spec.funcArgsToScVals("vec", { vec }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("vec", xdr);
            },
        });
<<<<<<< HEAD
    };
    tuple = async ({ tuple }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async tuple({ tuple }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'tuple',
            args: this.spec.funcArgsToScVals("tuple", { tuple }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("tuple", xdr);
            },
        });
<<<<<<< HEAD
    };
    /**
     * Example of an optional argument
     */
    option = async ({ option }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    /**
 * Example of an optional argument
 */
    async option({ option }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'option',
            args: this.spec.funcArgsToScVals("option", { option }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("option", xdr);
            },
        });
<<<<<<< HEAD
    };
    u256 = async ({ u256 }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async u256({ u256 }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'u256',
            args: this.spec.funcArgsToScVals("u256", { u256 }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("u256", xdr);
            },
        });
<<<<<<< HEAD
    };
    i256 = async ({ i256 }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async i256({ i256 }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'i256',
            args: this.spec.funcArgsToScVals("i256", { i256 }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("i256", xdr);
            },
        });
<<<<<<< HEAD
    };
    string = async ({ string }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async string({ string }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'string',
            args: this.spec.funcArgsToScVals("string", { string }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("string", xdr);
            },
        });
<<<<<<< HEAD
    };
    tupleStrukt = async ({ tuple_strukt }, options = {}) => {
        return await (0, invoke_js_1.invoke)({
=======
    }
    async tupleStrukt({ tuple_strukt }, options = {}) {
        return await invoke_js_1.invoke({
>>>>>>> main
            method: 'tuple_strukt',
            args: this.spec.funcArgsToScVals("tuple_strukt", { tuple_strukt }),
            ...options,
            ...this.options,
            parseResultXdr: (xdr) => {
                return this.spec.funcResToNative("tuple_strukt", xdr);
            },
        });
<<<<<<< HEAD
    };
=======
    }
>>>>>>> main
}
exports.Contract = Contract;
