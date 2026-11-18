/** Shared types for requests, warehouse positions, and route results. */

/** A point in the warehouse's 3D coordinate system. */
export interface Position {
  x: number;
  y: number;
  z: number;
}

/** A product's storage position and the quantity available there. */
export interface ProductPosition extends Position {
  productId: string;
  positionId: string;
  quantity: number;
}

/** The products to pick and the worker's starting position. */
export interface PickingRequest {
  products: string[];
  startingPosition: Position;
}

/** One product and the storage position chosen for it. */
export interface PickingStop {
  productId: string;
  positionId: string;
}

/** The total distance and ordered stops of the selected route. */
export interface PickingResult {
  distance: number;
  pickingOrder: PickingStop[];
}
