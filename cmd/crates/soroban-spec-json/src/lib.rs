use std::{fs, io};

pub mod types;

use sha2::{Digest, Sha256};

use stellar_xdr::curr::ScSpecEntry;
use types::Entry;

use soroban_spec::read::{from_wasm, FromWasmError};

#[derive(thiserror::Error, Debug)]
pub enum GenerateFromFileError {
    #[error("reading file: {0}")]
    Io(io::Error),
    #[error("sha256 does not match, expected: {expected}")]
    VerifySha256 { expected: String },
    #[error("parsing contract spec: {0}")]
    Parse(stellar_xdr::curr::Error),
    #[error("getting contract spec: {0}")]
    GetSpec(FromWasmError),
}

/// # Errors
///
/// Will return an error if the file cannot be read, or the wasm cannot be parsed.
pub fn generate_from_file(
    file: &str,
    verify_sha256: Option<&str>,
) -> Result<String, GenerateFromFileError> {
    // Read file.
    let wasm = fs::read(file).map_err(GenerateFromFileError::Io)?;

    // Produce hash for file.
    let sha256 = Sha256::digest(&wasm);
    let sha256 = format!("{sha256:x}");

    if let Some(verify_sha256) = verify_sha256 {
        if verify_sha256 != sha256 {
            return Err(GenerateFromFileError::VerifySha256 { expected: sha256 });
        }
    }

    // Generate code.
    let json = generate_from_wasm(&wasm).map_err(GenerateFromFileError::GetSpec)?;
    Ok(json)
}

/// # Errors
///
/// Will return an error if the wasm cannot be parsed.
pub fn generate_from_wasm(wasm: &[u8]) -> Result<String, FromWasmError> {
    let spec = from_wasm(wasm)?;
    let json = generate(&spec);
    Ok(json)
}

/// # Panics
///
/// If `serde_json::to_string_pretty` fails to serialize the spec entries.
pub fn generate(spec: &[ScSpecEntry]) -> String {
    let collected: Vec<_> = spec.iter().map(Entry::from).collect();
    serde_json::to_string_pretty(&collected).expect("serialization of the spec entries should not have any failure cases as all keys are strings and the serialize implementations are derived")
}

#[allow(clippy::too_many_lines)]
#[cfg(test)]
mod test {
    use pretty_assertions::assert_eq;
    use soroban_spec::read::from_wasm;

    use super::generate;

    const EXAMPLE_WASM: &[u8] =
        include_bytes!("../../../../target/wasm32v1-none/test-wasms/test_udt.wasm");

    #[test]
    fn example() {
        let entries = from_wasm(EXAMPLE_WASM).unwrap();
        let json = generate(&entries);
        assert_eq!(
            json,
            r#"[
  {
    "type": "enum",
    "doc": "",
    "name": "UdtEnum2",
    "cases": [
      {
        "doc": "",
        "name": "A",
        "value": 10
      },
      {
        "doc": "",
        "name": "B",
        "value": 15
      }
    ]
  },
  {
    "type": "union",
    "doc": "",
    "name": "UdtEnum",
    "cases": [
      {
        "doc": "",
        "name": "UdtA",
        "values": []
      },
      {
        "doc": "",
        "name": "UdtB",
        "values": [
          {
            "type": "custom",
            "name": "UdtStruct"
          }
        ]
      },
      {
        "doc": "",
        "name": "UdtC",
        "values": [
          {
            "type": "custom",
            "name": "UdtEnum2"
          }
        ]
      },
      {
        "doc": "",
        "name": "UdtD",
        "values": [
          {
            "type": "custom",
            "name": "UdtTuple"
          }
        ]
      }
    ]
  },
  {
    "type": "struct",
    "doc": "",
    "name": "UdtTuple",
    "fields": [
      {
        "doc": "",
        "name": "0",
        "value": {
          "type": "i64"
        }
      },
      {
        "doc": "",
        "name": "1",
        "value": {
          "type": "vec",
          "element": {
            "type": "i64"
          }
        }
      }
    ]
  },
  {
    "type": "struct",
    "doc": "",
    "name": "UdtStruct",
    "fields": [
      {
        "doc": "",
        "name": "a",
        "value": {
          "type": "i64"
        }
      },
      {
        "doc": "",
        "name": "b",
        "value": {
          "type": "i64"
        }
      },
      {
        "doc": "",
        "name": "c",
        "value": {
          "type": "vec",
          "element": {
            "type": "i64"
          }
        }
      }
    ]
  },
  {
    "type": "function",
    "doc": "",
    "name": "add",
    "inputs": [
      {
        "doc": "",
        "name": "a",
        "value": {
          "type": "custom",
          "name": "UdtEnum"
        }
      },
      {
        "doc": "",
        "name": "b",
        "value": {
          "type": "custom",
          "name": "UdtEnum"
        }
      }
    ],
    "outputs": [
      {
        "type": "i64"
      }
    ]
  }
]"#,
        );
    }
}
