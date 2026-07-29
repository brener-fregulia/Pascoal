use tree_sitter_highlight::{Highlight, HighlightConfiguration, HighlightEvent, Highlighter};

const HIGHLIGHTS_QUERY: &str = include_str!("./pascal-highlights.scm");

const HIGHLIGHT_NAMES: &[&str] = &[
    "keyword",
    "punctuation.bracket",
    "punctuation.delimiter",
    "operator",
    "constant",
    "number",
    "string",
    "comment",
    "type",
    "type.parameter",
    "function",
    "variable",
    "variable.parameter",
    "identifier",
];

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HighlightSpan {
    pub start: usize,
    pub end: usize,
    pub kind: String,
}

/// Runs Tree-sitter highlighting over Pascal source and returns the
/// resolved spans. Pure function - no Tauri state, no IPC concerns.
/// The Tauri command boundary lives in `commands::language_commands`.
pub fn highlight(source: &str) -> Result<Vec<HighlightSpan>, String> {
    let mut config = HighlightConfiguration::new(
        tree_sitter_pascal::LANGUAGE.into(),
        "pascal",
        HIGHLIGHTS_QUERY,
        "",
        "",
    )
    .map_err(|e| e.to_string())?;

    config.configure(HIGHLIGHT_NAMES);

    let mut highlighter = Highlighter::new();
    let events = highlighter
        .highlight(&config, source.as_bytes(), None, |_| None)
        .map_err(|e| e.to_string())?;

    let mut spans = Vec::new();
    let mut stack: Vec<usize> = Vec::new();

    for event in events {
        match event.map_err(|e| e.to_string())? {
            HighlightEvent::HighlightStart(Highlight(idx)) => stack.push(idx),
            HighlightEvent::HighlightEnd => {
                stack.pop();
            }
            HighlightEvent::Source { start, end } => {
                if let Some(&idx) = stack.last() {
                    spans.push(HighlightSpan {
                        start,
                        end,
                        kind: HIGHLIGHT_NAMES[idx].to_string(),
                    });
                }
            }
        }
    }

    Ok(spans)
}
