//! Signing authorization entries whose credential address is an OpenZeppelin
//! `stellar-accounts` smart account.
//!
//! A smart account's `require_auth()` is satisfied by its own `__check_auth`,
//! which expects an application-defined signature — `AuthPayload { signers,
//! context_rule_ids }` selecting a context rule and naming each signer as
//! `External(verifier, key)` or `Delegated(addr)` — over a rule-id-bound digest.
//! For a CAP-71 `Delegated` signer the entry is rebuilt as
//! `AddressWithDelegates`, where the delegate's classic account signature covers
//! the `SorobanAuthorizationWithAddress` preimage. The stock signer cannot build
//! either shape (it emits the host builtin account signature for `G…` keys and
//! rejects `C…` credentials), so this module does it explicitly.
//!
//! The ScVal shapes are byte-compatible with the `stellar-accounts`
//! `#[contracttype]` encoding (`AuthPayload`, `Signer`) — the ordering of the
//! symbol-keyed maps is what `ScMap::sorted_from` guarantees.

use sha2::{Digest, Sha256};

use super::Signer;
use crate::utils::XDR_DEPTH_LIMIT;
use crate::xdr::{
    self, AccountId, Hash, HashIdPreimage, HashIdPreimageSorobanAuthorization,
    HashIdPreimageSorobanAuthorizationWithAddress, HostFunction, InvokeContractArgs,
    InvokeHostFunctionOp, Limits, Memo, MuxedAccount, Operation, OperationBody, Preconditions,
    PublicKey, ScAddress, ScBytes, ScMap, ScSymbol, ScVal, ScVec, SequenceNumber,
    SorobanAddressCredentials, SorobanAddressCredentialsWithDelegates, SorobanAuthorizationEntry,
    SorobanAuthorizedFunction, SorobanAuthorizedInvocation, SorobanCredentials,
    SorobanDelegateSignature, Transaction, TransactionEnvelope, TransactionExt,
    TransactionV1Envelope, Uint256, VecM, WriteXdr,
};

/// How the smart account's own credential signature is produced.
#[derive(Debug, Clone)]
pub enum SaMode {
    /// CAP-71 `Signer::Delegated`: the `--sign-with-key` G-account is the
    /// delegate; its classic signature over the WithAddress preimage
    /// authenticates the account, so no verifier contract is involved.
    Delegated,
    /// OZ `Signer::External(verifier, key)`: the key signs the rule-bound
    /// digest, checked on-chain by `verifier`.
    External { verifier: ScAddress },
}

/// A resolved request to sign a smart account's auth entry.
pub struct SmartAccountAuth {
    /// The smart-account contract (`C…`) whose auth entry this signs.
    pub account: ScAddress,
    /// The OZ context-rule id(s) this signature authorizes.
    pub rule_ids: Vec<u32>,
    pub mode: SaMode,
    /// The delegate (Delegated) or external (External) signing key.
    pub signer: Signer,
}

impl SmartAccountAuth {
    /// Sign `entry` in the configured mode, returning the rewritten entry.
    pub async fn sign(
        &self,
        entry: &SorobanAuthorizationEntry,
        signature_expiration_ledger: u32,
        network_id: &Hash,
    ) -> Result<SorobanAuthorizationEntry, super::Error> {
        match &self.mode {
            SaMode::Delegated => {
                sign_delegated(entry, self, signature_expiration_ledger, network_id).await
            }
            SaMode::External { verifier } => {
                sign_external(entry, self, verifier, signature_expiration_ledger, network_id).await
            }
        }
    }

    /// Discover the OZ context rule that authorizes `delegate` to act for smart
    /// account `account` on `invocation`, keyed only on (account, signing key).
    /// Reads the account's own `get_context_rules_count` / `get_context_rule`
    /// views over read-only simulation — the same path perch's `scan_rules`
    /// uses — matches by scope + signer, and returns the resolved signer with
    /// the delegate `Signer` moved onto it.
    pub async fn discover(
        client: &soroban_rpc::Client,
        account: ScAddress,
        invocation: &SorobanAuthorizedInvocation,
        delegate: Signer,
    ) -> Result<Self, super::Error> {
        let pubkey = delegate.get_public_key()?.0;
        let Some(target) = invocation_target(invocation) else {
            return Err(super::Error::SmartAccountRuleNotFound {
                account: account_strkey(&account),
            });
        };
        let count = match simulate_view(client, &account, "get_context_rules_count", vec![]).await? {
            Some(ScVal::U32(n)) => n,
            other => {
                return Err(super::Error::SmartAccountDiscovery {
                    func: "get_context_rules_count".to_string(),
                    reason: format!("unexpected result {other:?}"),
                })
            }
        };
        // Rule ids are sparse (apply_doc renumbers them), so probe a bounded id
        // space — the same ceiling perch's scan_rules uses — until we've seen
        // `count` rules, returning the first that authorizes our key.
        let ceiling = count.saturating_mul(8).saturating_add(64);
        let (mut seen, mut id) = (0u32, 0u32);
        while seen < count && id < ceiling {
            if let Some(ScVal::Map(Some(m))) =
                simulate_view(client, &account, "get_context_rule", vec![ScVal::U32(id)]).await?
            {
                seen += 1;
                if let Some(mode) = rule_matches(&m, &target, &pubkey) {
                    return Ok(SmartAccountAuth {
                        account,
                        rule_ids: vec![id],
                        mode,
                        signer: delegate,
                    });
                }
            }
            id += 1;
        }
        Err(super::Error::SmartAccountRuleNotFound {
            account: account_strkey(&account),
        })
    }
}

