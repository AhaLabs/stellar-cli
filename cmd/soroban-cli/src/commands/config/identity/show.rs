use super::super::{locator, secret};
use clap::arg;

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error(transparent)]
    Config(#[from] locator::Error),

    #[error(transparent)]
    Secret(#[from] secret::Error),

    #[error(transparent)]
    StrKey(#[from] stellar_strkey::DecodeError),
}

#[derive(Debug, clap::Parser, Clone)]
#[group(skip)]
pub struct Cmd {
    /// Name of identity to lookup, default is test identity
    pub name: Option<String>,

    /// If identity is a seed phrase use this hd path, default is 0
    #[arg(long)]
    pub hd_path: Option<usize>,

    #[command(flatten)]
    pub locator: locator::Args,
}

impl Cmd {
    pub fn run(&self) -> Result<(), Error> {
        println!("{}", self.private_key()?.to_string());
        Ok(())
    }

    pub fn private_key(&self) -> Result<stellar_strkey::ed25519::PrivateKey, Error> {
        Ok(if let Some(name) = &self.name {
            self.locator.read_identity(name)?
        } else {
            secret::Secret::test_seed_phrase()?
        }
        .private_key(self.hd_path)?)
    }
}
