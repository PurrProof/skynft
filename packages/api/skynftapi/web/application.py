from importlib import metadata
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, UJSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from skynftapi.logging import configure_logging
from skynftapi.services.geocoding import GeocodingError
from skynftapi.web.api.router import api_router
from skynftapi.web.lifetime import register_shutdown_event, register_startup_event

APP_ROOT = Path(__file__).parent.parent


def get_app() -> FastAPI:
    """
    Get FastAPI application.

    This is the main constructor of an application.

    :return: application.
    """
    configure_logging()
    app = FastAPI(
        title="skynftapi",
        version=metadata.version("skynftapi"),
        docs_url=None,
        redoc_url=None,
        openapi_url="/api/openapi.json",
        default_response_class=UJSONResponse,
    )

    origins = [
        "http://localhost",
        "http://localhost:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: ValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()},
        )

    @app.exception_handler(GeocodingError)
    async def geocoding_timeout_exception_handler(
        request: Request,
        exc: GeocodingError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=503,  # 503 Service Unavailable
            content={"detail": str(exc)},
        )

    # Adds startup and shutdown events.
    register_startup_event(app)
    register_shutdown_event(app)

    # Main router for the API.
    app.include_router(router=api_router, prefix="/api")
    # Adds static directory.
    # This directory is used to access swagger files.
    app.mount(
        "/static",
        StaticFiles(directory=APP_ROOT / "static"),
        name="static",
    )

    return app
