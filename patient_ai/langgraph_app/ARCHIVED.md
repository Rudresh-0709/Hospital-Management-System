This directory contains the old LangGraph-based patient AI implementation.

Status: ARCHIVED

Reason:
- The project migrated to an MCP-based implementation (`patient_ai.agent`) for
  more maintainable tool-calling and chat history handling.

What we did:
- The codebase was left in-place for reference and developer testing.
- Importing `patient_ai.langgraph_app` will emit a `DeprecationWarning` by
  default; set `ALLOW_LANGGRAPH_LEGACY_IMPORTS=1` to suppress the warning.

If you need to fully remove or restore this code:
- To restore runtime use, remove the deprecation warning in
  `patient_ai/langgraph_app/__init__.py` and ensure any importer points to
  `patient_ai.langgraph_app.graph_builder` as before.
- To fully archive (hide) the code, move this folder to a non-package
  location (e.g., `archive/langgraph_app`) and add a shim module to preserve
  imports if necessary.

Recommended: keep this folder read-only and update developer docs to point
to `patient_ai.agent` as the canonical runtime path.
