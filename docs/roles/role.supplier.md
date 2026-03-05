# Logistics Logic (Supplier)

The `role.supplier.ts` module handles the distribution of energy throughout the room.

## Strategy
- **Energy Collection**: Prioritizes collecting dropped energy near sources (from Harvesters) or from Containers/Storage.
- **Delivery Priority**:
    1. **Spawns & Extensions**: Ensuring the room can always produce more creeps.
    2. **Towers**: For defense and vital repairs.
    3. **Controller Containers**: (Future) Supplying dedicated energy for Upgraders.

## Efficiency
- Suppliers are designed with more `CARRY` and `MOVE` parts to move large amounts of energy quickly.
