use std::sync::{Arc, Mutex};

use std::{cell::RefCell, rc::Rc};
use testcontainers::{
    clients::{self, Cli},
    core::Container,
    GenericImage,
};

struct MyContainer {
    container: Container<'static, GenericImage>,
}

impl MyContainer {
    fn new() -> Self {
        let docker = clients::Cli::default();
        let image = GenericImage::default();
        let container = docker.run(image);

        MyContainer { container }
    }

    fn id(&self) -> &str {
        self.container.id()
    }
}

mod test {
    use super::*;

    #[test]
    fn test_this() {
        let my_container = MyContainer::new();

        // Use the container
        println!("Container ID: {}", my_container.id());
    
    }
}
