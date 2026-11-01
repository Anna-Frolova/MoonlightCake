import { creamStation } from './cream';
import { glazeStation } from './glaze';
import { layersStation } from './layers';
import { magicStation } from './magic';
import type { Station } from './station';
import { toppingsStation } from './toppings';

/** Kitchen stations in tab order (index = `runtime.station`). */
export const STATIONS: Station[] = [layersStation, creamStation, glazeStation, toppingsStation, magicStation];

/** Index of the glaze station: the kitchen layout changes while it is open. */
/** Index of the toppings station: the order picture drops its magic there, so the toppings show. */
export const TOPPINGS_STATION_INDEX = STATIONS.indexOf(toppingsStation);
export const GLAZE_STATION_INDEX = STATIONS.indexOf(glazeStation);