/// The contract a top-level `ContractFn` invocation targets — the scope a
/// `CallContract` rule must match. Non-`ContractFn` roots have no target.
fn invocation_target(inv: &SorobanAuthorizedInvocation) -> Option<ScAddress> {
    match &inv.function {
        SorobanAuthorizedFunction::ContractFn(a) => Some(a.contract_address.clone()),
        _ => None,
    }
}

fn account_strkey(a: &ScAddress) -> String {
    match a {
        ScAddress::Contract(crate::xdr::ContractId(Hash(c))) => {
            format!("{}", stellar_strkey::Strkey::Contract(stellar_strkey::Contract(*c)))
        }
        other => format!("{other:?}"),
    }
}

/// Look up a symbol-keyed field in a `#[contracttype]` struct's ScMap encoding.
fn map_get<'a>(m: &'a ScMap, key: &str) -> Option<&'a ScVal> {
    m.iter().find_map(|e| match &e.key {
        ScVal::Symbol(s) if s.to_utf8_string_lossy() == key => Some(&e.val),
        _ => None,
    })
}

/// A `ContextRuleType` ScVal (a tag-led vec) matches when it is `Default` or
/// `CallContract(target)`.
fn scope_matches(context_type: &ScVal, target: &ScAddress) -> bool {
    let ScVal::Vec(Some(ScVec(items))) = context_type else {
        return false;
    };
    let Some(ScVal::Symbol(tag)) = items.first() else {
        return false;
    };
    match tag.to_utf8_string_lossy().as_str() {
        "Default" => true,
        "CallContract" => matches!(items.get(1), Some(ScVal::Address(a)) if a == target),
        _ => false,
    }
}

/// Does this decoded `ContextRule` (an ScMap) authorize `pubkey` for `target`,
/// and in which mode? Matches iff the rule's scope is the target contract (or
/// `Default`) and its signer set contains our key — `Delegated(our G-address)`
/// or `External(verifier, our pubkey)`, carrying the verifier into the mode.
fn rule_matches(rule: &ScMap, target: &ScAddress, pubkey: &[u8; 32]) -> Option<SaMode> {
    if !scope_matches(map_get(rule, "context_type")?, target) {
        return None;
    }
    let ScVal::Vec(Some(ScVec(signers))) = map_get(rule, "signers")? else {
        return None;
    };
    let our_g = ScAddress::Account(AccountId(PublicKey::PublicKeyTypeEd25519(Uint256(*pubkey))));
    for s in signers.iter() {
        let ScVal::Vec(Some(ScVec(t))) = s else { continue };
        match (t.first(), t.get(1), t.get(2)) {
            (Some(ScVal::Symbol(k)), Some(ScVal::Address(a)), _)
                if k.to_utf8_string_lossy() == "Delegated" && a == &our_g =>
            {
                return Some(SaMode::Delegated)
            }
            (Some(ScVal::Symbol(k)), Some(ScVal::Address(v)), Some(ScVal::Bytes(key)))
                if k.to_utf8_string_lossy() == "External" && key.as_slice() == pubkey =>
            {
                return Some(SaMode::External { verifier: v.clone() })
            }
            _ => {}
        }
    }
    None
}

