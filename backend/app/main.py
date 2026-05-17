from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.db import init_database

# Inventory modules
from app.modules.cylinders.router import router as cylinders_router
from app.modules.lookups.router import router as lookups_router
from app.modules.procurement.vendors.router import router as vendors_router
from app.modules.procurement.purchase_requisitions.router import router as prs_router
from app.modules.procurement.rfqs.router import router as rfqs_router
from app.modules.procurement.purchase_orders.router import router as pos_router
from app.modules.procurement.goods_receipts.router import router as grns_router
from app.modules.procurement.purchase_invoices.router import router as invoices_router
from app.modules.inventory.tanks.router import router as tanks_router
from app.modules.inventory.tank_readings.router import router as tank_readings_router

# Task 12: Gas procurement, issues, loss records
from app.modules.inventory.gas_procurement.router import router as gas_procurement_router
from app.modules.inventory.gas_issues.router import router as gas_issues_router
from app.modules.inventory.loss_records.router import router as loss_records_router
from app.modules.inventory.tank_inventory_transactions.router import router as tank_inventory_transactions_router

# Task 13: Cylinder filling, movement, dispatch, returns
from app.modules.inventory.cylinder_filling.router import router as cylinder_filling_router
from app.modules.inventory.cylinder_movement.router import router as cylinder_movement_router
from app.modules.inventory.dispatch.router import router as dispatch_router
from app.modules.inventory.cylinder_returns.router import router as cylinder_returns_router

# Tasks 14 & 15: Production modules
from app.modules.production.gas_production.router import router as gas_production_router
from app.modules.production.safety.router import router as safety_router
from app.modules.production.batches.router import router as batches_router

# Task 16: Dashboard
from app.modules.dashboard.router import router as dashboard_router

# Monitoring
from app.modules.monitoring.router import router as monitoring_router
from app.modules.tracker.router import router as tracker_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    redirect_slashes=False, # Disable automatic trailing slash redirects to avoid CORS issues
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins in development to avoid CORS issues with redirects
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

# Core
app.include_router(cylinders_router, prefix=API_PREFIX)
app.include_router(lookups_router, prefix=API_PREFIX)

# Procurement
app.include_router(vendors_router, prefix=API_PREFIX)
app.include_router(prs_router, prefix=API_PREFIX)
app.include_router(rfqs_router, prefix=API_PREFIX)
app.include_router(pos_router, prefix=API_PREFIX)
app.include_router(grns_router, prefix=API_PREFIX)
app.include_router(invoices_router, prefix=API_PREFIX)

# Inventory
app.include_router(tanks_router, prefix=API_PREFIX)
app.include_router(tank_readings_router, prefix=API_PREFIX)
app.include_router(gas_procurement_router, prefix=API_PREFIX)
app.include_router(gas_issues_router, prefix=API_PREFIX)
app.include_router(loss_records_router, prefix=API_PREFIX)
app.include_router(tank_inventory_transactions_router, prefix=API_PREFIX)
app.include_router(cylinder_filling_router, prefix=API_PREFIX)
app.include_router(cylinder_movement_router, prefix=API_PREFIX)
app.include_router(dispatch_router, prefix=API_PREFIX)
app.include_router(cylinder_returns_router, prefix=API_PREFIX)

# Production
app.include_router(gas_production_router, prefix=API_PREFIX)
app.include_router(safety_router, prefix=API_PREFIX)
app.include_router(batches_router, prefix=API_PREFIX)

# Dashboard
app.include_router(dashboard_router, prefix=API_PREFIX)

# Monitoring
app.include_router(monitoring_router, prefix=API_PREFIX)
app.include_router(tracker_router, prefix=API_PREFIX)


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}

