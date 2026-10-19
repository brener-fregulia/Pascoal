use crate::application::analyze_document::analyze_document;
use crate::language::pascal::HighlightSpan;

#[tauri::command(async)]
pub fn highlight_pascal(source: String) -> Result<Vec<HighlightSpan>, String> {
    analyze_document(&source)
}
