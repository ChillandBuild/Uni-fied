from pydantic import BaseModel


class LookupOut(BaseModel):
    id: int
    category: str
    value: str
    display_order: int

    model_config = {"from_attributes": True}
