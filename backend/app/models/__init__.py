"""SQLAlchemy ORM models.

Importing this package eagerly imports every model module so that
:class:`app.core.database.Base.metadata` knows about all tables at the time
Alembic introspects it.
"""

from app.models.address import Address  # noqa: F401
from app.models.cart import Cart, CartItem  # noqa: F401
from app.models.delivery import Delivery, DeliveryStatus, SlotType  # noqa: F401
from app.models.mission import Mission  # noqa: F401
from app.models.notification import Notification, NotificationType  # noqa: F401
from app.models.order import Order, OrderItem, OrderStatus  # noqa: F401
from app.models.payment import Payment, PaymentProvider, PaymentStatus  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.reorder import ReorderStatus, ReorderSubscription  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.user_preference import UserPreference  # noqa: F401
