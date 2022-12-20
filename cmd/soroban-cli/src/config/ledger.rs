use soroban_ledger_snapshot::LedgerSnapshot;

use crate::{utils, HEADING_SANDBOX};

#[derive(Debug, clap::Args)]
pub struct Args {
    /// File to persist ledger state
    #[clap(
        long,
        parse(from_os_str),
        default_value(".soroban/ledger.json"),
        conflicts_with = "rpc-url",
        env = "SOROBAN_LEDGER_FILE",
        help_heading = HEADING_SANDBOX,
    )]
    ledger_file: std::path::PathBuf,
}

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("reading file {filepath}: {error}")]
    CannotReadLedgerFile {
        filepath: std::path::PathBuf,
        error: soroban_ledger_snapshot::Error,
    },

    #[error("committing file {filepath}: {error}")]
    CannotCommitLedgerFile {
        filepath: std::path::PathBuf,
        error: soroban_ledger_snapshot::Error,
    },
}

impl Args {
    pub fn read(&self) -> Result<LedgerSnapshot, Error> {
        utils::ledger_snapshot_read_or_default(&self.ledger_file).map_err(|e| {
            Error::CannotReadLedgerFile {
                filepath: self.ledger_file.clone(),
                error: e,
            }
        })
    }

    pub fn write(&self, state: &mut LedgerSnapshot) -> Result<(), Error> {
        state
            .write_file(&self.ledger_file)
            .map_err(|e| Error::CannotCommitLedgerFile {
                filepath: self.ledger_file.clone(),
                error: e,
            })
    }
}
