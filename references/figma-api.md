# Figma API / MCP Reference

This reference groups the currently relevant Figma capabilities for `figma-agent`.

## Direct / Read-oriented capabilities
Use these when the user wants to inspect, understand, compare, or extract information from an existing design.

- `figma__get_design_context`
- `figma__get_screenshot`
- `figma__get_metadata`
- `figma__get_variable_defs`
- `figma__search_design_system`
- `figma__get_figjam`
- `figma__get_code_connect_map`
- `figma__get_code_connect_suggestions`
- `figma__whoami`

## Write-oriented capabilities
These are relevant when a design must be changed or newly created. In the current architecture they should be treated as part of the CC/ACP write path.

- `use_figma`
- `create_new_file`
- `generate_figma_design`
- `generate_diagram`
- `add_code_connect_map`
- `send_code_connect_mappings`
- `create_design_system_rules`

## Product rule
The user should experience a unified skill, but internally the system should route:
- read / inspect → direct path
- write / edit / create → CC/ACP path

## Important note
This file is a working skill reference, not a full vendor-complete protocol dump. Keep it focused on what `figma-agent` actually needs to route and explain its behavior.