/// Read-only simulate `contract.func(args)`. `Ok(None)` when the call traps (a
/// sparse/absent rule id panics `ContextRuleNotFound`) or returns no result;
/// `Ok(Some(scval))` otherwise. Source is the all-zero G-account — a record-mode
/// simulation needs a well-formed envelope, not a funded account.
async fn simulate_view(
    client: &soroban_rpc::Client,
    contract: &ScAddress,
    func: &str,
    args: Vec<ScVal>,
) -> Result<Option<ScVal>, super::Error> {
    let op = Operation {
        source_account: None,
        body: OperationBody::InvokeHostFunction(InvokeHostFunctionOp {
            host_function: HostFunction::InvokeContract(InvokeContractArgs {
                contract_address: contract.clone(),
                function_name: ScSymbol(func.try_into()?),
                args: args.try_into()?,
            }),
            auth: VecM::default(),
        }),
    };
    let tx = Transaction {
        source_account: MuxedAccount::Ed25519(Uint256([0u8; 32])),
        fee: 100,
        seq_num: SequenceNumber(0),
        cond: Preconditions::None,
        memo: Memo::None,
        operations: vec![op].try_into()?,
        ext: TransactionExt::V0,
    };
    let env = TransactionEnvelope::Tx(TransactionV1Envelope {
        tx,
        signatures: VecM::default(),
    });
    let sim = client.simulate_transaction_envelope(&env, None).await?;
    if let Some(e) = sim.error {
        // A trapped read on a missing rule id is expected during the sparse scan.
        if e.contains("Error(Contract") {
            return Ok(None);
        }
        return Err(super::Error::SmartAccountDiscovery {
            func: func.to_string(),
            reason: e,
        });
    }
    Ok(sim.results()?.into_iter().next().map(|r| r.xdr))
}

fn sym(s: &str) -> Result<ScVal, xdr::Error> {
    Ok(ScVal::Symbol(ScSymbol(s.try_into()?)))
}

fn bytes(b: &[u8]) -> Result<ScVal, xdr::Error> {
    Ok(ScVal::Bytes(ScBytes(b.to_vec().try_into()?)))
}

fn scvec(items: Vec<ScVal>) -> Result<ScVal, xdr::Error> {
    Ok(ScVal::Vec(Some(ScVec(items.try_into()?))))
}

fn rule_ids_vec(rule_ids: &[u32]) -> Result<ScVal, xdr::Error> {
    scvec(rule_ids.iter().map(|id| ScVal::U32(*id)).collect())
}

/// `Signer::External(verifier, key)` as its contracttype tuple-enum ScVal.
fn external_signer_scval(verifier: &ScAddress, key: &[u8]) -> Result<ScVal, xdr::Error> {
    scvec(vec![
        sym("External")?,
        ScVal::Address(verifier.clone()),
        bytes(key)?,
    ])
}

/// `Signer::Delegated(addr)` as its contracttype tuple-enum ScVal.
fn delegated_signer_scval(addr: &ScAddress) -> Result<ScVal, xdr::Error> {
    scvec(vec![sym("Delegated")?, ScVal::Address(addr.clone())])
}

/// `Map<Signer, Bytes>` with the single (signer, signature) entry.
fn signers_map(signer: ScVal, signature: &[u8]) -> Result<ScVal, xdr::Error> {
    Ok(ScVal::Map(Some(ScMap::sorted_from(vec![(
        signer,
        bytes(signature)?,
    )])?)))
}

/// The `AuthPayload { context_rule_ids, signers }` ScMap. Symbol keys sort
/// `context_rule_ids < signers`, which `sorted_from` enforces.
fn auth_payload_scval(signers: ScVal, rule_ids: &[u32]) -> Result<ScVal, xdr::Error> {
    Ok(ScVal::Map(Some(ScMap::sorted_from(vec![
        (sym("context_rule_ids")?, rule_ids_vec(rule_ids)?),
        (sym("signers")?, signers),
    ])?)))
}

/// The classic builtin-account signature ScVal a CAP-71 delegate carries:
/// `[ { public_key, signature } ]` — same encoding the stock signer emits for
/// `G…` credentials.
fn account_signature_scval(pubkey: &[u8; 32], sig: &[u8; 64]) -> Result<ScVal, xdr::Error> {
    let map = ScMap::sorted_from(vec![
        (sym("public_key")?, bytes(pubkey)?),
        (sym("signature")?, bytes(sig)?),
    ])?;
    scvec(vec![ScVal::Map(Some(map))])
}

/// `sha256(signature_payload || XDR(ScVec[ScU32(id), …]))` — the OZ digest
/// (`storage.rs` `do_check_auth`) binds the selected rule ids into the signed
/// bytes so a relayer cannot downgrade to a weaker rule.
pub(crate) fn oz_auth_digest(
    signature_payload: &[u8; 32],
    rule_ids: &[u32],
) -> Result<[u8; 32], xdr::Error> {
    let ids_xdr = rule_ids_vec(rule_ids)?.to_xdr(Limits::none())?;
    let mut preimage = signature_payload.to_vec();
    preimage.extend_from_slice(&ids_xdr);
    Ok(Sha256::digest(&preimage).into())
}

