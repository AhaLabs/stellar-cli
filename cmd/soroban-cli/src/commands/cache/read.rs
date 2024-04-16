use std::{
    fs,
    path::{Path, PathBuf},
};

use clap::ValueEnum;
use ulid::Ulid;

use super::super::config::locator;
use crate::commands::config::data;

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error(transparent)]
    Config(#[from] locator::Error),
    #[error(transparent)]
    Data(#[from] data::Error),
    #[error(transparent)]
    Ulid(#[from] ulid::DecodeError),
    #[error("failed to find cache entry {0}")]
    NotFound(String),
    #[error(transparent)]
    SerdeJson(#[from] serde_json::Error),
}

#[derive(Debug, clap::Parser, Clone)]
#[group(skip)]
pub struct Cmd {
    /// ULID of the cache entry
    #[arg(long, visible_alias = "id")]
    ulid: String,
    #[arg(long)]
    output: Option<OutputType>,
}

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq, ValueEnum, Default)]
pub enum OutputType {
    // Status,
    #[default]
    Envelope,
    // ResultMeta,
    // Result,
}

impl Cmd {
    pub fn run(&self) -> Result<(), Error> {
        let file = self.file()?;
        tracing::debug!("reading file {}", file.display());
        let (action, _) = data::read(&self.ulid()?)?;
        let output = if self.output.is_some() {
            match action {
                data::Action::Transaction(sim) => sim.envelope_xdr.expect("missing envelope"),
                data::Action::Simulation(_) => todo!("Only read transactions"),
            }
        } else {
            serde_json::to_string_pretty(&action)?
        };
        println!("{output}");
        Ok(())
    }

    pub fn file(&self) -> Result<PathBuf, Error> {
        Ok(data::actions_dir()?.join(&self.ulid).with_extension("json"))
    }

    pub fn read_file(&self, file: &Path) -> Result<String, Error> {
        fs::read_to_string(file).map_err(|_| Error::NotFound(self.ulid.clone()))
    }

    pub fn ulid(&self) -> Result<Ulid, Error> {
        Ok(Ulid::from_string(&self.ulid)?)
    }
}
