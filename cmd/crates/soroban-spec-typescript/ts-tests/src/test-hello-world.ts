import test from "ava";
import { root, wallet, rpcUrl } from "./util.js";
import { Contract, networks } from "test-hello-world";

const contract = new Contract({ ...networks.standalone, rpcUrl, wallet });

test("hello", async (t) => {
  t.deepEqual((await contract.hello({ world: "tests" })).result, ["Hello", "tests"]);
});

// Currently must run tests in serial because nonce logic not smart enough to handle concurrent calls.
test.serial("auth", async (t) => {
  t.deepEqual(
    (await contract.auth({
      addr: root.keypair.publicKey(),
      world: 'lol'
    })).result,
    root.address
  )
});

test.serial("inc", async (t) => {
  const { result: startingBalance } = await contract.getCount()
  t.is((await contract.inc({})).result, startingBalance + 1)
  t.is((await contract.getCount()).result, startingBalance + 1)
});