fn address_credentials(
    entry: &SorobanAuthorizationEntry,
) -> Result<SorobanAddressCredentials, super::Error> {
    match &entry.credentials {
        SorobanCredentials::Address(creds) | SorobanCredentials::AddressV2(creds) => {
            Ok(creds.clone())
        }
        _ => Err(super::Error::InvalidAuthEntry {
            reason: "smart-account auth entry must carry an Address credential".to_string(),
            auth_entry_str: crate::log::format_auth_entry(entry),
        }),
    }
}

/// External mode: keep the `Address` (V1) credential, set its signature to the
/// OZ `AuthPayload` whose `External` signer signs the rule-bound digest.
async fn sign_external(
    entry: &SorobanAuthorizationEntry,
    sa: &SmartAccountAuth,
    verifier: &ScAddress,
    signature_expiration_ledger: u32,
    network_id: &Hash,
) -> Result<SorobanAuthorizationEntry, super::Error> {
    let creds = address_credentials(entry)?;
    let preimage = HashIdPreimage::SorobanAuthorization(HashIdPreimageSorobanAuthorization {
        network_id: network_id.clone(),
        invocation: entry.root_invocation.clone(),
        nonce: creds.nonce,
        signature_expiration_ledger,
    })
    .to_xdr(Limits::depth(XDR_DEPTH_LIMIT))?;
    let payload: [u8; 32] = Sha256::digest(preimage).into();
    let digest = oz_auth_digest(&payload, &sa.rule_ids)?;
    let sig = sa.signer.sign_payload(digest).await?.to_bytes();
    let pubkey = sa.signer.get_public_key()?.0;

    let signers = signers_map(external_signer_scval(verifier, &pubkey)?, &sig)?;
    Ok(SorobanAuthorizationEntry {
        root_invocation: entry.root_invocation.clone(),
        credentials: SorobanCredentials::Address(SorobanAddressCredentials {
            address: creds.address,
            nonce: creds.nonce,
            signature_expiration_ledger,
            signature: auth_payload_scval(signers, &sa.rule_ids)?,
        }),
    })
}

