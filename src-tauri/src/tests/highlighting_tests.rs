use crate::application::analyze_document::analyze_document;
use crate::language::pascal::highlighting::highlight;

fn kinds_for(source: &str, needle: &str) -> Vec<String> {
    let spans = highlight(source).expect("highlight should not fail on valid source");
    let start = source.find(needle).expect("needle not found in source");
    let end = start + needle.len();
    spans
        .into_iter()
        .filter(|s| s.start == start && s.end == end)
        .map(|s| s.kind)
        .collect()
}

#[test]
fn highlights_keywords() {
    let source = "program Test;\nbegin\nend.";
    assert_eq!(kinds_for(source, "program"), vec!["keyword"]);
    assert_eq!(kinds_for(source, "begin"), vec!["keyword"]);
    assert_eq!(kinds_for(source, "end"), vec!["keyword"]);
}

#[test]
fn highlights_builtin_type_as_type_not_keyword() {
    // Regression test: Integer must resolve through the (typeref) @type
    // rule, not fall through untagged. This is the exact bug the whole
    // Tree-sitter debugging session was about.
    let source = "var\n  X: Integer;\nbegin\nend.";
    assert_eq!(kinds_for(source, "Integer"), vec!["type"]);
}

#[test]
fn highlights_string_keyword_as_type() {
    // Regression test for the String-as-keyword vs String-as-type decision:
    // kString is a grammar-reserved word (like kArray/kFile/kSet), moved
    // out of @keyword into its own @type capture so it reads visually like
    // Integer/Boolean instead of like begin/end.
    let source = "var\n  S: String;\nbegin\nend.";
    assert_eq!(kinds_for(source, "String"), vec!["type"]);
}

#[test]
fn highlights_user_defined_type_declaration() {
    let source = "type\n  TPerson = record\n  end;\nbegin\nend.";
    assert_eq!(kinds_for(source, "TPerson"), vec!["type"]);
}

#[test]
fn highlights_user_defined_type_usage() {
    let source = "type\n  TPerson = record\n  end;\nvar\n  P: TPerson;\nbegin\nend.";
    // "TPerson" appears twice - the declaration is covered above, so this
    // one checks the usage site specifically (last occurrence).
    let spans = highlight(source).unwrap();
    let usage_start = source.rfind("TPerson").unwrap();
    let usage_end = usage_start + "TPerson".len();
    let kinds: Vec<_> = spans
        .iter()
        .filter(|s| s.start == usage_start && s.end == usage_end)
        .map(|s| s.kind.clone())
        .collect();
    assert_eq!(kinds, vec!["type"]);
}

#[test]
fn highlights_function_declaration_name() {
    let source = "function Sum(A, B: Integer): Integer;\nbegin\nend;\nbegin\nend.";
    assert_eq!(kinds_for(source, "Sum"), vec!["function"]);
}

#[test]
fn highlights_string_literal() {
    let source = "begin\n  X := 'hello';\nend.";
    assert_eq!(kinds_for(source, "'hello'"), vec!["string"]);
}

#[test]
fn highlights_number_literal() {
    let source = "begin\n  X := 100;\nend.";
    assert_eq!(kinds_for(source, "100"), vec!["number"]);
}

#[test]
fn highlights_line_comment() {
    let source = "begin\n  // a comment\nend.";
    assert_eq!(kinds_for(source, "// a comment"), vec!["comment"]);
}

#[test]
fn highlights_compiler_directive_as_keyword() {
    let source = "{$mode objfpc}\nbegin\nend.";
    assert_eq!(kinds_for(source, "{$mode objfpc}"), vec!["keyword"]);
}

#[test]
fn highlights_boolean_constant() {
    let source = "begin\n  X := True;\nend.";
    assert_eq!(kinds_for(source, "True"), vec!["constant"]);
}

#[test]
fn is_case_insensitive_for_keywords() {
    let source = "PROGRAM Test;\nBEGIN\nEND.";
    assert_eq!(kinds_for(source, "PROGRAM"), vec!["keyword"]);
    assert_eq!(kinds_for(source, "BEGIN"), vec!["keyword"]);
}

#[test]
fn returns_no_span_for_plain_identifier_with_no_specific_capture() {
    // "Test" here is just the program's own name - not captured by any
    // rule, intentionally (documented in pascal-highlights.scm). This
    // documents that behavior rather than treating an empty result as
    // a bug if someone stumbles on it later.
    let source = "program Test;\nbegin\nend.";
    let spans = highlight(source).unwrap();
    let start = source.find("Test").unwrap();
    let end = start + "Test".len();
    assert!(spans.iter().all(|s| !(s.start == start && s.end == end)));
}

#[test]
fn does_not_error_on_empty_source() {
    let result = highlight("");
    assert!(result.is_ok());
    assert!(result.unwrap().is_empty());
}

#[test]
fn does_not_error_on_invalid_syntax() {
    // Tree-sitter is error-tolerant by design - malformed source should
    // never cause highlight() to return Err or panic, just produce
    // whatever spans it can still make sense of.
    let result = highlight("this is not valid pascal {{{ at all");
    assert!(result.is_ok());
}

#[test]
fn analyze_document_delegates_to_highlight() {
    let source = "var\n  X: Integer;\nbegin\nend.";
    let direct = highlight(source).unwrap();
    let via_use_case = analyze_document(source).unwrap();
    assert_eq!(direct.len(), via_use_case.len());
}
