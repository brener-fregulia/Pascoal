use crate::language::pascal::{highlighting, HighlightSpan};

/// Use case: analyze a Pascal source document and return highlight spans.
/// Today this is just Tree-sitter highlighting; this is also where future
/// diagnostics/symbols analysis for the same document will be added.
pub fn analyze_document(source: &str) -> Result<Vec<HighlightSpan>, String> {
    highlighting::highlight(source)
}
