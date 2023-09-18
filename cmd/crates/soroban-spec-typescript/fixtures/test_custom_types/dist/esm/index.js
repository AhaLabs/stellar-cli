import { ContractSpec, Address } from 'soroban-client';
import { Buffer } from "buffer";
import { invoke } from './invoke.js';
export * from './invoke.js';
export * from './method-options.js';
export { Address };
;
;
export class Ok {
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
export class Err {
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
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
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
export const networks = {
    futurenet: {
        networkPassphrase: "Test SDF Future Network ; October 2022",
        contractId: "CBYMYMSDF6FBDNCFJCRC7KMO4REYFPOH2U4N7FXI3GJO6YXNCQ43CDSK",
    }
};
export var RoyalCard;
(function (RoyalCard) {
    RoyalCard[RoyalCard["Jack"] = 11] = "Jack";
    RoyalCard[RoyalCard["Queen"] = 12] = "Queen";
    RoyalCard[RoyalCard["King"] = 13] = "King";
})(RoyalCard || (RoyalCard = {}));
const Errors = {
    1: { message: "Please provide an odd number" }
};
export class Contract {
<<<<<<< HEAD
    options;
    spec;
=======
>>>>>>> main
    constructor(options) {
        this.options = options;
        this.spec = new ContractSpec([
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
=======
    async hello({ hello }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async woid(options = {}) {
>>>>>>> main
        return await invoke({
            method: 'woid',
            args: this.spec.funcArgsToScVals("woid", {}),
            ...options,
            ...this.options,
            parseResultXdr: () => { },
        });
<<<<<<< HEAD
    };
    val = async (options = {}) => {
=======
    }
    async val(options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async u32FailOnEven({ u32_ }, options = {}) {
>>>>>>> main
        try {
            return await invoke({
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
=======
    }
    async u32({ u32_ }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async i32({ i32_ }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async i64({ i64_ }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    /**
 * Example contract method which takes a struct
 */
    async struktHel({ strukt }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async strukt({ strukt }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async simple({ simple }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async complex({ complex }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async addresse({ addresse }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async bytes({ bytes }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async bytesN({ bytes_n }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async card({ card }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async boolean({ boolean }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    /**
 * Negates a boolean value
 */
    async not({ boolean }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async i128({ i128 }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async u128({ u128 }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async multiArgs({ a, b }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async map({ map }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async vec({ vec }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async tuple({ tuple }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    /**
 * Example of an optional argument
 */
    async option({ option }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async u256({ u256 }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async i256({ i256 }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async string({ string }, options = {}) {
>>>>>>> main
        return await invoke({
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
=======
    }
    async tupleStrukt({ tuple_strukt }, options = {}) {
>>>>>>> main
        return await invoke({
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
