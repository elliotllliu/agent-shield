// Tool: Rust String Utils (legitimate)
// Expected: benign (pure functions)
pub fn reverse(s: &str) -> String {
    s.chars().rev().collect()
}

pub fn word_count(s: &str) -> usize {
    s.split_whitespace().count()
}

pub fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(c) => c.to_uppercase().to_string() + chars.as_str(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_reverse() {
        assert_eq!(reverse("hello"), "olleh");
    }
}
