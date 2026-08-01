use crate::state::ProcessState;
use std::sync::atomic::Ordering;

#[test]
fn new_process_state_starts_with_no_writer() {
    let state = ProcessState::new();
    let guard = state.writer.lock().unwrap();
    assert!(guard.is_none());
}

#[test]
fn new_process_state_starts_at_generation_zero() {
    let state = ProcessState::new();
    assert_eq!(state.generation.load(Ordering::SeqCst), 0);
}

#[test]
fn generation_can_be_incremented() {
    let state = ProcessState::new();
    let next = state.generation.fetch_add(1, Ordering::SeqCst) + 1;
    assert_eq!(next, 1);
    assert_eq!(state.generation.load(Ordering::SeqCst), 1);
}
