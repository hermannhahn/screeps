import _ from 'lodash';

/**
 * Manager responsible for market operations (buying/selling resources).
 */
const managerMarket = {
    run: function() {
        // Run every 10 ticks to save CPU
        if (Game.time % 10 !== 0) return;

        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            const terminal = room.terminal;

            // Only process rooms with a terminal that is mine and ready
            if (terminal && terminal.my && terminal.cooldown === 0) {
                this.handleEnergySales(room, terminal);
            }
        }
    },

    /**
     * Sells excess energy if the terminal has enough and there are good orders.
     */
    handleEnergySales: function(room: Room, terminal: StructureTerminal) {
        const energyInTerminal = terminal.store[RESOURCE_ENERGY];
        
        // Thresholds
        const MIN_ENERGY_TO_SELL = 50000; // Only sell if we have more than this
        const RESERVE_ENERGY = 30000;    // Keep at least this much in terminal
        
        if (energyInTerminal < MIN_ENERGY_TO_SELL) return;

        const amountToSell = Math.min(energyInTerminal - RESERVE_ENERGY, 10000); // Sell in chunks of 10k

        // Find best energy buy orders
        const orders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_ENERGY });
        
        if (orders.length === 0) return;

        // Sort by price (highest first) and then by distance
        const bestOrders = _.sortBy(orders, [
            (o) => -o.price,
            (o) => Game.map.getRoomLinearDistance(room.name, o.roomName || '')
        ]);

        const bestOrder = bestOrders[0];

        // Check if the price is acceptable (e.g., > 0.001 credits)
        // Note: Prices vary wildly depending on the server/season.
        if (bestOrder && bestOrder.price > 0) {
            const result = Game.market.deal(bestOrder.id, amountToSell, room.name);
            if (result === OK) {
                console.log(`[Market] Sold ${amountToSell} energy to ${bestOrder.roomName} at price ${bestOrder.price} in room ${room.name}`);
            } else {
                // console.log(`[Market] Failed to sell energy in ${room.name}: ${result}`);
            }
        }
    }
};

export default managerMarket;
