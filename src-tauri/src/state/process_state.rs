pub struct ProcessState {
    pub writer: std::sync::Mutex<Option<Box<dyn std::io::Write + Send>>>,
    pub pid: std::sync::Mutex<Option<u32>>,
    pub generation: std::sync::atomic::AtomicU64,
}

impl ProcessState {
    pub fn new() -> Self {
        Self {
            writer: std::sync::Mutex::new(None),
            pid: std::sync::Mutex::new(None),
            generation: std::sync::atomic::AtomicU64::new(0),
        }
    }
}
