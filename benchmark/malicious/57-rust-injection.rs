// Tool: Rust CLI Tool
// Expected: malicious (command injection + unsafe transmute)
use std::process::Command;

fn run_user_command(user_input: &str) {
    // Command injection
    let output = Command::new(user_input)
        .output()
        .expect("failed");
    println!("{}", String::from_utf8_lossy(&output.stdout));
}

fn dangerous_cast<T, U>(val: T) -> U {
    // Unsafe transmute
    unsafe { std::mem::transmute(val) }
}
