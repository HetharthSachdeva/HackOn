"""v1 API routers. Each module owns one feature domain."""

from fastapi import APIRouter

from app.api.v1 import (
    addresses,
    admin,
    ai,
    auth,
    cart,
    catalog,
    delivery,
    health,
    missions,
    notifications,
    orders,
    payments,
    recommendations,
    reorders,
    reviews,
    tracking,
    ws,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(catalog.router)
api_router.include_router(addresses.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(payments.router)
api_router.include_router(delivery.router)
api_router.include_router(ai.router)
api_router.include_router(missions.router)
api_router.include_router(reorders.router)
api_router.include_router(recommendations.router)
api_router.include_router(reviews.router)
api_router.include_router(notifications.router)
api_router.include_router(ws.router)
api_router.include_router(tracking.router)
api_router.include_router(admin.router)

__all__ = ["api_router"]
