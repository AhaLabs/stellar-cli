use podman_api::api::Volume;
use podman_api::models::{ContainerStatus, NamedVolume, PortMapping, Schema2HealthConfig};
use podman_api::opts::{ContainerListOpts, ContainerWaitOpts, VolumeCreateOpts, VolumeListOpts};
use podman_api::{
    opts::{self, VolumeListOptsBuilder},
    Podman,
};
use std::collections::HashMap;
use std::thread::sleep;

use testcontainers::{clients, core::WaitFor, Image};

const NAME: &str = "docker.io/stellar/quickstart";
const TAG: &str = "testing";
// const TAG: &str =
//     "soroban-dev@sha256:0ad51035cf7caba2fd99c7c1fad0945df6932be7d5c893e1520ccdef7d6a6ffe";

static ENV: &Map = &Map(phf::phf_map! {
    "ENABLE_SOROBAN_RPC"=> "true",
    "ENABLE_SOROBAN_DIAGNOSTIC_EVENTS" => "true",
    "ENABLE_LOGS" => "true",
    "NETWORK" => "local",
    "POSTGRES_PASSWORD" => "p",
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

pub async fn podman() -> podman_api::api::Container {
    let podman =
        Podman::unix("/Users/willem/.local/share/containers/podman/machine/qemu/podman.sock");
    let volume = podman.volumes().get("Stellar");
    let portmap = PortMapping {
        container_port: Some(8000),
        host_ip: None,
        host_port: Some(8000),
        protocol: None,
        range: None,
    };
    let volume = NamedVolume {
        dest: Some("/opt/stellar".to_string()),
        is_anonymous: None,
        name: Some("Stellar".to_string()),
        options: None,
    };

    let test = Some(vec!["curl".to_string(), 
        "--no-progress-meter".to_string(),
        "--fail-with-body".to_string(),
        "-X POST".to_string(),
        "http://localhost:8000/soroban/rpc".to_string(),
        "-H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"id\":8675,\"method\":\"getNetwork\"}'\"".to_string()]);

    let opts: opts::ContainerCreateOpts = opts::ContainerCreateOpts::builder()
        .image("docker.io/stellar/quickstart:testing")
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
    container
}

#[cfg(test)]
mod tests {

    use std::time::Duration;
    use podman_api::opts;
    use walkdir::WalkDir;

    use crate::TestEnv;
    use soroban_cli::rpc::Client;

    use super::Soroban;
    use testcontainers::{clients, Container};

    #[tokio::test]
    #[ignore]
    async fn podman_test() {
        let container = super::podman().await;
        let host_port = 8000;
        let url: String = format!("http://localhost:{host_port}/soroban/rpc");
        println!("{url}");
        let client = Client::new(&url).unwrap();

        for _ in 0..30 {
            super::sleep(Duration::from_millis(10));
            if client.get_network().await.is_ok() {
                break;
            }
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
        container
            .stop(&opts::ContainerStopOpts::builder().build())
            .await
            .unwrap();
        container.remove().await.unwrap();
    }

    #[tokio::test]
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
            super::sleep(Duration::from_secs(1));
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
