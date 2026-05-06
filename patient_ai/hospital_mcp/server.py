import asyncio
import json
from contextvars import ContextVar
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
import mcp.types as types

from .tools.appointments import (
    get_appointments,
    book_appointment,
    cancel_appointment,
    reschedule_appointment,
    get_available_slots,
)
from .tools.doctors import find_doctors, get_all_specialties
from .tools.patients import get_prescriptions, get_patient_info, get_admission_history
from .tools.knowledge import search_medical_knowledge, analyze_medical_image

server = Server("hospital-ai")

current_patient_id: ContextVar[int | None] = ContextVar("current_patient_id", default=None)


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_appointments",
            description=(
                "Get appointments for the currently authenticated patient. "
                "Use status='all' to get everything, or filter by "
                "'Scheduled', 'Completed', or 'Cancelled'."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["all", "Scheduled", "Completed", "Cancelled"],
                        "default": "all"
                    }
                }
            }
        ),
        types.Tool(
            name="get_available_slots",
            description=(
                "Get available appointment time slots for a specific doctor. "
                "Always call this before book_appointment to get valid slot strings. "
                "Returns slots in format 'YYYY-MM-DD at HH:MM'."
            ),
            inputSchema={
                "type": "object",
                "required": ["doctor_name"],
                "properties": {
                    "doctor_name": {
                        "type": "string",
                        "description": "Exact doctor name as returned by find_doctors"
                    },
                    "days_ahead": {
                        "type": "integer",
                        "default": 7,
                        "description": "How many days ahead to check for slots"
                    }
                }
            }
        ),
        types.Tool(
            name="book_appointment",
            description=(
                "Book an appointment for the current patient. "
                "You MUST call get_available_slots first and use an exact slot string from those results. "
                "Never guess or construct slot strings manually."
            ),
            inputSchema={
                "type": "object",
                "required": ["doctor_name", "slot", "purpose"],
                "properties": {
                    "doctor_name": {"type": "string"},
                    "slot": {
                        "type": "string",
                        "description": "Must be an exact value from get_available_slots. Format: YYYY-MM-DD at HH:MM"
                    },
                    "purpose": {
                        "type": "string",
                        "description": "Reason for the appointment, e.g. 'knee pain', 'follow-up checkup'"
                    }
                }
            }
        ),
        types.Tool(
            name="cancel_appointment",
            description=(
                "Cancel an appointment by its ID. "
                "Always call get_appointments first to find the correct appointment_id. "
                "Never guess appointment IDs."
            ),
            inputSchema={
                "type": "object",
                "required": ["appointment_id"],
                "properties": {
                    "appointment_id": {
                        "type": "integer",
                        "description": "The appointment_id from get_appointments results"
                    }
                }
            }
        ),
        types.Tool(
            name="reschedule_appointment",
            description=(
                "Reschedule an existing appointment to a new time slot. "
                "Call get_appointments to get the appointment_id, "
                "then call get_available_slots to get a valid new slot, "
                "then call this tool."
            ),
            inputSchema={
                "type": "object",
                "required": ["appointment_id", "new_slot"],
                "properties": {
                    "appointment_id": {"type": "integer"},
                    "new_slot": {
                        "type": "string",
                        "description": "Must be an exact value from get_available_slots. Format: YYYY-MM-DD at HH:MM"
                    }
                }
            }
        ),
        types.Tool(
            name="find_doctors",
            description=(
                "Find doctors by specialty or name. "
                "Use this when the patient mentions a condition (find by specialty) "
                "or when they mention a doctor's name (find by name). "
                "Call get_all_specialties first if you are unsure what specialties exist."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "specialty": {
                        "type": "string",
                        "description": "Medical specialty, e.g. 'Orthopedics', 'Cardiology'"
                    },
                    "name": {
                        "type": "string",
                        "description": "Partial or full doctor name"
                    }
                }
            }
        ),
        types.Tool(
            name="get_all_specialties",
            description="Get the full list of medical specialties available in this hospital.",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="get_prescriptions",
            description="Get all prescriptions and medicines for the current patient.",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="get_patient_info",
            description="Get basic profile information for the current patient: name, email, contact number.",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="get_admission_history",
            description="Get hospital admission history for the current patient.",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="search_medical_knowledge",
            description=(
                "Search the hospital's medical knowledge base for information about "
                "symptoms, diseases, treatments, and medications. "
                "Use this for any general medical questions."
            ),
            inputSchema={
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Medical query, e.g. 'symptoms of diabetes', 'treatment for hypertension'"
                    }
                }
            }
        ),
        types.Tool(
            name="analyze_medical_image",
            description=(
                "Analyze a medical image such as a skin condition photo, wound, or X-ray. "
                "Returns a clinical assessment of what is visible in the image."
            ),
            inputSchema={
                "type": "object",
                "required": ["image_base64"],
                "properties": {
                    "image_base64": {
                        "type": "string",
                        "description": "Base64-encoded image string"
                    }
                }
            }
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    patient_id = current_patient_id.get()

    patient_required = {
        "get_appointments",
        "book_appointment",
        "cancel_appointment",
        "reschedule_appointment",
        "get_prescriptions",
        "get_patient_info",
        "get_admission_history",
    }

    if name in patient_required and patient_id is None:
        return [types.TextContent(
            type="text",
            text=json.dumps({"error": "Authentication required. No patient ID in context."})
        )]

    try:
        if name == "get_appointments":
            result = get_appointments(patient_id, arguments.get("status", "all"))

        elif name == "get_available_slots":
            result = get_available_slots(
                arguments["doctor_name"],
                arguments.get("days_ahead", 7)
            )

        elif name == "book_appointment":
            result = book_appointment(
                patient_id,
                arguments["doctor_name"],
                arguments["slot"],
                arguments["purpose"]
            )

        elif name == "cancel_appointment":
            result = cancel_appointment(patient_id, int(arguments["appointment_id"]))

        elif name == "reschedule_appointment":
            result = reschedule_appointment(
                patient_id,
                int(arguments["appointment_id"]),
                arguments["new_slot"]
            )

        elif name == "find_doctors":
            result = find_doctors(
                specialty=arguments.get("specialty"),
                name=arguments.get("name")
            )

        elif name == "get_all_specialties":
            result = get_all_specialties()

        elif name == "get_prescriptions":
            result = get_prescriptions(patient_id)

        elif name == "get_patient_info":
            result = get_patient_info(patient_id)

        elif name == "get_admission_history":
            result = get_admission_history(patient_id)

        elif name == "search_medical_knowledge":
            result = search_medical_knowledge(arguments["query"])

        elif name == "analyze_medical_image":
            result = analyze_medical_image(arguments["image_base64"])

        else:
            result = {"error": f"Unknown tool: {name}"}

        return [types.TextContent(
            type="text",
            text=json.dumps(result, default=str)
        )]

    except KeyError as e:
        return [types.TextContent(
            type="text",
            text=json.dumps({"error": f"Missing required argument: {e}"})
        )]
    except Exception as e:
        import traceback
        traceback.print_exc()
        return [types.TextContent(
            type="text",
            text=json.dumps({"error": str(e)})
        )]


async def run():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="hospital-ai",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities={}
                )
            )
        )


if __name__ == "__main__":
    asyncio.run(run())