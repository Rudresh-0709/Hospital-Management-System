"""
Legacy LangGraph-based patient AI package.

This package has been archived in favor of the MCP-based implementation
(`patient_ai.agent`). The source files remain in this directory for
reference and for developer tooling, but new runtime code should use the
MCP runner instead.

Importing modules from this package will still work, but a DeprecationWarning
is emitted to encourage migration. To explicitly silence this warning, set
the environment variable `ALLOW_LANGGRAPH_LEGACY_IMPORTS=1`.
"""
import os
import warnings

_archived = True
if os.getenv("ALLOW_LANGGRAPH_LEGACY_IMPORTS") != "1":
	warnings.warn(
		"patient_ai.langgraph_app is archived — use patient_ai.agent instead",
		DeprecationWarning,
		stacklevel=2,
	)

__all__ = ["graph_builder", "state", "nodes"]
