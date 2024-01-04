from fastapi.routing import APIRouter

from skynftapi.web.api import docs, echo, monitoring, skymap

api_router = APIRouter()
api_router.include_router(monitoring.router)
api_router.include_router(docs.router)
api_router.include_router(echo.router, prefix="/echo", tags=["echo"])
api_router.include_router(skymap.router, prefix="/skymap", tags=["skymap"])
