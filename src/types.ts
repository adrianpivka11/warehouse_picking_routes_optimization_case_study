export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface ProductPosition extends Position {
  productId: string;
  positionId: string;
  quantity: number;
}

export interface PickingRequest {
  products: string[];
  startingPosition: Position;
}

export interface PickingStop {
  productId: string;
  positionId: string;
}

export interface PickingResult {
  distance: number;
  pickingOrder: PickingStop[];
}