/// Delegated mode (CAP-71): rebuild the credential as `AddressWithDelegates`.
/// The account's own signature is the crypto-free `Delegated` `AuthPayload`; the
/// sole delegate is the signing key's G-account, whose classic signature covers
/// the `SorobanAuthorizationWithAddress` preimage (which binds the account
/// address, so a delegate signature cannot be replayed onto another account).
async fn sign_delegated(
    entry: &SorobanAuthorizationEntry,
    sa: &SmartAccountAuth,
    signature_expiration_ledger: u32,
    network_id: &Hash,
) -> Result<SorobanAuthorizationEntry, super::Error> {
    let creds = address_credentials(entry)?;
    let pubkey = sa.signer.get_public_key()?.0;
    let delegate = ScAddress::Account(AccountId(PublicKey::PublicKeyTypeEd25519(Uint256(pubkey))));

    let preimage = HashIdPreimage::SorobanAuthorizationWithAddress(
        HashIdPreimageSorobanAuthorizationWithAddress {
            network_id: network_id.clone(),
            nonce: creds.nonce,
            signature_expiration_ledger,
            address: creds.address.clone(),
            invocation: entry.root_invocation.clone(),
        },
    )
    .to_xdr(Limits::depth(XDR_DEPTH_LIMIT))?;
    let payload: [u8; 32] = Sha256::digest(preimage).into();
    let sig = sa.signer.sign_payload(payload).await?.to_bytes();

    let delegates = vec![SorobanDelegateSignature {
        address: delegate.clone(),
        signature: account_signature_scval(&pubkey, &sig)?,
        nested_delegates: VecM::default(),
    }];
    Ok(SorobanAuthorizationEntry {
        root_invocation: entry.root_invocation.clone(),
        credentials: SorobanCredentials::AddressWithDelegates(SorobanAddressCredentialsWithDelegates {
            address_credentials: SorobanAddressCredentials {
                address: creds.address,
                nonce: creds.nonce,
                signature_expiration_ledger,
                signature: auth_payload_scval(
                    signers_map(delegated_signer_scval(&delegate)?, &[])?,
                    &sa.rule_ids,
                )?,
            },
            delegates: delegates.try_into()?,
        }),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::signer::{LocalKey, SignerKind};
    use crate::print::Print;
    use crate::xdr::{
        InvokeContractArgs, SorobanAuthorizedFunction, SorobanAuthorizedInvocation,
    };

    const NETWORK: &str = "Test SDF Network ; September 2015";
    const VERIFIER: &str = "CD4IF75DNQJKCT35PAJAQDPW3K337EK6SJZDMQEVLXAH65K7ZVZMLXYN";

    fn network_id() -> Hash {
        Hash(Sha256::digest(NETWORK.as_bytes()).into())
    }

    fn contract_addr(byte: u8) -> ScAddress {
        ScAddress::Contract(crate::xdr::ContractId(Hash([byte; 32])))
    }

    fn local(seed: [u8; 32]) -> Signer {
        Signer {
            kind: SignerKind::Local(LocalKey {
                key: ed25519_dalek::SigningKey::from_bytes(&seed),
            }),
            print: Print::new(true),
        }
    }

    fn entry(account: ScAddress) -> SorobanAuthorizationEntry {
        SorobanAuthorizationEntry {
            credentials: SorobanCredentials::Address(SorobanAddressCredentials {
                address: account,
                nonce: 42,
                signature_expiration_ledger: 0,
                signature: ScVal::Void,
            }),
            root_invocation: SorobanAuthorizedInvocation {
                function: SorobanAuthorizedFunction::ContractFn(InvokeContractArgs {
                    contract_address: contract_addr(9),
                    function_name: ScSymbol("publish".try_into().unwrap()),
                    args: VecM::default(),
                }),
                sub_invocations: VecM::default(),
            },
        }
    }

    // Known-answer: the digest formula must be stable, since it is exactly what
    // the on-chain OZ verifier recomputes and checks the signature against.
    #[test]
    fn oz_auth_digest_is_stable() {
        let payload = [7u8; 32];
        let d1 = oz_auth_digest(&payload, &[5]).unwrap();
        let d2 = oz_auth_digest(&payload, &[5]).unwrap();
        assert_eq!(d1, d2);
        // Rule-id binding is live: a different rule id yields a different digest.
        assert_ne!(d1, oz_auth_digest(&payload, &[6]).unwrap());
        assert_ne!(d1, oz_auth_digest(&[8u8; 32], &[5]).unwrap());
    }

    #[tokio::test]
    async fn delegated_rebuilds_credential_as_address_with_delegates() {
        let signer = local([3u8; 32]);
        let pk = signer.get_public_key().unwrap().0;
        let sa = SmartAccountAuth {
            account: contract_addr(1),
            rule_ids: vec![3],
            mode: SaMode::Delegated,
            signer,
        };
        let e = entry(contract_addr(1));
        let expiration = 100;
        let signed = sa.sign(&e, expiration, &network_id()).await.unwrap();

        let SorobanCredentials::AddressWithDelegates(c) = &signed.credentials else {
            panic!("expected AddressWithDelegates, got {:?}", signed.credentials);
        };
        assert_eq!(c.address_credentials.signature_expiration_ledger, expiration);
        assert_eq!(c.address_credentials.nonce, 42);
        assert_eq!(c.delegates.len(), 1);
        // The sole delegate is the signing key's own G-account.
        assert_eq!(
            c.delegates[0].address,
            ScAddress::Account(AccountId(PublicKey::PublicKeyTypeEd25519(Uint256(pk)))),
        );
        // The account's own signature is the (crypto-free) Delegated AuthPayload,
        // and the root invocation is preserved unchanged.
        assert_eq!(signed.root_invocation, e.root_invocation);
    }

    // Follow-up (see theahaco/stellar-cli#26): add a dev-dep on the OZ
    // `stellar-accounts` fork + a verifier and replicate perch-deploy's live
    // `do_check_auth` acceptance test, plus byte goldens for the AuthPayload
    // encodings, to pin the full on-chain-accepted signature end to end.

    #[tokio::test]
    async fn external_keeps_address_and_signs_rule_bound_digest() {
        let verifier = ScAddress::Contract(crate::xdr::ContractId(Hash(
            match stellar_strkey::Strkey::from_string(VERIFIER).unwrap() {
                stellar_strkey::Strkey::Contract(c) => c.0,
                _ => panic!("bad verifier"),
            },
        )));
        let sa = SmartAccountAuth {
            account: contract_addr(1),
            rule_ids: vec![5],
            mode: SaMode::External {
                verifier: verifier.clone(),
            },
            signer: local([4u8; 32]),
        };
        let e = entry(contract_addr(1));
        let nid = network_id();
        let signed = sa.sign(&e, 100, &nid).await.unwrap();
        let SorobanCredentials::Address(_) = &signed.credentials else {
            panic!("external mode must keep the Address credential");
        };
    }
}
