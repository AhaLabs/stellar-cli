use podman_api::models::{PortMapping, Schema2HealthConfig};
use podman_api::opts::{ContainerListOpts, VolumeListOpts};
use podman_api::{
    opts::{self},
    Podman,
};
use soroban_cli::rpc::Client;
use std::collections::HashMap;
use std::time::Duration;

use testcontainers::{clients, core::WaitFor, Image};

const NAME: &str = "stellar/quickstart";
// const TAG: &str = "latest";
const TAG: &str = "latest:sha256:742a649d5d9be826dd4b1a378c95b0e1833e1bcb08c3f4b9b9a8cdd03da653e3";

static ENV: &Map = &Map(phf::phf_map! {
    "ENABLE_SOROBAN_RPC"=> "true",
    "ENABLE_SOROBAN_DIAGNOSTIC_EVENTS" => "true",
    "ENABLE_LOGS" => "true",
    "NETWORK" => "local",
    // "POSTGRES_PASSWORD" => "p",
    "LIMITS" => "testnet",
});
struct Map(phf::Map<&'static str, &'static str>);


impl From<&Map> for HashMap<String, String> {
    fn from(Map(map): &Map) -> Self {
        map.into_iter()
            .map(|(a, b)| ((*a).to_string(), (*b).to_string()))
            .collect()
    }
}

#[derive(Debug, Default)]
pub struct Soroban(HashMap<String, String>, HashMap<String, String>);

impl Soroban {
    pub fn new() -> Self {
        #[allow(unused_mut)]
        let mut volumes = HashMap::new();
        // volumes.insert("/home/willem/c/s/soroban-tools/opt/stellar".to_string(), "/opt/stellar".to_string());
        Soroban(ENV.into(), volumes)
    }
}

impl Image for Soroban {
    type Args = ();

    fn name(&self) -> String {
        NAME.to_owned()
    }

    fn tag(&self) -> String {
        TAG.to_owned()
    }

    fn expose_ports(&self) -> Vec<u16> {
        vec![8000, 11626]
    }

    fn ready_conditions(&self) -> Vec<WaitFor> {
        // vec![WaitFor::seconds(30)]

        vec![WaitFor::message_on_stdout("friendbot: started")]
    }

    fn env_vars(&self) -> Box<dyn Iterator<Item = (&String, &String)> + '_> {
        Box::new(self.0.iter())
    }

    fn volumes(&self) -> Box<dyn Iterator<Item = (&String, &String)> + '_> {
        Box::new(self.1.iter())
    }
}

pub fn docker() -> clients::Cli {
    clients::Cli::default()
}

pub fn start(client: &clients::Cli) -> testcontainers::Container<'_, Soroban> {
    client.run(Soroban::new())
}

pub async fn podman(port: Option<u16>) -> (podman_api::api::Container, String) {
    let podman = Podman::unix("/run/user/1001/podman/podman.sock");
    let _volume = podman.volumes().get("Stellar");
    let host_port = port.unwrap_or(8001);
    let portmap = PortMapping {
        container_port: Some(8000),
        host_ip: None,
        host_port: Some(host_port),
        protocol: None,
        range: None,
    };
    // let _volume = NamedVolume {
    //     dest: Some("/opt/stellar".to_string()),
    //     is_anonymous: None,
    //     name: Some("Stellar".to_string()),
    //     options: None,
    // };

    let test = Some(vec!["curl".to_string(), 
        "--no-progress-meter".to_string(),
        "--fail-with-body".to_string(),
        "-X POST".to_string(),
        "http://localhost:8001/soroban/rpc".to_string(),
        "-H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"id\":8675,\"method\":\"getNetwork\"}'\"".to_string()]);

    let opts: opts::ContainerCreateOpts = opts::ContainerCreateOpts::builder()
        .image(format!("{NAME}/{TAG}"))
        .name("stellar-test")
        .env(ENV.0.into_iter())
        .portmappings([portmap])
        // .volumes([volume])
        .health_config(Schema2HealthConfig {
            interval: Some(30),
            retries: Some(3),
            start_period: Some(0),
            timeout: Some(3_000_000_000),
            test,
        })
        .build();
    let container = podman.containers().create(&opts).await.unwrap();
    println!("ID: {}", container.id);
    let url: String = format!("http://localhost:{host_port}/soroban/rpc");
    let client: Client = Client::new(&url).unwrap();

    let container = podman.containers().get(container.id);

    println!(
        r#"
            {:#?}
            {:#?}
            {:#?}
            "#,
        container,
        podman
            .volumes()
            .list(&VolumeListOpts::builder().build())
            .await,
        podman
            .containers()
            .list(&ContainerListOpts::builder().build())
            .await
    );
    container.start(Some("rm".to_string())).await.unwrap();
    for i in 0..100 {
        println!("Trying {i}");
        std::thread::sleep(Duration::from_millis(500));
        if client.get_network().await.is_ok() {
            break;
        }
    }
    (container, url)
}

#[cfg(test)]

mod tests {

    use podman_api::opts;
    use std::time::Duration;
    use walkdir::WalkDir;

    use crate::TestEnv;
    use soroban_cli::rpc::Client;

    use super::Soroban;
    use testcontainers::clients;

    #[tokio::test]
    #[ignore]
    async fn podman_test() {
        let (container, url) = super::podman(None).await;

        println!("{url}");

        std::env::set_var("SOROBAN_RPC_URL", url);
        std::env::set_var(
            "SOROBAN_NETWORK_PASSPHRASE",
            "Standalone Network ; February 2017",
        );
        let env = TestEnv::default();
        let dir = env.dir();
        // list all files recursively from dir including in hidden folders
        for entry in WalkDir::new(dir) {
            println!("{}", entry.unwrap().path().display());
        }
        container
            .stop(&opts::ContainerStopOpts::builder().build())
            .await
            .unwrap();
        container.remove().await.unwrap();
    }

    #[tokio::test]
    #[ignore]
    async fn testcontainers_work() {
        let _ = pretty_env_logger::try_init();
        let docker = clients::Cli::default();
        let node = docker.run(Soroban::new());
        // return;
        // let host_port = 8000;
        let host_port = node.get_host_port_ipv4(8000);
        let url: String = format!("http://localhost:{host_port}/soroban/rpc");
        println!("{url}");
        let client = Client::new(&url).unwrap();

        for _ in 0..10 {
            std::thread::sleep(Duration::from_secs(1));
            println!("{:#?}", client.get_network().await);
        }
        std::env::set_var("SOROBAN_RPC_URL", url);
        std::env::set_var(
            "SOROBAN_NETWORK_PASSPHRASE",
            "Standalone Network ; February 2017",
        );
        let env = TestEnv::default();
        let dir = env.dir();
        // list all files recursively from dir including in hidden folders
        for entry in WalkDir::new(dir) {
            println!("{}", entry.unwrap().path().display());
        }
    }
}
