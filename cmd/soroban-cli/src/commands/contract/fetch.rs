use std::convert::Infallible;

use std::io::Write;
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::{fmt::Debug, fs, io};

use clap::{arg, command, Parser};

use crate::commands::{global, NetworkRunnable};
use crate::config::{
    self, locator,
    network::{self, Network},
};
use crate::{
    rpc::{self, Client},
    Pwd,
};

#[derive(Parser, Debug, Default, Clone)]
#[allow(clippy::struct_excessive_bools)]
#[group(skip)]
pub struct Cmd {
    /// Contract ID to fetch
    #[arg(long = "id", env = "STELLAR_CONTRACT_ID")]
    pub contract_id: String,
    /// Where to write output otherwise stdout is used
    #[arg(long, short = 'o')]
    pub out_file: Option<std::path::PathBuf>,
    #[command(flatten)]
    pub locator: locator::Args,
    #[command(flatten)]
    pub network: network::Args,
}

impl FromStr for Cmd {
    type Err = clap::error::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        use clap::{CommandFactory, FromArgMatches};
        Self::from_arg_matches_mut(&mut Self::command().get_matches_from(s.split_whitespace()))
    }
}

impl Pwd for Cmd {
    fn set_pwd(&mut self, pwd: &Path) {
        self.locator.set_pwd(pwd);
    }
}

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error(transparent)]
    Rpc(#[from] rpc::Error),
    #[error(transparent)]
    Config(#[from] config::Error),
    #[error(transparent)]
    Locator(#[from] locator::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("reading file {0:?}: {1}")]
    CannotWriteContractFile(PathBuf, io::Error),
    #[error(transparent)]
    Network(#[from] network::Error),
    #[error("cannot create contract directory for {0:?}")]
    CannotCreateContractDir(PathBuf),
}

impl From<Infallible> for Error {
    fn from(_: Infallible) -> Self {
        unreachable!()
    }
}

impl Cmd {
    pub async fn run(&self) -> Result<(), Error> {
        let bytes = self.get_bytes().await?;
        if let Some(out_file) = &self.out_file {
            if let Some(parent) = out_file.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent)
                        .map_err(|_| Error::CannotCreateContractDir(out_file.clone()))?;
                }
            }
            fs::write(out_file, bytes)
                .map_err(|io| Error::CannotWriteContractFile(out_file.clone(), io))
        } else {
            let stdout = std::io::stdout();
            let mut handle = stdout.lock();
            handle.write_all(&bytes)?;
            handle.flush()?;
            Ok(())
        }
    }

    pub async fn get_bytes(&self) -> Result<Vec<u8>, Error> {
        self.run_against_rpc_server(None, None).await
    }

    pub fn network(&self) -> Result<Network, Error> {
        Ok(self.network.get(&self.locator)?)
    }

    fn contract_id(&self) -> Result<[u8; 32], Error> {
        let network = self.network()?;
        Ok(self
            .locator
            .resolve_contract_id(&self.contract_id, &network.network_passphrase)?
            .0)
    }
}

#[async_trait::async_trait]
impl NetworkRunnable for Cmd {
    type Error = Error;
    type Result = Vec<u8>;
    async fn run_against_rpc_server(
        &self,
        _args: Option<&global::Args>,
        config: Option<&config::Args>,
    ) -> Result<Vec<u8>, Error> {
        let network = config.map_or_else(|| self.network(), |c| Ok(c.get_network()?))?;
        tracing::trace!(?network);
        let contract_id = self.contract_id()?;
        let client = Client::new(&network.rpc_url)?;
        client
            .verify_network_passphrase(Some(&network.network_passphrase))
            .await?;
        Ok(client.get_remote_wasm(&contract_id).await?)
    }
}
